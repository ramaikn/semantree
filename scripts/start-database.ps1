. "$PSScriptRoot/environment.ps1"
$runtime = Join-Path $project '.runtime'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
function New-Secret {
    $bytes = New-Object byte[] 24
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $random.GetBytes($bytes)
    $random.Dispose()
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLower()
}
if (!(Test-Path "$project/.env")) {
    $dbPassword=New-Secret; $superPassword=New-Secret; $adminPassword=New-Secret
    @"
JDBC_DATABASE_URL=jdbc:postgresql://127.0.0.1:55433/enterprise_search
DB_USER=search_app
DB_PASSWORD=$dbPassword
LOCAL_PG_PASSWORD=$superPassword
BOOTSTRAP_EMAIL=admin@local.test
BOOTSTRAP_PASSWORD=$adminPassword
APP_ORIGIN=http://127.0.0.1:5174
AI_BASE_URL=http://127.0.0.1:20128/v1
AI_MODEL=ag/gemini-3.8-flash-low
AI_API_KEY=
"@ | Set-Content "$project/.env" -Encoding UTF8
    . "$PSScriptRoot/environment.ps1"
}
$env:PGPASSWORD=$env:LOCAL_PG_PASSWORD
if (!(Test-Path "$runtime/pgdata/PG_VERSION")) {
    $passwordFile=Join-Path $runtime 'pg-password.txt'
    [System.IO.File]::WriteAllText($passwordFile,$env:LOCAL_PG_PASSWORD)
    try {
        & initdb -D "$runtime/pgdata" -U postgres -A scram-sha-256 --pwfile="$passwordFile" --encoding=UTF8 --locale=C
        if($LASTEXITCODE -ne 0) { throw 'initdb gagal.' }
    } finally { Remove-Item $passwordFile -ErrorAction SilentlyContinue }
    Add-Content "$runtime/pgdata/postgresql.conf" "`nlisten_addresses='127.0.0.1'`nport=55433`nmax_connections=25`nshared_buffers='64MB'"
}
& pg_ctl -D "$runtime/pgdata" status 2>$null | Out-Null
if($LASTEXITCODE -ne 0) {
    & pg_ctl -D "$runtime/pgdata" -l "$runtime/postgresql.log" -w start
    if($LASTEXITCODE -ne 0) { throw 'PostgreSQL gagal dimulai.' }
}
$existing = & psql -h 127.0.0.1 -p 55433 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='enterprise_search'"
if (!$existing) {
    "CREATE ROLE search_app LOGIN PASSWORD '$env:DB_PASSWORD'; CREATE DATABASE enterprise_search OWNER search_app;" | & psql -h 127.0.0.1 -p 55433 -U postgres -d postgres -v ON_ERROR_STOP=1
    if($LASTEXITCODE -ne 0) { throw 'Pembuatan database gagal.' }
    'REVOKE CREATE ON SCHEMA public FROM PUBLIC;' | & psql -h 127.0.0.1 -p 55433 -U postgres -d enterprise_search -v ON_ERROR_STOP=1
}
Write-Output 'Database Enterprise Search siap di 127.0.0.1:55433. Akun login ada pada .env lokal.'
