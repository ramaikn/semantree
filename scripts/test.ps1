. "$PSScriptRoot/environment.ps1"
& bun test "$project/demo/company.test.ts" "$project/frontend/src/components/Highlight.test.ts"
if($LASTEXITCODE -ne 0) { throw 'Test corpus/highlight gagal.' }
Push-Location "$project/pipeline"
try { & uv run --offline -m unittest test_extract; if($LASTEXITCODE -ne 0) { throw 'Test ekstraksi gagal.' } } finally { Pop-Location }
Push-Location "$project/frontend"
try { & bun run build; if($LASTEXITCODE -ne 0) { throw 'Build frontend gagal.' } } finally { Pop-Location }
Push-Location "$project/backend"
try { & mvn verify; if($LASTEXITCODE -ne 0) { throw 'Test/build Java gagal.' } } finally { Pop-Location }
$env:PGPASSWORD=$env:LOCAL_PG_PASSWORD
# Hanya database dengan nama test eksplisit yang dihapus ulang.
& psql -h 127.0.0.1 -p 55433 -U postgres -d postgres -v ON_ERROR_STOP=1 -c 'DROP DATABASE IF EXISTS enterprise_search_test WITH (FORCE);' -c 'CREATE DATABASE enterprise_search_test OWNER search_app;'
if($LASTEXITCODE -ne 0) { throw 'Pembuatan database test gagal.' }
$env:JDBC_DATABASE_URL='jdbc:postgresql://127.0.0.1:55433/enterprise_search_test'
$env:PORT='8082'
$process=Start-Process -FilePath "$env:JAVA_HOME/bin/java.exe" -ArgumentList '-jar',"`"$project/backend/target/enterprise-search-1.0.0.jar`"" -PassThru -RedirectStandardOutput "$project/.runtime/test-backend.log" -RedirectStandardError "$project/.runtime/test-backend-error.log"
try {
    $ready=$false
    for($i=0;$i -lt 45;$i++) {
        if($process.HasExited) { throw 'Backend test berhenti. Periksa .runtime/test-backend.log.' }
        try { $response=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8082/api/health'; if($response.StatusCode -eq 200) { $ready=$true;break } } catch { Start-Sleep -Seconds 1 }
    }
    if(!$ready) { throw 'Backend test tidak siap.' }
    & bun run "$project/scripts/test-api.ts"
    if($LASTEXITCODE -ne 0) { throw 'Test API gagal.' }
} finally {
    if(!$process.HasExited) { Stop-Process -Id $process.Id -Force }
    Remove-Item Env:PORT -ErrorAction SilentlyContinue
    . "$PSScriptRoot/environment.ps1"
}
