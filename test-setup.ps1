Write-Host "=== GO Line Calculator Setup Test ===" -ForegroundColor Cyan
Write-Host ""

# Check .env
Write-Host "[1/4] Checking .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env
    Write-Host "✓ .env exists" -ForegroundColor Green
    Write-Host "  Contents:" -ForegroundColor Gray
    $envContent | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "✗ .env missing!" -ForegroundColor Red
}

Write-Host ""

# Check Ollama
Write-Host "[2/4] Checking Ollama..." -ForegroundColor Yellow
try {
    $ollamaOutput = ollama list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Ollama is accessible" -ForegroundColor Green
        if ($ollamaOutput -match "llama3.2") {
            Write-Host "✓ llama3.2 model found" -ForegroundColor Green
        } else {
            Write-Host "⚠ llama3.2 model not found. Run: ollama pull llama3.2" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Ollama not accessible. Is it running?" -ForegroundColor Red
        Write-Host "  Start with: ollama serve" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Ollama command failed. Is Ollama installed?" -ForegroundColor Red
}

Write-Host ""

# Check Node modules
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path node_modules) {
    Write-Host "✓ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules missing. Run: npm install" -ForegroundColor Red
}

Write-Host ""

# Check Netlify CLI
Write-Host "[4/4] Checking Netlify CLI..." -ForegroundColor Yellow
try {
    $netlifyVersion = netlify --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Netlify CLI installed: $netlifyVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Netlify CLI not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start Ollama (in a NEW terminal):" -ForegroundColor White
Write-Host "   ollama serve" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start Netlify Dev (in THIS terminal):" -ForegroundColor White
Write-Host "   netlify dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open browser:" -ForegroundColor White
Write-Host "   http://localhost:8888" -ForegroundColor Gray
Write-Host ""
Write-Host "If you see errors, check TROUBLESHOOTING.md" -ForegroundColor Yellow





