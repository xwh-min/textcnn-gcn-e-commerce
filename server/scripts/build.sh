#!/bin/bash

# 设置 Go 环境变量
export GO111MODULE=on

# 进入项目根目录
cd "$(dirname "$0")/.."

# 安装依赖
echo "Installing dependencies..."
go mod tidy

# 构建项目
echo "Building project..."
go build -o server.exe ./cmd/api

echo "Build completed successfully!"
