# build-install-sql.ps1
# Script to compile migrations and seeds into a single install.sql file

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputPath = Join-Path $scriptPath "install.sql"

Write-Host "Building install.sql..." -ForegroundColor Cyan

# Clear existing file
if (Test-Path $outputPath) {
    Remove-Item $outputPath
}

# 1. Add Migrations Header
"-- ==============================================" | Out-File -FilePath $outputPath -Append -Encoding utf8
"-- SMART SCHOOL OFFICE V.2 COMPLETE INSTALLATION" | Out-File -FilePath $outputPath -Append -Encoding utf8
"-- Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $outputPath -Append -Encoding utf8
"-- ==============================================" | Out-File -FilePath $outputPath -Append -Encoding utf8
"" | Out-File -FilePath $outputPath -Append -Encoding utf8

# 2. Append Migration Scripts
$migrationsDir = Join-Path $scriptPath "migrations"
if (Test-Path $migrationsDir) {
    $migrationFiles = Get-ChildItem -Path $migrationsDir -Filter *.sql | Sort-Object Name
    foreach ($file in $migrationFiles) {
        Write-Host "Appending Migration: $($file.Name)" -ForegroundColor Green
        "-- MIGRATION: $($file.Name)" | Out-File -FilePath $outputPath -Append -Encoding utf8
        "-- ----------------------------------------------" | Out-File -FilePath $outputPath -Append -Encoding utf8
        Get-Content -Path $file.FullName -Raw -Encoding UTF8 | Out-File -FilePath $outputPath -Append -Encoding utf8
        "" | Out-File -FilePath $outputPath -Append -Encoding utf8
    }
}

# 3. Append Seed Scripts
$seedFile = Join-Path $scriptPath "seed.sql"
if (Test-Path $seedFile) {
    Write-Host "Appending Seed Data..." -ForegroundColor Green
    "-- ==============================================" | Out-File -FilePath $outputPath -Append -Encoding utf8
    "-- SEED DATA" | Out-File -FilePath $outputPath -Append -Encoding utf8
    "-- ==============================================" | Out-File -FilePath $outputPath -Append -Encoding utf8
    Get-Content -Path $seedFile -Raw -Encoding UTF8 | Out-File -FilePath $outputPath -Append -Encoding utf8
    "" | Out-File -FilePath $outputPath -Append -Encoding utf8
}

Write-Host "Done! Generated install.sql at $outputPath" -ForegroundColor Yellow
