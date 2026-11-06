<div align="center">

# ST-TopoKAN: Mạng Kolmogorov-Arnold Nhận thức Không gian - Thời gian Dự báo Phụ tải Điện Trạm Biến áp

### *Spatial-Temporal Topological Kolmogorov-Arnold Network for Substation Load Forecasting & SCADA Dispatching*

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg?logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![SCADA Standard](https://img.shields.io/badge/Grid%20Standard-IEC%2061850-red.svg)](https://www.iec.ch/)
[![Data Integrity](https://img.shields.io/badge/SHA--256-100%25%20Verified-brightgreen.svg)](#-xác-thực-toàn-vẹn-dữ-liệu-sha-256)

<p align="center">
  <b>Nghiên cứu ứng dụng tại Máy biến áp T2 (224 - 63 MVA) Trạm 110/22kV Tân Hưng (Tây Ninh)</b><br>
  Tích hợp giải pháp mạng Kolmogorov-Arnold đa thang (MS-KAN), mã hóa đồ thị thưa Top-K, chống dịch chuyển phân phối dữ liệu (Data Drift) và Nền tảng điều độ SCADA thời gian thực chuẩn EVN / NSMO.
</p>

---

</div>

## 📌 Mục lục

- [1. Giới thiệu tổng quan](#-1-giới-thiệu-tổng-quan)
- [2. Đóng góp khoa học & Kiến trúc mô hình](#-2-đóng-góp-khoa-học--kiến-trúc-mô-hình)
- [3. Dữ liệu thực nghiệm & Kiểm chứng vật lý](#-3-dữ-liệu-thực-nghiệm--kiểm-chứng-vật-lý)
- [4. Kết quả thực nghiệm & Phân tích đối sánh](#-4-kết-quả-thực-nghiệm--phân-tích-đối-sánh)
- [5. Hệ thống Web SCADA & Nền tảng điều độ số](#-5-hệ-thống-web-scada--nền-tảng-điều-độ-số)
- [6. Cấu trúc thư mục chuẩn](#-6-cấu-trúc-thư-mục-chuẩn)
- [7. Hướng dẫn cài đặt & Khởi chạy](#-7-hướng-dẫn-cài-đặt--khởi-chạy)
- [8. Xác thực toàn vẹn dữ liệu (SHA-256)](#-8-xác-thực-toàn-vẹn-dữ-liệu-sha-256)
- [9. Trích dẫn & Bản quyền](#-9-trích-dẫn--bản-quyền)

---

## 🔬 1. Giới thiệu tổng quan

Dự báo phụ tải điện ngắn hạn và trung hạn tại cấp trạm biến áp phân phối 110/22kV đóng vai trò sống còn trong việc lập phương thức vận hành hệ thống điện, tối ưu hóa công suất truyền tải và ngăn ngừa sự cố quá tải MBA. Tuy nhiên, sự phát triển bùng nổ của **nguồn năng lượng tái tạo phân tán (Đặc biệt là điện mặt trời mái nhà - Rooftop Solar PV tại khu vực Tây Ninh)** đã làm thay đổi hoàn toàn hình thái tiêu thụ điện truyền thống:

1. **Hiện tượng "Đường cong con vịt" (Duck Curve)**: Tải ròng suy giảm nghiêm trọng vào giữa trưa (10:00 - 13:00) do nguồn điện mặt trời tự dùng và phát ngược, sau đó dốc tải tăng dựng đứng ($dP/dt > 12\text{ MW/h}$) vào giờ cao điểm tối (17:30 - 20:30).
2. **Dịch chuyển phân phối dữ liệu (Data Drift)**: Mức tiêu thụ điện năm 2025 sụt giảm đột ngột **-15.10%** so với trung bình các năm trước do tái cấu trúc phụ tải và thời tiết, khiến các mô hình chuỗi thời gian thông thường (LSTM, Transformer) bị lệch dự báo nghiêm trọng.
3. **Quan hệ không gian - thời gian phức tạp**: Tương tác chéo giữa 4 xuất tuyến mang đặc thù phụ tải khác nhau (Công nghiệp, Sinh hoạt đô thị, Năng lượng mặt trời, Nông nghiệp tưới tiêu).

**ST-TopoKAN** (*Spatial-Temporal Topological Kolmogorov-Arnold Network*) được thiết kế nhằm giải quyết triệt để 3 thách thức trên bằng sự kết hợp giữa nền tảng toán học vững chắc của mạng Kolmogorov-Arnold và các ràng buộc vật lý lưới điện thực tế.

---

## 🧠 2. Đóng góp khoa học & Kiến trúc mô hình

Mô hình **ST-TopoKAN** kết hợp 4 cơ chế cốt lõi trong một kiến trúc lai thống nhất:

```
[SCADA & Weather Features (10 Channels)]
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
[Target Lag P224]      [Multivariate Channels]
      │                       │
[Isolated GRU Branch]   [Top-K Sparse Graph Encoder (k=4)]
 (Quán tính thời gian)  (Tô-pô không gian giữa các xuất tuyến)
      │                       │
      └───────────┬───────────┘
                  ▼
   [Multi-Scale KAN (MS-KAN Layer)]
   (B-splines bậc 3: Lưới thô + Lưới mịn)
                  │
                  ▼
         [Fusion & Latent Space]
                  │
                  ▼
        [Non-linear Projection] ──┐
                  │               │
                  ▼               ▼
      [Linear AR Anchor Head] ──[+] ──► [Final Multi-Horizon Forecast]
    (Mỏ neo chống Data Drift)
```

### Các thành phần chính:

1. **Lớp mạng Kolmogorov-Arnold đa thang (MS-KAN)**:
   Thay thế hàm kích hoạt cố định ở nút (như ReLU, GELU trong MLP) bằng các hàm kích hoạt học được đặt trực tiếp trên các cạnh kết nối dựa trên chuỗi cơ sở B-spline bậc 3 theo công thức đệ quy Cox-de Boor:
   $$\phi(x) = w_b \text{GELU}(x) + \sum_{k=1}^{G+k-1} c_k B_k(x)$$
   Sử dụng hai mức lưới độ phân giải ($G_1$ thô và $G_2$ mịn) giúp mô hình đồng thời nắm bắt được xu thế trơn vĩ mô và các dao động xung nhọn cục bộ.

2. **Bộ mã hóa đồ thị thưa (Top-$K$ Sparse Graph, $k=4$)**:
   Xác định ma trận kề học được giữa 10 kênh đặc trưng, tự động triệt tiêu các liên kết yếu (nhiễu) bằng mặt nạ Top-$K$, chỉ giữ lại 4 tương tác có trọng số lớn nhất cho mỗi nút để bảo toàn tính chọn lọc không gian.

3. **Nhánh thời gian GRU cô lập (Isolated GRU)**:
   Xử lý độc lập chuỗi trễ của trạm đích $P_{224}$, ngăn ngừa hiện tượng pha loãng tín hiệu đặc trưng trễ khi trộn lẫn sớm với các biến thời tiết ngoại sinh.

4. **Nhánh tự hồi quy tuyến tính (AR Anchor Head)**:
   Đóng vai trò mỏ neo tuyến tính trực tiếp, triệt tiêu xu hướng dự báo thừa (over-forecasting) do Data Drift gây ra trên tập kiểm thử 2025.

5. **Hàm mất mát phức hợp bảo toàn vật lý (Physics-Informed Composite Loss)**:
   Kết hợp Huber bất đối xứng (phạt nặng sai số dự báo thiếu để đảm bảo an toàn cấp điện), thành phần tỷ số sai số WAPE, thành phần gia quyền đỉnh tải và số hạng phạt độ mượt đạo hàm bậc một, bậc hai ($\Delta^1, \Delta^2$) để triệt tiêu các dao động sóng răng cưa phi vật lý.

---

## 📊 3. Dữ liệu thực nghiệm & Kiểm chứng vật lý

### 3.1. Thông số cụm Trạm Biến áp Tân Hưng 110/22kV

* **Đối tượng nghiên cứu**: Máy biến áp T2 (Mã điều độ: **MBA 224**), công suất định mức **63 MVA**, cấp điện áp 110/22kV.
* **4 Xuất tuyến 22kV thành phần**:
  * **MC-474 Tân Hưng**: Phụ tải Công nghiệp - Khu công nghiệp tập trung.
  * **MC-476 Tân Hưng**: Phụ tải Sinh hoạt đô thị, trung tâm dân cư, cơ quan, y tế.
  * **MC-478 Tân Hưng**: Xuất tuyến tập trung dày đặc **Điện mặt trời mái nhà (Rooftop Solar PV)**; có thời điểm phát ngược lên lưới.
  * **MC-480 Tân Hưng**: Phụ tải Nông nghiệp, trang trại và trạm bơm tưới tiêu.
* **4 Biến số môi trường / thời tiết**: Nhiệt độ không khí (`temp`), Độ ẩm tương đối (`rhum`), Lượng mưa (`prcp`), Tốc độ gió (`wspd`).

### 3.2. Phân chia chuỗi thời gian (Chronological 80/10/10)

Tổng quy mô chuỗi thời gian gồm **103.344 mốc dữ liệu liên tục** với tần suất đo **30 phút/chu kỳ** kéo dài gần 6 năm (02/2020 đến 12/2025):

| Tập dữ liệu | Số bản ghi | Tỷ lệ | Khoảng thời gian thu thập | Mục đích sử dụng |
| :--- | :---: | :---: | :--- | :--- |
| **Train Set** | 82.675 | 80.0% | `2020-02-09 00:00:00` $\rightarrow$ `2024-10-27 09:00:00` | Huấn luyện tham số KAN, GRU & Graph |
| **Validation Set** | 10.334 | 10.0% | `2024-10-27 09:30:00` $\rightarrow$ `2025-05-30 16:00:00` | Tinh chỉnh siêu tham số & Early Stopping |
| **Test Set** | 10.335 | 10.0% | `2025-05-30 16:30:00` $\rightarrow$ `2025-12-31 23:30:00` | Đánh giá độc lập (Giai đoạn sụt giảm phụ tải) |
| **Tổng cộng** | **103.344** | **100%** | **09/02/2020 $\rightarrow$ 31/12/2025** | Chuỗi liên tục 100%, không khuyết thiếu |

### 3.3. Kiểm chứng Định luật Bảo toàn Công suất (Kirchhoff)

Đã kiểm toán xác thực phương trình bảo toàn công suất nút thanh cái 22kV trên toàn bộ 103.344 dòng:
$$P_{224}(t) = P_{474}(t) + P_{476}(t) + P_{478}(t) + P_{480}(t)$$
* **Kết quả**: Khớp tuyệt đối 100% bản ghi.
* **Sai số tuyệt đối lớn nhất**: $\max |P_{224} - \sum P_i| = 7.11 \times 10^{-15}\text{ MW}$ (Triệt tiêu hoàn toàn ở mức độ chính xác số học máy tính).

---

## 📈 4. Kết quả thực nghiệm & Phân tích đối sánh

### 4.1. Hiệu năng dự báo đa bước (Multi-Horizon Forecast)

Đánh giá trên tập kiểm thử độc lập (Test Set) qua 6 mốc thời gian chiến lược từ cực ngắn hạn (30 phút) đến dài hạn (24 giờ):

| Khoảng dự báo (Horizon) | Bước ($H$) | Mô hình tối ưu | **MAE (MW)** | **RMSE (MW)** | **WAPE (%)** | **Hệ số $R^2$** | Số tham số | Thời gian suy luận (GPU) |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1P (30 phút)** | 1 | `Topo_KAN_MS` | **1.254** | **1.909** | **6.20%** | **0.9497** | 332.2 K | 0.065 ms |
| **2P (1 giờ)** | 2 | `Topo_KAN_MS` | **1.475** | **2.205** | **7.29%** | **0.9329** | 334.8 K | 0.064 ms |
| **6P (3 giờ)** | 6 | `Topo_KAN_MS` | **1.960** | **2.821** | **9.69%** | **0.8902** | 342.6 K | 0.086 ms |
| **12P (6 giờ)** | 12 | `Topo_KAN_Standard` | **2.197** | **3.059** | **10.86%** | **0.8709** | 361.8 K | 0.115 ms |
| **24P (12 giờ)** | 24 | `Topo_KAN_Standard` | **2.576** | **3.536** | **12.73%** | **0.8277** | 375.5 K | 0.120 ms |
| **48P (24 giờ)** | 48 | `Topo_KAN_Standard` | **2.804** | **3.797** | **13.86%** | **0.8013** | 403.6 K | 0.130 ms |
| **Trung bình toàn dải** | — | **ST-TopoKAN** | **2.044** | **2.888** | **10.10%** | **0.8788** | ~358 K | **< 0.1 ms** |

> *Ghi chú: Kết quả sử dụng Ensemble trung bình của 3 mô hình khởi tạo độc lập (Seeds: 42, 123, 999). Ở mốc 30 phút, độ lệch chuẩn giữa các seed đạt mức lý tưởng $\pm 0.04\%$.*

### 4.2. Đánh giá cắt lớp thành phần (Ablation Study)

Nghiên cứu cắt lớp trên toàn bộ 6 mốc thời gian khẳng định tính tất yếu của từng cơ chế:

| Cấu hình biến thể | WAPE Trung bình (%) | Mức đóng góp cải thiện ($\Delta$) | Ý nghĩa kỹ thuật |
| :--- | :---: | :---: | :--- |
| (1) `KAN_base` | 13.40% | — | Đường cơ sở mạng KAN thuần túy |
| (2) `KAN_base + AR Head` | 12.91% | -0.49% | Neo tuyến tính, khắc phục bước đầu Data Drift |
| (3) Bản (2) + `Sparse Graph (Topology)` | **11.98%** | **-0.93%** | **Đóng góp lớn nhất**: Bắt tương quan chéo giữa 4 xuất tuyến |
| (4) Bản (3) + `MS-KAN (Multi-Scale)` | 11.16% | -0.82% | Tích hợp lưới mịn và thô bắt biến thiên trơn |
| (5) Bản (4) + `Nhánh GRU` | 10.86% | -0.30% | Giữ trọn vẹn trí nhớ ngắn hạn của tải trễ $P_{224}$ |
| (6) **ST-TopoKAN Đầy đủ** | **10.10%** | **-0.76%** | Tối ưu hóa toàn diện bằng Hàm mất mát phức hợp |

---

## ⚡ 5. Hệ thống Web SCADA & Nền tảng điều độ số

Để chuyển giao kết quả nghiên cứu vào thực tiễn vận hành lưới điện, một hệ thống điều độ SCADA hoàn chỉnh đã được phát triển trong thư mục `web_app/`:

* **Chuẩn nhận diện Điều độ Điện lực Quốc gia (EVN / NSMO)**:
  * Nền trắng thanh thoát (`#F8FAFC`), viền thẻ sắc nét, điểm xuyết màu Xanh Navy Điện Lực (`#003B7A`) và Đỏ Quốc Gia (`#D32F2F`).
  * Phân định biểu giá điện 3 giá của EVN theo thời gian thực: Giờ cao điểm (Đỏ), Bình thường (Xanh lam), Thấp điểm (Xanh lục).
* **Hoạt họa dòng công suất thời gian thực (Real-time Power Flow Animation)**:
  * Sơ đồ đơn tuyến (*Single Line Diagram - SLD*) chuẩn IEC với dòng hạt điện tử chuyển động từ lưới 110kV qua MBA T2 (224) đến thanh cái C21 và 4 xuất tuyến.
  * Tốc độ di chuyển của hạt điện tử phản ánh chính xác độ lớn công suất thực tế (MW).
* **Trực quan hóa Duck Curve & Bộ thanh tra KAN Spline**:
  * Phân tích trực quan dải "bụng vịt" do điện mặt trời trưa nắng và tốc độ dốc tải $dP/dt$.
  * Minh họa trực tiếp hình dạng họ đường cong B-splines bậc 3 trên từng cạnh của mạng nơ-ron KAN.

---

## 📁 6. Cấu trúc thư mục chuẩn

```
ST-TopoKAN-PowerGrid/
├── reports/                      # Báo cáo chuyên đề khoa học bản Word hoàn chỉnh (.docx)
│   └── BaoCao_ST_TopoKAN.docx
├── presentation/                 # Slide báo cáo thuyết trình chính thức (.pptx)
│   └── ST_TopoKAN.pptx
├── notebooks/                    # 4 tệp Jupyter Notebook gốc (Giữ nguyên toàn bộ mã nguồn & output)
│   ├── ST_TopoKAN.ipynb          # Huấn luyện mô hình ST-TopoKAN, MS-KAN, đánh giá 6 horizons
│   ├── Xu_ly_01.ipynb            # Tiền xử lý tầng 1: Làm sạch dữ liệu vật lý SCADA
│   ├── Xu_ly_02.ipynb            # Tiền xử lý tầng 2: Lấy mẫu chu kỳ 30 phút, đồng bộ thời gian
│   └── Xu_ly_03.ipynb            # Tiền xử lý tầng 3: Ghép dữ liệu thời tiết & sinh đặc trưng
├── data/                         # Bộ dữ liệu chuỗi thời gian chuẩn hoá chia 80/10/10
│   ├── train.csv                 # 82.675 dòng (02/2020 - 10/2024)
│   ├── val.csv                   # 10.334 dòng (10/2024 - 05/2025)
│   ├── test.csv                  # 10.335 dòng (05/2025 - 12/2025)
│   └── split_metadata.json       # Metadata chi tiết tỷ lệ phân chia và thời gian
├── data_raw/                     # Dữ liệu gốc lưu trữ
│   ├── Tan_Hung_dataraw.rar      # Tệp nén chứa 67 bảng SCADA gốc từ đơn vị vận hành
│   └── weather_today_data.csv    # Dữ liệu khí tượng thu thập
├── validation/                   # Kiểm toán dữ liệu độc lập & nhật ký tái tạo
│   ├── KET_QUA_DOI_CHIEU.txt     # Báo cáo đối chiếu dữ liệu & phân tích lỗi định dạng gốc
│   ├── ket_qua_kiem_tra.json     # Kết quả kiểm tra tính toàn vẹn và định luật Kirchhoff
│   ├── kiem_tra_TIME_du_lieu_goc.csv # Danh sách dòng thiếu ngày trong dữ liệu thô
│   └── nhat_ky_chay_lai.txt      # Nhật ký chạy lại quy trình tiền xử lý
├── web_app/                      # Ứng dụng Web Giám sát SCADA & Dự báo Phụ tải ST-TopoKAN
│   ├── backend/                  # API server FastAPI (Python)
│   ├── frontend/                 # Giao diện SCADA Web (HTML5/Canvas/ECharts/Tailwind)
│   └── README_WEB.md             # Hướng dẫn chi tiết về nền tảng Web
├── DANH_MUC_FILE.csv             # Danh mục đối chiếu tên tệp, tên gốc và mã SHA-256
├── SHA256SUMS.txt                # Bản băm SHA-256 toàn bộ 18 tệp tin trong repository
├── README.md                     # Tài liệu hướng dẫn khoa học của dự án (Tệp này)
└── run_web.py                    # Script khởi chạy nhanh Web App (1-Click Startup)
```

---

## 🚀 7. Hướng dẫn cài đặt & Khởi chạy

### 7.1. Cài đặt môi trường Python

Khuyến nghị sử dụng Python **3.10** hoặc **3.11** trong môi trường ảo:

```bash
# Tạo và kích hoạt môi trường ảo
python -m venv venv
# Trên Windows:
venv\Scripts\activate
# Trên Linux/macOS:
source venv/bin/activate

# Cài đặt các thư viện cần thiết
pip install torch torchvision numpy pandas scikit-learn matplotlib seaborn
pip install fastapi uvicorn pydantic requests
```

### 7.2. Chạy thử nghiệm mô hình trong Notebooks

Khởi động Jupyter Lab / Notebook để khảo sát và chạy lại mô hình:
```bash
jupyter notebook notebooks/ST_TopoKAN.ipynb
```
*Lưu ý: Môi trường huấn luyện tối ưu trên GPU hỗ trợ CUDA (như NVIDIA T4, RTX 3060/4090).*

### 7.3. Khởi chạy Ứng dụng Web SCADA Điều độ

Chỉ cần thực thi **1 lệnh duy nhất** từ thư mục gốc:

```bash
python run_web.py
```

Hệ thống sẽ:
1. Tự động kiểm tra và giải phóng cổng mạng khả dụng (mặc định: `http://127.0.0.1:8000`).
2. Tải mô hình và nạp dữ liệu SCADA từ `data/test.csv`.
3. Tự động mở trình duyệt web hiển thị Dashboard Điều độ Trạm biến áp Tân Hưng 110/22kV.
4. Tài liệu API tương tác Swagger khả dụng tại: `http://127.0.0.1:8000/api/docs`.

---

## 🔒 8. Xác thực toàn vẹn dữ liệu (SHA-256)

Để đảm bảo tính trung thực khoa học và ngăn chặn sửa đổi sai lệch số liệu, toàn bộ 18 tệp tin trong kho lưu trữ đều được niêm phong bằng mã băm **SHA-256**. Bạn có thể kiểm tra tính toàn vẹn bất kỳ lúc nào bằng lệnh:

```bash
# Trên Linux / macOS / Git Bash:
sha256sum -c SHA256SUMS.txt

# Trên Windows PowerShell:
python -c "
import hashlib
from pathlib import Path
for line in open('SHA256SUMS.txt', encoding='utf-8'):
    expected, path = line.strip().split(maxsplit=1)
    actual = hashlib.sha256(Path(path).read_bytes()).hexdigest()
    assert actual == expected, f'MISMATCH: {path}'
print('100% SHA-256 INTEGRITY VERIFIED!')
"
```

---

## 📚 9. Trích dẫn & Bản quyền

Nếu công trình nghiên cứu, mã nguồn hoặc dữ liệu này hữu ích cho công việc học thuật của bạn, vui lòng trích dẫn:

```bibtex
@article{st_topokan_2025,
  title={ST-TopoKAN: Spatial-Temporal Topological Kolmogorov-Arnold Network for Substation Electric Load Forecasting},
  author={Nhom Nghien Cuu Chuyen De AI - Dai Hoc Thuy Loi},
  journal={Bao Cao Khoa Hoc Chuyen De Tri Tue Nhan Tao},
  year={2025},
  publisher={Truong Dai hoc Thuy Loi}
}
```

Dự án được phân phối dưới giấy phép **MIT License**. Mọi đóng góp, phản hồi hoặc mở rộng nghiên cứu đều được hoan nghênh thông qua GitHub Issues và Pull Requests.
