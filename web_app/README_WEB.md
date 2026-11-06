# HỆ THỐNG ĐIỀU ĐỘ SCADA & DỰ BÁO PHỤ TẢI ĐIỆN THÔNG MINH ST-TopoKAN

Ứng dụng Web chuyên dụng được xây dựng theo chuẩn công nghiệp điện lực (IEC 61850) và các hệ thống điều độ SCADA/EMS hiện đại (như Siemens Spectrum Power, ABB Ability, Schneider EcoStruxure) phục vụ giám sát và dự báo phụ tải cho **Máy biến áp T2 (224) Trạm 110/22kV Tân Hưng (Tây Ninh)** bằng mô hình học sâu **ST-TopoKAN** (*Spatial-Temporal Topological Kolmogorov-Arnold Network*).

---

## 1. Điểm Nổi Bật Về UX/UI & Tính Chất Ngành Điện

- **Giao diện Giám sát Điều độ chuẩn nhận diện Điện lực Quốc gia (EVN / NSMO)**:
  - Tông màu chủ đạo Trắng (`#F8FAFC` - `#FFFFFF`) kết hợp Xanh Navy Điện Lực (`#003B7A`) và Đỏ Quốc Gia (`#D32F2F`) sắc nét, trang nhã, đúng phong cách Cổng thông tin điều độ điện quốc gia.
  - Phân định rõ ràng cấp điện áp và thanh cái 22kV, công suất tác dụng $P$, công suất phản kháng $Q$ và dòng điện định mức $I$.
  - Phân định biểu giá điện 3 giá của EVN theo thời gian thực: Giờ cao điểm (Peak), Giờ bình thường (Normal), Giờ thấp điểm (Off-peak).
- **Hoạt họa (Animation) Dòng Công Suất Thời Gian Thực**:
  - Sơ đồ đơn tuyến (*Single Line Diagram - SLD*) chuẩn IEC với dòng hạt điện tử di chuyển từ lưới 110kV qua máy cắt MC-172 $\rightarrow$ MBA 224 (63MVA) $\rightarrow$ Thanh cái C21 22kV $\rightarrow$ 4 xuất tuyến (474, 476, 478, 480).
  - Tốc độ di chuyển của hạt điện tử tỷ lệ thuận với công suất tải thực tế (MW).
- **Trực quan hóa Khoa học & Toán học Chuyên Sâu**:
  - **Dự báo đa bước (Multi-horizon)**: 1P (30p), 2P (1h), 6P (3h), 12P (6h), 24P (12h), 48P (24h) kèm dải phân bố tin cậy 95% (Confidence Interval).
  - **Phân tích Duck Curve**: Thấy rõ "bụng vịt" do điện mặt trời phát ngược vào giữa trưa (11h-13h) và "cổ vịt" dốc tải tăng vọt ($dP/dt > 12\text{ MW/h}$) vào đầu giờ tối (17h-19h).
  - **Bộ thanh tra B-Splines của KAN**: Khảo sát họ hàm cơ sở bậc 3 theo công thức đệ quy Cox-de Boor và hàm kích hoạt học được $\phi(x) = w_b \text{GELU}(x) + \sum c_k B_k(x)$ trên miền $[-2, 2]$.
  - **Kiểm toán dữ liệu 7 tầng**: Xác thực định luật bảo toàn công suất $P_{224} = \sum P_i$ với sai số triệt tiêu $< 10^{-14}$.

---

## 2. Hướng Dẫn Khởi Chạy (1 Lệnh Duy Nhất)

### Bước 1: Khởi động máy chủ Web
Mở terminal PowerShell trong thư mục gốc của project và chạy:
```powershell
python run_web.py
```

Hệ thống sẽ:
1. Tự động kiểm tra cổng mạng khả dụng (mặc định `http://127.0.0.1:8000`).
2. Nạp dữ liệu kiểm thử từ `data/test.csv`.
3. Tự động mở trình duyệt web hiển thị giao diện SCADA điều độ.

### Bước 2: Truy cập tài liệu API Swagger (Tùy chọn)
- Đường dẫn tài liệu tương tác: **`http://127.0.0.1:8000/api/docs`**

---

## 3. Cấu Trúc Mã Nguồn

```
web_app/
├── backend/
│   └── app/
│       ├── main.py                     # Entry point FastAPI, CORS, static mounts
│       ├── core/
│       │   ├── config.py               # Cấu hình hệ thống, trạm biến áp, mốc benchmark
│       │   └── physics.py              # Công thức vật lý điện: S, Q, I, cos phi, EVN tariff
│       ├── services/
│       │   ├── data_service.py         # Nạp test.csv, trích xuất snapshot và timeline
│       │   ├── forecast_service.py     # Động cơ dự báo 6 mốc thời gian kèm dải tin cậy 95%
│       │   ├── topology_service.py     # Sơ đồ đơn tuyến SLD và ma trận kề Top-K
│       │   ├── kan_service.py          # Thuật toán đệ quy Cox-de Boor tính B-splines
│       │   └── duck_curve_service.py   # Phân tích hồ sơ phụ tải 24h và tốc độ dốc tải dP/dt
│       └── api/
│           ├── telemetry.py            # API giám sát SCADA
│           ├── forecast.py             # API dự báo ST-TopoKAN
│           ├── topology.py             # API sơ đồ trạm và tô-pô lưới
│           ├── kan.py                  # API kiểm tra B-splines KAN
│           ├── duck_curve.py           # API phân tích điện mặt trời
│           └── physics_audit.py        # API 7 bước làm sạch dữ liệu
└── frontend/
    ├── index.html                      # Giao diện chính Single Page Application
    ├── css/
    │   └── custom.css                  # Thiết kế SCADA công nghiệp, hiệu ứng kính và ánh sáng neon
    └── js/
        ├── api.js                      # Tầng gọi API client
        ├── scada_flow.js               # Canvas vẽ sơ đồ đơn tuyến và hoạt họa dòng điện tử
        ├── charts.js                   # Cấu hình đồ thị ECharts đa kênh
        ├── kan_visualizer.js           # Bộ vẽ đường cong kích hoạt B-splines
        └── app.js                      # Điều phối trạng thái, thanh tua thời gian và Replay
```

