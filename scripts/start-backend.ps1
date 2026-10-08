. "$PSScriptRoot/environment.ps1"
Push-Location "$project/backend"
try {
    & mvn package -DskipTests
    if($LASTEXITCODE -ne 0) { throw 'Build backend gagal.' }
    # Jalankan salinan runtime agar build/test tidak terkunci oleh Java di Windows.
    New-Item -ItemType Directory -Force -Path "$project/.runtime" | Out-Null
    Copy-Item 'target/enterprise-search-1.0.0.jar' "$project/.runtime/application.jar" -Force
    & java -jar "$project/.runtime/application.jar"
} finally { Pop-Location }
