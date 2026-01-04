# Script to configure Netlify environment variables for Ollama
# Usage: .\configure-netlify-env.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$OllamaUrl,
    
    [Parameter(Mandatory=$false)]
    [string]$Model = "llama3.2"
)

Write-Host "=== Netlify Environment Variables Configuration ===" -ForegroundColor Cyan
Write-Host ""

# Check if Netlify CLI is installed
try {
    $null = netlify --version
    Write-Host "✓ Netlify CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Netlify CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "  npm install -g netlify-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Check if logged in
Write-Host "Checking Netlify login status..." -ForegroundColor Yellow
try {
    $status = netlify status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Not logged in. Please login:" -ForegroundColor Yellow
        Write-Host "  netlify login" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After logging in, run this script again." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Logged in to Netlify" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not verify login status" -ForegroundColor Yellow
}

Write-Host ""

# Check if site is linked
Write-Host "Checking if site is linked..." -ForegroundColor Yellow
try {
    $siteInfo = netlify status --json 2>&1 | ConvertFrom-Json
    if ($siteInfo.siteId) {
        Write-Host "✓ Site is linked: $($siteInfo.siteName)" -ForegroundColor Green
    } else {
        Write-Host "⚠ Site not linked. Please link it:" -ForegroundColor Yellow
        Write-Host "  netlify link" -ForegroundColor Gray
        Write-Host ""
        Write-Host "After linking, run this script again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "⚠ Could not verify site link. Please run 'netlify link' first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setting Environment Variables ===" -ForegroundColor Cyan
Write-Host ""

# Set LLM_PROVIDER
Write-Host "Setting LLM_PROVIDER=ollama..." -ForegroundColor Yellow
netlify env:set LLM_PROVIDER ollama
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ LLM_PROVIDER set" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set LLM_PROVIDER" -ForegroundColor Red
    exit 1
}

# Set OLLAMA_BASE_URL
Write-Host "Setting OLLAMA_BASE_URL=$OllamaUrl..." -ForegroundColor Yellow
netlify env:set OLLAMA_BASE_URL $OllamaUrl
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ OLLAMA_BASE_URL set" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set OLLAMA_BASE_URL" -ForegroundColor Red
    exit 1
}

# Set OLLAMA_MODEL
Write-Host "Setting OLLAMA_MODEL=$Model..." -ForegroundColor Yellow
netlify env:set OLLAMA_MODEL $Model
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ OLLAMA_MODEL set" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to set OLLAMA_MODEL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan
Write-Host ""

# List all env vars
Write-Host "Current environment variables:" -ForegroundColor Yellow
netlify env:list

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify your Ollama server is accessible at: $OllamaUrl" -ForegroundColor White
Write-Host "2. Test the connection: curl $OllamaUrl/api/tags" -ForegroundColor Gray
Write-Host "3. Redeploy your site:" -ForegroundColor White
Write-Host "   netlify deploy --prod" -ForegroundColor Gray
Write-Host "   OR trigger a deploy from the Netlify dashboard" -ForegroundColor Gray
Write-Host "4. Monitor function logs after deployment" -ForegroundColor White
Write-Host ""




