# Tweet Analytics Dashboard - Data Updater
# Run this script to fetch latest tweets and update the dashboard

$env:AUTH_TOKEN = "a349f2793375714099e272b8711b95fb17f178b2"
$env:CT0 = "48e1e2f81f09a4da130713218d18897ca5ef509d7c500ca704aaefa30148d085166f54f1636d129b8efe86640d2deb5fcdcffe276c196576d9d529a6a01ee92d94643f57cd90725a045ad94a197149b8"

Write-Host "Fetching tweets from @Strakyo..."

# Fetch tweets
$rawJson = bird user-tweets Strakyo -n 20 --json 2>$null
$tweets = $rawJson | ConvertFrom-Json

if (-not $tweets) {
    Write-Host "Failed to fetch tweets"
    exit 1
}

Write-Host "Fetched $($tweets.Count) tweets"

# Calculate stats
$totalLikes = ($tweets | Measure-Object -Property likeCount -Sum).Sum
$totalReplies = ($tweets | Measure-Object -Property replyCount -Sum).Sum
$totalRetweets = ($tweets | Measure-Object -Property retweetCount -Sum).Sum
$totalEngagements = $totalLikes + $totalReplies + $totalRetweets

# Format for dashboard
$dashboardData = @{
    lastUpdated = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    stats = @{
        totalTweets = $tweets.Count
        totalLikes = $totalLikes
        totalReplies = $totalReplies
        totalRetweets = $totalRetweets
        totalEngagements = $totalEngagements
    }
    tweets = @($tweets | ForEach-Object {
        @{
            id = $_.id
            text = $_.text
            createdAt = $_.createdAt
            likes = $_.likeCount
            replies = $_.replyCount
            retweets = $_.retweetCount
            url = "https://x.com/Strakyo/status/$($_.id)"
        }
    })
}

# Save to JSON
$jsonPath = Join-Path $PSScriptRoot "data.json"
$dashboardData | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8

Write-Host "Saved data to $jsonPath"
Write-Host "Stats: Tweets=$($tweets.Count) Likes=$totalLikes Replies=$totalReplies Retweets=$totalRetweets"
