# INMOBILIARIA LM — arranque local para Windows con datos ficticios.
# Requiere Docker Desktop iniciado y Node.js 22 con npm instalado.
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
function Verificar($exe) {
  if (-not (Get-Command $exe -ErrorAction SilentlyContinue)) {
    throw "Falta $exe. Instala el requisito y vuelve a ejecutar INICIAR_LM.ps1."
  }
}
Verificar "docker"
Verificar "node"
Verificar "npm"
docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker Desktop no esta iniciado. Abre Docker Desktop y vuelve a ejecutar." }
$envFile = Join-Path $PSScriptRoot ".env.local"
if (-not (Test-Path $envFile)) {
  $bytes = New-Object byte[] 36
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
  $password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','A').Replace('/','B')
  $lines = @(
    'DATABASE_URL=postgresql://lm_local:local_demo_change_before_real_use@127.0.0.1:5432/inmobiliaria_lm',
    'ADMIN_USER=admin',
    ('ADMIN_PASSWORD=' + $password)
  )
  [System.IO.File]::WriteAllLines($envFile, $lines, (New-Object System.Text.UTF8Encoding($false)))
  Write-Host "Se generaron credenciales locales unicas en .env.local (archivo ignorado por Git)."
}
$line = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
if (-not $line) { throw "Falta DATABASE_URL en .env.local" }
$env:DATABASE_URL = $line.Substring("DATABASE_URL=".Length).Trim()
Write-Host "Iniciando PostgreSQL local..."
docker compose up -d
if ($LASTEXITCODE -ne 0) { throw "No fue posible iniciar PostgreSQL." }
Write-Host "Instalando dependencias..."
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { throw "No fue posible instalar dependencias." }
Write-Host "Preparando la base de datos..."
npm run db
if ($LASTEXITCODE -ne 0) { throw "Fallo la migracion de base de datos." }
Write-Host ""
Write-Host "Aplicacion: http://localhost:3000"
Write-Host "Usuario: admin"
Write-Host "Contrasena: consulta ADMIN_PASSWORD en .env.local"
Write-Host "SOLO DATOS FICTICIOS. NO PUBLICAR EN INTERNET."
Write-Host "Para detener la aplicacion, presiona Ctrl+C."
npm run dev
