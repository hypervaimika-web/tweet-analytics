# Tweet Analytics

Static tweet analytics dashboard for recent account activity. The page reads
`data.json` and renders summary cards, recent tweets, and an engagement chart.

## Import Xquik data

Export tweets from Xquik as JSON or JSONL, then build dashboard data locally:

```powershell
.\update-data.ps1 -ExportPath .\xquik-export.json -Limit 20
```

Or run the Node importer directly:

```bash
node update-data.mjs xquik-export.json --limit 20 --output data.json
node chart-gen.js
```

The importer accepts common Xquik tweet fields such as `text`, `created`,
`createdAt`, `like_count`, `reply_count`, `retweet_count`, and `author.username`.

## Files

- `index.html` renders the dashboard.
- `update-data.mjs` converts a Xquik export into `data.json`.
- `chart-gen.js` generates a portable `engagement-chart.svg`.
- `update-data.ps1` and `auto-update.ps1` wrap the Node importer for Windows.

## Validate

```bash
node --check update-data.mjs
node --check chart-gen.js
```
