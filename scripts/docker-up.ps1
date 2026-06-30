# Сборка и запуск TheGreatHike с обходом node:20-alpine при проблемах с Docker Hub.
param(
    [switch]$PrebuiltFrontend
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Test-DockerImagePull {
    param([string]$Image)
    docker pull $Image 2>&1 | Out-Null
    return $LASTEXITCODE -eq 0
}

$usePrebuilt = $PrebuiltFrontend.IsPresent

if (-not $usePrebuilt) {
    Write-Host "Проверка доступности node:20-alpine..."
    if (-not (Test-DockerImagePull "node:20-alpine")) {
        Write-Host "node:20-alpine недоступен — собираем фронт локально (npm run build)."
        $usePrebuilt = $true
    }
}

if ($usePrebuilt) {
    Write-Host "Сборка frontend/dist на хосте..."
    Push-Location frontend
    if (Test-Path package-lock.json) { npm ci } else { npm install }
    npm run build
    Pop-Location

    Write-Host "Запуск с Dockerfile.prebuilt (только nginx:alpine)..."
    docker compose -f docker-compose.yml -f docker-compose.prebuilt-frontend.yml up --build -d
} else {
    docker compose up --build -d
}
