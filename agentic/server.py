import os
import socket

import uvicorn

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 不会真的连接，只是拿路由信息
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

if __name__ == "__main__":
    reload = os.getenv("RELOAD", "true").lower() == "true"
    host = "0.0.0.0"
    port = 8000
    local_ip = get_local_ip()
    print("\n🚀 starlink 服务启动中...\n")
    # 本机访问
    print(f"👉 Local:     http://127.0.0.1:{port}/docs")
    # 局域网访问
    print(f"👉 Network:   http://{local_ip}:{port}/docs")
    # 原始绑定
    print(f"👉 Bind:      http://{host}:{port}\n")
    uvicorn.run(
        "src.app.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
