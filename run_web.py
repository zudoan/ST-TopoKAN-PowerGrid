#!/usr/bin/env python3
"""
ST-TopoKAN SCADA & Multi-Horizon Power Forecasting Web Server Launcher
Hệ thống điều độ giám sát SCADA & Trực quan hóa mô hình ST-TopoKAN.
"""

import sys
import os
import socket
import webbrowser
import threading
import time
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = BASE_DIR / "web_app" / "backend"
sys.path.insert(0, str(BACKEND_DIR))

def find_available_port(start_port: int = 8000, max_attempts: int = 20) -> int:
    """Finds an open TCP port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def open_browser(url: str, delay_sec: float = 1.2):
    """Opens default browser after a short delay so server has time to bind."""
    time.sleep(delay_sec)
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"[!] Không thể tự động mở trình duyệt: {e}")

def main():
    print("=" * 80)
    print("  TRẠM 110/22kV TÂN HƯNG - HỆ THỐNG ĐIỀU ĐỘ SCADA & DỰ BÁO ST-TopoKAN")
    print("  Học phần: Phân tích chuỗi thời gian | Báo cáo bài tập lớn cuối kỳ")
    print("  Bộ môn Trí tuệ Nhân tạo - Phân hiệu Trường Đại học Thủy Lợi")
    print("=" * 80)

    try:
        import uvicorn
        from app.main import app
        from app.core.config import settings
    except ImportError as e:
        print(f"[ERROR] Thiếu thư viện: {e}")
        print("Vui lòng cài đặt: pip install fastapi uvicorn pandas numpy")
        sys.exit(1)

    port = find_available_port(8000)
    url = f"http://127.0.0.1:{port}"

    print(f"\n[✓] Dữ liệu kiểm thử: {settings.TEST_FILE}")
    print(f"[✓] Giao diện người dùng: {settings.FRONTEND_DIR}")
    print(f"[✓] Đang khởi chạy máy chủ tại: {url}")
    print(f"[✓] Swagger API Docs: {url}/api/docs")
    print("-" * 80)
    print("Nhấn Ctrl + C để dừng máy chủ.\n")

    # Start browser opener in background thread
    threading.Thread(target=open_browser, args=(url,), daemon=True).start()

    # Run uvicorn
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=port,
        log_level="info",
        reload=False
    )

if __name__ == "__main__":
    main()

