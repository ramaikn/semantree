. "$PSScriptRoot/environment.ps1"
Push-Location "$project/frontend"
try { & bun run dev } finally { Pop-Location }
