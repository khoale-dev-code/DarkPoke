<#
.SYNOPSIS
  Khởi tạo và chạy website Dark Poke (Next.js 16 + Tailwind CSS v4 + Supabase).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -DryRun
  powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -Check
  powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1"
  powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -Production

.PARAMETER DryRun      Chỉ in ra các bước sẽ làm, không cài đặt, không tạo file, không chạy server.
.PARAMETER Check       Kiểm tra môi trường (Node, npm, cổng, .env.local, Supabase) rồi thoát.
.PARAMETER Production  Cài đặt, kiểm tra kiểu TypeScript, lint, build production rồi chạy bản production.
.PARAMETER Port        Cổng chạy web, mặc định 3000.
.PARAMETER SkipInstall Bỏ qua bước cài thư viện (khi đã cài rồi).
.PARAMETER NoBrowser   Không tự mở trình duyệt.
#>
[CmdletBinding()]
param(
  [switch]$DryRun,
  [switch]$Check,
  [switch]$Production,
  [int]$Port = 3000,
  [switch]$SkipInstall,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$OutputEncoding = [System.Text.Encoding]::UTF8

$Root = $PSScriptRoot
if (-not $Root) { $Root = (Get-Location).Path }
Set-Location -LiteralPath $Root

$LogFile = Join-Path $Root 'setup.log'
$MinNode = [Version]'20.9.0'
$script:Problems = 0
$script:Warnings = 0

function Write-Log([string]$Text) {
  if ($DryRun) { return }
  try { Add-Content -LiteralPath $LogFile -Value ("[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Text) -Encoding UTF8 } catch { }
}
function Step([string]$Text) { Write-Host ''; Write-Host "==> $Text" -ForegroundColor Cyan; Write-Log "STEP $Text" }
function Ok([string]$Text) { Write-Host "  [OK]   $Text" -ForegroundColor Green; Write-Log "OK $Text" }
function Warn([string]$Text) { $script:Warnings++; Write-Host "  [CHÚ Ý] $Text" -ForegroundColor Yellow; Write-Log "WARN $Text" }
function Bad([string]$Text) { $script:Problems++; Write-Host "  [LỖI]  $Text" -ForegroundColor Red; Write-Log "ERROR $Text" }
function Info([string]$Text) { Write-Host "         $Text" -ForegroundColor Gray }
function Plan([string]$Text) { Write-Host "  [SẼ LÀM] $Text" -ForegroundColor Magenta }

function Test-Command([string]$Name) { return [bool](Get-Command $Name -ErrorAction SilentlyContinue) }

function Invoke-Npm([string[]]$NpmArgs, [string]$What) {
  if ($DryRun) { Plan ("npm " + ($NpmArgs -join ' ') + "  ($What)"); return }
  Write-Log ("RUN npm " + ($NpmArgs -join ' '))
  & npm @NpmArgs
  if ($LASTEXITCODE -ne 0) {
    Bad "$What thất bại (npm $($NpmArgs -join ' ')). Xem thông báo phía trên."
    throw "npm $($NpmArgs -join ' ') exit $LASTEXITCODE"
  }
  Ok $What
}

function Read-EnvFile([string]$Path) {
  $map = @{}
  if (-not (Test-Path -LiteralPath $Path)) { return $map }
  foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
    $t = $line.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { continue }
    $i = $t.IndexOf('=')
    if ($i -lt 1) { continue }
    $k = $t.Substring(0, $i).Trim()
    $v = $t.Substring($i + 1).Trim().Trim('"').Trim("'")
    $map[$k] = $v
  }
  return $map
}

function Test-PortFree([int]$P) {
  $listener = $null
  try {
    $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $P)
    $listener.Start()
    return $true
  } catch { return $false } finally { if ($listener) { $listener.Stop() } }
}

# ---------------------------------------------------------------------------
Write-Host ''
Write-Host 'Dark Poke · HUNT - TRADE - COLLECT' -ForegroundColor White
$modeName = 'Chạy phát triển'
if ($Check) { $modeName = 'Kiểm tra môi trường' } elseif ($Production) { $modeName = 'Build và chạy production' }
if ($DryRun) { $modeName = "$modeName (chạy thử, không thay đổi gì)" }
Write-Host "Chế độ: $modeName" -ForegroundColor Gray
Write-Host "Thư mục: $Root" -ForegroundColor Gray
Write-Log "=== setup.ps1 mode=$modeName port=$Port ==="

# ---------------------------------------------------------------------------
Step 'Kiểm tra môi trường'

if (-not (Test-Path -LiteralPath (Join-Path $Root 'package.json'))) {
  Bad 'Không thấy package.json. Hãy chạy script trong thư mục đã giải nén (ví dụ D:\freetime\dark-poke).'
  exit 1
}
Ok 'Đúng thư mục dự án'

$nodeOk = $false
if (Test-Command 'node') {
  $raw = (& node -v) 2>$null
  try {
    $ver = [Version]($raw.TrimStart('v'))
    if ($ver -ge $MinNode) { Ok "Node.js $raw"; $nodeOk = $true }
    else { Bad "Node.js $raw quá cũ, cần từ $MinNode trở lên. Tải bản LTS ở https://nodejs.org" }
  } catch { Warn "Không đọc được phiên bản Node.js ($raw)" ; $nodeOk = $true }
} else {
  Bad 'Chưa cài Node.js. Tải bản LTS (22.x) ở https://nodejs.org rồi mở lại PowerShell.'
}

if (Test-Command 'npm') { Ok ("npm " + ((& npm -v) 2>$null)) } else { Bad 'Không tìm thấy npm (đi kèm Node.js).' }
if (Test-Command 'git') { Ok 'Git có sẵn' } else { Info 'Chưa có Git (không bắt buộc, cần khi đưa code lên GitHub và Vercel).' }
if (Test-Command 'code') { Ok 'VS Code có sẵn' } else { Info 'Không thấy lệnh code (không bắt buộc).' }

if (Test-PortFree $Port) { Ok "Cổng $Port đang trống" } else { Warn "Cổng $Port đang bị dùng. Chạy lại với -Port 3001 hoặc tắt chương trình đang dùng cổng." }

try {
  $drive = (Get-Item -LiteralPath $Root).PSDrive
  if ($drive -and $drive.Free) {
    $freeGb = [Math]::Round($drive.Free / 1GB, 1)
    if ($freeGb -lt 1) { Warn "Ổ đĩa còn $freeGb GB, nên trống ít nhất 1 GB cho node_modules và bản build." } else { Ok "Ổ đĩa còn $freeGb GB" }
  }
} catch { }

$envPath = Join-Path $Root '.env.local'
$envExample = Join-Path $Root '.env.example'
$envMap = Read-EnvFile $envPath
$hasEnv = Test-Path -LiteralPath $envPath
$sbUrl = $envMap['NEXT_PUBLIC_SUPABASE_URL']
$sbKey = $envMap['NEXT_PUBLIC_SUPABASE_ANON_KEY']
$demoMode = [string]::IsNullOrWhiteSpace($sbUrl) -or [string]::IsNullOrWhiteSpace($sbKey)

if (-not $hasEnv) {
  Warn 'Chưa có .env.local: web sẽ chạy chế độ demo bằng dữ liệu mẫu (xem được giao diện, không lưu đơn).'
} elseif ($demoMode) {
  Warn '.env.local chưa có NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY: chạy chế độ demo.'
} else {
  Ok "Đã cấu hình Supabase: $sbUrl"
  if ([string]::IsNullOrWhiteSpace($envMap['SUPABASE_SERVICE_ROLE_KEY'])) { Warn 'Thiếu SUPABASE_SERVICE_ROLE_KEY: chưa dùng được webhook ngân hàng, ảnh chuyển khoản, email mời nhân viên.' } else { Ok 'Có SUPABASE_SERVICE_ROLE_KEY' }
  if ([string]::IsNullOrWhiteSpace($envMap['BANK_WEBHOOK_SECRET'])) { Info 'Chưa đặt BANK_WEBHOOK_SECRET (cần khi bật tự đối soát chuyển khoản).' }
  try {
    $resp = Invoke-WebRequest -Uri ($sbUrl.TrimEnd('/') + '/rest/v1/settings?select=key&limit=1') -Headers @{ apikey = $sbKey; Authorization = "Bearer $sbKey" } -UseBasicParsing -TimeoutSec 10
    if ($resp.StatusCode -eq 200) { Ok 'Kết nối Supabase được và đã có bảng dữ liệu' }
  } catch {
    $code = $null
    try { $code = [int]$_.Exception.Response.StatusCode } catch { }
    if ($code -eq 404) { Bad 'Supabase chưa có bảng. Chạy file supabase/all-in-one.sql trong Supabase > SQL Editor.' }
    elseif ($code -eq 401) { Bad 'Khóa NEXT_PUBLIC_SUPABASE_ANON_KEY không đúng.' }
    else { Warn "Chưa kết nối được Supabase ($($_.Exception.Message))." }
  }
}

$hasModules = Test-Path -LiteralPath (Join-Path $Root 'node_modules\next')
if ($hasModules) { Ok 'Đã cài thư viện (node_modules)' } else { Info 'Chưa cài thư viện, bước sau sẽ chạy npm ci.' }

if ($Check) {
  Write-Host ''
  if ($script:Problems -gt 0) {
    Write-Host "Kết quả: $($script:Problems) lỗi, $($script:Warnings) chú ý. Sửa các mục [LỖI] rồi chạy lại." -ForegroundColor Red
    exit 1
  }
  Write-Host "Kết quả: môi trường sẵn sàng ($($script:Warnings) chú ý)." -ForegroundColor Green
  exit 0
}

if ($script:Problems -gt 0 -and -not $DryRun) {
  Write-Host ''
  Write-Host 'Dừng lại vì còn lỗi môi trường ở trên.' -ForegroundColor Red
  exit 1
}

# ---------------------------------------------------------------------------
Step 'Chuẩn bị file cấu hình'
if (-not $hasEnv) {
  if ($DryRun) { Plan 'Tạo .env.local từ .env.example (để trống = chế độ demo)' }
  else {
    Copy-Item -LiteralPath $envExample -Destination $envPath
    Ok 'Đã tạo .env.local từ .env.example. Mở file này để điền khóa Supabase khi sẵn sàng.'
  }
} else { Ok '.env.local đã có, giữ nguyên' }

if ($Production -and $demoMode) {
  Warn 'Đang build production ở chế độ demo (chưa có Supabase). Bản này chỉ để xem giao diện, chưa bán hàng được.'
}

# ---------------------------------------------------------------------------
Step 'Cài thư viện'
$lock = Join-Path $Root 'package-lock.json'
if ($SkipInstall) {
  Info 'Bỏ qua theo tham số -SkipInstall'
} elseif ($hasModules -and -not $Production) {
  Ok 'Thư viện đã có. Muốn cài lại: xóa thư mục node_modules rồi chạy lại.'
} else {
  $installArgs = @('install', '--no-audit', '--no-fund')
  if (Test-Path -LiteralPath $lock) { $installArgs = @('ci', '--no-audit', '--no-fund') }
  Invoke-Npm $installArgs 'Cài thư viện'
}

# ---------------------------------------------------------------------------
$url = "http://localhost:$Port"
if ($Production) {
  Step 'Kiểm tra mã nguồn'
  Invoke-Npm @('run', 'typecheck') 'Kiểm tra kiểu TypeScript'
  Invoke-Npm @('run', 'lint') 'Kiểm tra lint'

  Step 'Build production'
  Invoke-Npm @('run', 'build') 'Build production'

  Step "Chạy bản production tại $url"
  if ($DryRun) {
    Plan "npm run start -- -p $Port"
    Plan "Mở trình duyệt $url"
  } else {
    Info 'Nhấn Ctrl + C để dừng.'
    if (-not $NoBrowser) { Start-Job -ScriptBlock { param($u) Start-Sleep -Seconds 4; Start-Process $u } -ArgumentList $url | Out-Null }
    & npm run start -- -p $Port
  }
} else {
  Step "Chạy web phát triển tại $url"
  if ($DryRun) {
    Plan "npm run dev -- -p $Port"
    Plan "Mở trình duyệt $url (trang quản trị: $url/admin, bán tại quầy: $url/pos)"
  } else {
    Info "Trang khách: $url   Quản trị: $url/admin   Bán tại quầy: $url/pos"
    Info 'Nhấn Ctrl + C để dừng.'
    if (-not $NoBrowser) { Start-Job -ScriptBlock { param($u) Start-Sleep -Seconds 6; Start-Process $u } -ArgumentList $url | Out-Null }
    & npm run dev -- -p $Port
  }
}

if ($DryRun) {
  Write-Host ''
  Write-Host 'Chạy thử xong: chưa có gì bị thay đổi. Bỏ -DryRun để thực hiện thật.' -ForegroundColor Green
}
