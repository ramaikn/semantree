$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
# Gunakan cache tools monorepo bila ada; clone mandiri menyimpan tools di root proyek.
$workspaceRoot = Split-Path (Split-Path $project -Parent) -Parent
$tools = Join-Path $project '.tools'
if (Test-Path "$workspaceRoot/.tools/jdk/bin/java.exe") { $tools = Join-Path $workspaceRoot '.tools' }
$env:JAVA_HOME = Join-Path $tools 'jdk'
$env:PATH = "$env:JAVA_HOME\bin;$tools\maven\bin;$tools\pgsql\bin;$env:PATH"
$env:EXTRACTOR_PATH = Join-Path $project 'pipeline/extract.py'
if (Test-Path "$project/.env") {
    Get-Content "$project/.env" | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$') { [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process') }
    }
}
