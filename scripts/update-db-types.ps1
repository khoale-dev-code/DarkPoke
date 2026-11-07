[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9]{10,40}$')][string]$ProjectId)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root 'src\lib\database.types.ts'
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ([Guid]::NewGuid().ToString('N') + '.types.ts')
try {
    $lines = & npx.cmd supabase gen types typescript --project-id $ProjectId --schema public
    if ($LASTEXITCODE -ne 0) { throw 'Supabase CLI failed. Run npx supabase login, then retry.' }
    $content = $lines -join "`n"
    if ($content -notmatch 'export type Database') { throw 'No Database type returned. Original file retained.' }
    [System.IO.File]::WriteAllText($temp, $content + "`n", (New-Object System.Text.UTF8Encoding($false)))
    if (Test-Path -LiteralPath $target) { Copy-Item -LiteralPath $target -Destination ($target + '.before-generation.bak') }
    Copy-Item -LiteralPath $temp -Destination $target -Force
    Push-Location -LiteralPath $root
    try { & npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Generated schema differs from application expectations. Review the typecheck output.' } }
    finally { Pop-Location }
} finally { if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Force } }
