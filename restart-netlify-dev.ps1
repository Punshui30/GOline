# Restart Netlify dev to pick up .env changes
Write-Host "Restarting Netlify dev..." -ForegroundColor Cyan
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "Starting Netlify dev..." -ForegroundColor Green
cd C:\Users\simmo\Desktop\go-line-calculator
netlify dev





