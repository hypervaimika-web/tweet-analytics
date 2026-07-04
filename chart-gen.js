const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data.json');
const outputPath = path.join(__dirname, 'engagement-chart.svg');
const rawData = fs.readFileSync(dataPath, 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(rawData);
const tweets = Array.isArray(data.tweets) ? [...data.tweets] : [];
const sortedTweets = tweets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

function engagement(tweet) {
    return Number(tweet.likes || 0) + Number(tweet.retweets || 0) + Number(tweet.replies || 0);
}

function escapeXml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function pointFor(tweet, index, total, maxEngagement) {
    const width = 640;
    const height = 320;
    const padding = 42;
    const x = total <= 1
        ? width / 2
        : padding + (index / (total - 1)) * (width - padding * 2);
    const y = height - padding - (engagement(tweet) / maxEngagement) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
}

const maxEngagement = Math.max(...sortedTweets.map(engagement), 1);
const points = sortedTweets
    .map((tweet, index) => pointFor(tweet, index, sortedTweets.length, maxEngagement))
    .join(' ');
const latestLabel = sortedTweets.length > 0
    ? new Date(sortedTweets[sortedTweets.length - 1].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'No tweets';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="690" height="434" viewBox="0 0 690 434" role="img" aria-labelledby="title desc">
  <title id="title">Tweet Engagement Over Time</title>
  <desc id="desc">Engagement chart generated from data.json</desc>
  <rect width="690" height="434" rx="16" fill="#111827"/>
  <text x="36" y="48" fill="#f9fafb" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="700">Tweet Engagement Over Time</text>
  <text x="36" y="76" fill="#9ca3af" font-family="Inter, Arial, sans-serif" font-size="14">Latest point: ${escapeXml(latestLabel)}</text>
  <line x1="42" y1="360" x2="650" y2="360" stroke="#374151"/>
  <line x1="42" y1="42" x2="42" y2="360" stroke="#374151"/>
  <text x="50" y="108" fill="#a78bfa" font-family="Inter, Arial, sans-serif" font-size="13">Max ${maxEngagement}</text>
  <polyline points="${points}" fill="none" stroke="#a78bfa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  ${sortedTweets.map((tweet, index) => {
    const [x, y] = pointFor(tweet, index, sortedTweets.length, maxEngagement).split(',');
    return `<circle cx="${x}" cy="${y}" r="4" fill="#22c55e"><title>${escapeXml(engagement(tweet))} engagements</title></circle>`;
  }).join('\n  ')}
</svg>
`;

fs.writeFileSync(outputPath, svg);
console.log(`Chart generated at: ${outputPath}`);
