# Fetches the pinned soplang/soplang release into runner/vendor/soplang.
# Re-run after bumping $SoplangRef to pick up a new interpreter version.
param(
    [string]$SoplangRef = "v2.0.0"
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VendorDir = Join-Path $ScriptDir "..\vendor\soplang"

if (Test-Path $VendorDir) {
    Remove-Item -Recurse -Force $VendorDir
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $VendorDir) | Out-Null

git clone --depth 1 --branch $SoplangRef https://github.com/soplang/soplang.git $VendorDir
Remove-Item -Recurse -Force (Join-Path $VendorDir ".git")

Write-Host "soplang $SoplangRef vendored into $VendorDir"
