$archiveDir = "_forensic_audit_archive"
if (-not (Test-Path $archiveDir)) {
    New-Item -ItemType Directory -Path $archiveDir | Out-Null
    Write-Host "Created archive directory: $archiveDir"
}

# List of allowed items (Project Files)
$allowed = @(
    ".env", ".env.local", ".git", ".gitignore", ".netlify", ".next", ".nvmrc", 
    "app", "components", "lib", "node_modules", "public", "scripts", "src", "styles", "tests", "types", 
    "jest.config.js", "jest.setup.js", "next-env.d.ts", "next.config.js", 
    "package-lock.json", "package.json", "pnpm-lock.yaml", "postcss.config.js", 
    "tailwind.config.ts", "tsconfig.json", "tsconfig.tsbuildinfo",
    "_forensic_audit_archive", "cleanup_script.ps1"
)

# Get all items in the current directory
$items = Get-ChildItem -Path . -Exclude $allowed

foreach ($item in $items) {
    # Skip if it matches the archive dir itself (redundant check but safe)
    if ($item.Name -eq $archiveDir -or $item.Name -eq "cleanup_script.ps1") { continue }
    
    Write-Host "Moving: $($item.Name)"
    try {
        Move-Item -Path $item.FullName -Destination $archiveDir -Force
    } catch {
        Write-Error "Failed to move $($item.Name): $_"
    }
}

Write-Host "Cleanup complete."
