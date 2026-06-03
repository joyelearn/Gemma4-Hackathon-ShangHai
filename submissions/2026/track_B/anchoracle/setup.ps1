# Anchoracle 一键启动脚本 (Windows PowerShell)
# 用法：powershell -ExecutionPolicy Bypass -File setup.ps1
$ErrorActionPreference = "Stop"

Write-Host "Anchoracle - 与故人同行 - 一键启动"
Write-Host ""

# 1. 准备环境变量文件
if (-not (Test-Path .env.local)) {
  Copy-Item .env.example .env.local
  Write-Host "[OK] 已根据模板创建 .env.local"
  Write-Host "[!]  请编辑 .env.local，填入你的 GOOGLE_API_KEY"
  Write-Host "     申请地址: https://aistudio.google.com/apikey"
  Write-Host "     (中国大陆需自备代理 / VPN, 节点首选新加坡或美国)"
  Write-Host "     填好后, 重新运行: powershell -ExecutionPolicy Bypass -File setup.ps1"
  exit 0
}

# 2. 校验 key 是否已填写
if (Select-String -Path .env.local -Pattern "your-google-ai-studio-api-key-here" -Quiet) {
  Write-Host "[!] .env.local 中的 GOOGLE_API_KEY 仍是占位符, 请先填入真实 key 再运行."
  exit 1
}

# 3. 安装依赖
Write-Host "[*] 安装依赖 (npm install)..."
npm install

# 4. 启动开发服务器
Write-Host ""
Write-Host "[*] 启动开发服务器: http://localhost:3000"
Write-Host "    (这是本机地址, 仅本地有效; 线上体验见 https://travel-history-agent.vercel.app)"
npm run dev
