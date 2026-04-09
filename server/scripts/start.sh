#!/bin/bash

# 进入项目根目录
cd "$(dirname "$0")/.."

# 检查服务器是否已经构建
if [ ! -f "server.exe" ]; then
    echo "Server executable not found. Building..."
    ./scripts/build.sh
fi

# 启动服务器
echo "Starting server..."
./server.exe
