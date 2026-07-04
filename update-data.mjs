// update-data.mjs - Xquik export to Tweet Analytics dashboard data
import fs from 'node:fs/promises';
import path from 'node:path';

const TEXT_FIELDS = ['text', 'full_text', 'content', 'body', 'tweetText'];
const DATE_FIELDS = ['createdAt', 'created_at', 'created', 'date', 'timestamp'];

function parseArgs(argv) {
  const options = {
    input: process.env.XQUIK_EXPORT_PATH || '',
    limit: 20,
    output: path.join(process.cwd(), 'data.json'),
    username: process.env.XQUIK_EXPORT_USERNAME || 'Strakyo',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--limit') {
      options.limit = Number.parseInt(argv[index + 1] || '', 10);
      index += 1;
    } else if (arg === '--output') {
      options.output = argv[index + 1] || options.output;
      index += 1;
    } else if (arg === '--username') {
      options.username = argv[index + 1] || options.username;
      index += 1;
    } else if (!arg.startsWith('--') && !options.input) {
      options.input = arg;
    }
  }

  return options;
}

async function readExport(inputPath) {
  const raw = (await fs.readFile(inputPath, 'utf8')).replace(/^\uFEFF/, '').trim();
  if (!raw) {
    return [];
  }

  if (inputPath.toLowerCase().endsWith('.jsonl')) {
    return raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }

  const payload = JSON.parse(raw);
  if (Array.isArray(payload)) {
    return payload;
  }
  for (const key of ['tweets', 'data', 'results', 'items']) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }
  throw new Error('Unsupported Xquik export shape. Expected a tweet array.');
}

function firstString(row, fields) {
  for (const field of fields) {
    const value = row[field];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function numberFrom(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateFrom(row) {
  const rawDate = firstString(row, DATE_FIELDS);
  const parsed = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function idFrom(row, index) {
  return String(row.id || row.tweet_id || row.tweetId || `xquik-${index + 1}`);
}

function usernameFrom(row, fallbackUsername) {
  if (row.author && typeof row.author.username === 'string') {
    return row.author.username.replace(/^@/, '');
  }
  if (typeof row.username === 'string') {
    return row.username.replace(/^@/, '');
  }
  return fallbackUsername.replace(/^@/, '');
}

function normalizeTweet(row, index, fallbackUsername) {
  const id = idFrom(row, index);
  const username = usernameFrom(row, fallbackUsername);
  const text = firstString(row, TEXT_FIELDS);
  if (!text) {
    return null;
  }

  return {
    id,
    text,
    createdAt: dateFrom(row),
    likes: numberFrom(row.like_count ?? row.likes ?? row.likeCount),
    replies: numberFrom(row.reply_count ?? row.replies ?? row.replyCount),
    retweets: numberFrom(row.retweet_count ?? row.retweets ?? row.retweetCount),
    url: row.url || `https://x.com/${username}/status/${id}`,
  };
}

function buildDashboardData(tweets) {
  const stats = tweets.reduce(
    (total, tweet) => ({
      totalTweets: total.totalTweets + 1,
      totalLikes: total.totalLikes + tweet.likes,
      totalReplies: total.totalReplies + tweet.replies,
      totalRetweets: total.totalRetweets + tweet.retweets,
      totalEngagements:
        total.totalEngagements + tweet.likes + tweet.replies + tweet.retweets,
    }),
    {
      totalTweets: 0,
      totalLikes: 0,
      totalReplies: 0,
      totalRetweets: 0,
      totalEngagements: 0,
    },
  );

  return {
    source: 'xquik_export',
    lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 19),
    stats,
    tweets,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.input) {
    throw new Error('Pass a Xquik export path or set XQUIK_EXPORT_PATH.');
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 100) {
    throw new Error('--limit must be a number from 1 to 100.');
  }

  const rows = await readExport(options.input);
  const tweets = rows
    .map((row, index) => normalizeTweet(row, index, options.username))
    .filter(Boolean)
    .slice(0, options.limit);

  const dashboardData = buildDashboardData(tweets);
  await fs.writeFile(options.output, `${JSON.stringify(dashboardData, null, 2)}\n`);
  console.log(`Saved ${tweets.length} tweets to ${options.output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
