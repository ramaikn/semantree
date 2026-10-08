. "$PSScriptRoot/environment.ps1"
if (!(Test-Path "$tools/jdk/bin/java.exe") -or !(Test-Path "$tools/pgsql/bin/psql.exe") -or !(Test-Path "$tools/maven/bin/mvn.cmd")) {
    & powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/setup-tools.ps1"
    if ($LASTEXITCODE -ne 0) { throw 'Instalasi tools gagal.' }
}
Push-Location "$project/pipeline"
try { & uv sync --link-mode hardlink; if ($LASTEXITCODE -ne 0) { throw 'Instalasi extractor gagal.' } } finally { Pop-Location }
Push-Location "$project/frontend"
try { & bun install --backend hardlink; if ($LASTEXITCODE -ne 0) { throw 'Instalasi frontend gagal.' } } finally { Pop-Location }
& powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/start-database.ps1"
if ($LASTEXITCODE -ne 0) { throw 'Database gagal dimulai.' }
Write-Output 'Setup selesai. Isi AI_API_KEY pada .env lokal bila ingin menggunakan asisten.'
