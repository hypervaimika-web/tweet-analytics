const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dataPath = path.join(__dirname, 'data.json');
let rawData = fs.readFileSync(dataPath, 'utf8');
// Remove BOM if present
if (rawData.charCodeAt(0) === 0xFEFF) {
    rawData = rawData.slice(1);
}
const data = JSON.parse(rawData);

// Process tweets for Engagement Chart
// Sort by date ascending
const tweets = data.tweets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

const chartData = tweets.map(t => {
    const date = new Date(t.createdAt);
    // Format: MM-DD HH:mm
    const label = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
    const engagement = (t.likes || 0) + (t.retweets || 0) + (t.replies || 0);
    return { x: label, y: engagement };
});

const jsonString = JSON.stringify(chartData);
const chartScript = "C:\\Users\\Ntsol\\clawd\\skills\\chart-image\\scripts\\chart.mjs";
const outputPath = path.join(__dirname, 'engagement-chart.png');

console.log("Generating chart with data points:", chartData.length);

// Use a temporary file for data to avoid shell escaping issues
const tempFile = path.join(__dirname, 'temp_chart_data.json');
fs.writeFileSync(tempFile, jsonString);

try {
    // Pipe file content to the script
    const cmd = `type "${tempFile}" | node "${chartScript}" --type line --title "Tweet Engagement Over Time" --dark --output "${outputPath}" --color "#00ff88"`;
    console.log("Running:", cmd);
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Chart generated at: ${outputPath}`);
} catch (e) {
    console.error("Chart generation failed:", e);
} finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
}
