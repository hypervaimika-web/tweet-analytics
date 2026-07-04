# Tweet Analytics Dashboard - Xquik export updater

param(
    [string]$ExportPath = $env:XQUIK_EXPORT_PATH,
    [int]$Limit = 20
)

if (-not $ExportPath) {
    Write-Host "Pass -ExportPath or set XQUIK_EXPORT_PATH to a Xquik JSON export."
    exit 1
}

Write-Host "Importing tweets from Xquik export..."
node "$PSScriptRoot/update-data.mjs" "$ExportPath" --limit "$Limit" --output "$PSScriptRoot/data.json"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Generating engagement chart..."
node "$PSScriptRoot/chart-gen.js"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host "Updated dashboard data and engagement chart."
