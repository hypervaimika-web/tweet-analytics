# Tweet Analytics - automation-friendly Xquik export updater

param(
    [string]$ExportPath = $env:XQUIK_EXPORT_PATH,
    [int]$Limit = 20
)

if (-not $ExportPath) {
    Write-Host "ERROR: Pass -ExportPath or set XQUIK_EXPORT_PATH."
    exit 1
}

node "$PSScriptRoot/update-data.mjs" "$ExportPath" --limit "$Limit" --output "$PSScriptRoot/data.json"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

node "$PSScriptRoot/chart-gen.js"
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Output "DATA_JSON_PATH=$PSScriptRoot/data.json"
