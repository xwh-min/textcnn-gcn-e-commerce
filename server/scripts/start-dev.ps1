Param(
  [string]$ServerDir = "..",
  [string]$AIServiceDir = "..\..\text-cnn~gcn",
  [string]$PythonCmd = "python"
)

$ErrorActionPreference = "Stop"

$serverPath = Resolve-Path (Join-Path $PSScriptRoot $ServerDir)
$aiPath = Resolve-Path (Join-Path $PSScriptRoot $AIServiceDir)

Write-Host "[1/3] 启动 AI 服务 (Flask) ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$aiPath'; $PythonCmd -m src.api.app"

Write-Host "[2/3] 启动 Go 服务 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverPath'; go run ./cmd/api"

Write-Host "[3/3] 联调检查提示"
Write-Host "- 健康检查: GET http://localhost:9090/api/risk/health"
Write-Host "- 预测接口: POST http://localhost:9090/api/risk/predict"
Write-Host "- 建议先登录拿 JWT，再访问受保护接口"
