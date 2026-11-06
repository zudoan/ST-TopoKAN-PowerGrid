# ST-TopoKAN: Spatial-Temporal Topological Kolmogorov-Arnold Network for Substation Electric Load Forecasting

**Mạng Kolmogorov-Arnold Nhận thức Không gian - Thời gian Dự báo Phụ tải Điện Trạm Biến áp 110/22kV**

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C?style=flat&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Grid Standard](https://img.shields.io/badge/Grid%20Standard-IEC%2061850-D32F2F?style=flat)](https://www.iec.ch/)
[![License](https://img.shields.io/badge/License-MIT-2ea44f?style=flat)](LICENSE)
[![Data Integrity](https://img.shields.io/badge/SHA--256-100%25%20Verified-003B7A?style=flat)](#8-xác-thực-toàn-vẹn-dữ-liệu-sha-256)

Nghiên cứu ứng dụng tại Máy biến áp T2 (MBA 224 - 63 MVA) Trạm 110/22kV Tân Hưng (Tây Ninh). Tích hợp mạng Kolmogorov-Arnold đa thang (MS-KAN), mã hóa đồ thị thưa Top-K, cơ chế mỏ neo tự hồi quy tuyến tính (AR) chống dịch chuyển phân phối dữ liệu (Data Drift), và Nền tảng điều độ SCADA thời gian thực chuẩn EVN / NSMO.

[Báo cáo khoa học](reports/BaoCao_ST_TopoKAN.docx) | [Slide thuyết trình](presentation/ST_TopoKAN.pptx) | [Mã nguồn thực nghiệm](notebooks/) | [Nền tảng SCADA Web](web_app/)

---

## Mục lục

- [1. Giới thiệu tổng quan](#1-giới-thiệu-tổng-quan)
- [2. Kiến trúc mô hình ST-TopoKAN](#2-kiến-trúc-mô-hình-st-topokan)
- [3. Dữ liệu thực nghiệm và kiểm chứng vật lý](#3-dữ-liệu-thực-nghiệm-và-kiểm-chứng-vật-lý)
- [4. Kết quả thực nghiệm và đối chuẩn](#4-kết-quả-thực-nghiệm-và-đối-chuẩn)
  - [4.1. Hiệu năng dự báo đa bước của ST-TopoKAN](#41-hiệu-năng-dự-báo-đa-bước-của-st-topokan)
  - [4.2. Đối chuẩn với 6 dòng kiến trúc học sâu kinh điển](#42-đối-chuẩn-với-6-dòng-kiến-trúc-học-sâu-kinh-điển)
  - [4.3. Đánh giá cắt lớp thành phần (Ablation Study)](#43-đánh-giá-cắt-lớp-thành-phần-ablation-study)
- [5. Nền tảng điều độ SCADA và Web App](#5-nền-tảng-điều-độ-scada-và-web-app)
- [6. Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
- [7. Hướng dẫn cài đặt và khởi chạy](#7-hướng-dẫn-cài-đặt-và-khởi-chạy)
- [8. Xác thực toàn vẹn dữ liệu (SHA-256)](#8-xác-thực-toàn-vẹn-dữ-liệu-sha-256)
- [9. Trích dẫn và bản quyền](#9-trích-dẫn-và-bản-quyền)

---

## 1. Giới thiệu tổng quan

Dự báo phụ tải điện ngắn hạn và trung hạn tại cấp trạm biến áp phân phối 110/22kV đóng vai trò quan trọng trong việc lập phương thức vận hành hệ thống điện, tối ưu hóa công suất truyền tải và ngăn ngừa sự cố quá tải máy biến áp. Sự phát triển mạnh của nguồn năng lượng tái tạo phân tán (đặc biệt là điện mặt trời mái nhà tại khu vực Tây Ninh) tạo ra các thách thức phi tuyến tính nghiêm trọng:

1. **Hiện tượng đường cong con vịt (Duck Curve)**: Phụ tải ròng giảm sâu vào khung giờ trưa (10:00 - 13:00) do nguồn điện mặt trời tự dùng và phát ngược lên lưới, sau đó xuất hiện dốc tải tăng vọt ($dP/dt > 12\text{ MW/h}$) vào cao điểm tối (17:30 - 20:30).
2. **Dịch chuyển phân phối dữ liệu (Data Drift)**: Mức tiêu thụ điện năm 2025 sụt giảm đột ngột -15.10% so với trung bình các năm trước do tái cấu trúc phụ tải và thay đổi thời tiết, dẫn đến hiện tượng dự báo thừa kéo dài ở các mô hình chuỗi thời gian thông thường.
3. **Tương tác không gian đa xuất tuyến**: Mối tương quan chéo phức tạp giữa 4 xuất tuyến mang đặc thù phụ tải khác nhau (Công nghiệp, Sinh hoạt đô thị, Điện mặt trời mái nhà, Nông nghiệp tưới tiêu).

Mô hình **ST-TopoKAN** (*Spatial-Temporal Topological Kolmogorov-Arnold Network*) được đề xuất nhằm giải quyết đồng thời các thách thức trên thông qua sự kết hợp giữa hàm kích hoạt B-spline học được, cấu trúc đồ thị thưa và các ràng buộc vật lý lưới điện.

---

## 2. Kiến trúc mô hình ST-TopoKAN

Mô hình tích hợp 4 cơ chế bổ trợ lẫn nhau:

```
[SCADA & Weather Features (10 Channels)]
                  │
      ┌───────────┴───────────┐
      ▼                       ▼
[Target Lag P224]      [Multivariate Channels]
      │                       │
[Isolated GRU Branch]   [Top-K Sparse Graph Encoder (k=4)]
 (Quán tính thời gian)  (Tô-pô không gian liên xuất tuyến)
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

### Chi tiết các khối chức năng

1. **Lớp mạng Kolmogorov-Arnold đa thang (MS-KAN)**:
   Thay thế hàm kích hoạt cố định ở nút bằng các hàm kích hoạt học được đặt trực tiếp trên các cạnh kết nối dựa trên chuỗi cơ sở B-spline bậc 3 theo công thức đệ quy Cox-de Boor:
   $$\phi(x) = w_b \text{GELU}(x) + \sum_{k=1}^{G+k-1} c_k B_k(x)$$
   Việc sử dụng hai mức lưới ($G_1$ thô và $G_2$ mịn) cho phép mô hình đồng thời nắm bắt xu thế biến thiên trơn và các dao động xung nhọn cục bộ.

2. **Bộ mã hóa đồ thị thưa (Top-K Sparse Graph, k=4)**:
   Xác định ma trận kề học được giữa 10 kênh đặc trưng, tự động triệt tiêu các liên kết nhiễu bằng mặt nạ Top-K, chỉ giữ lại 4 tương tác có trọng số lớn nhất cho mỗi nút để bảo toàn tính chọn lọc không gian.

3. **Nhánh thời gian GRU cô lập (Isolated GRU)**:
   Xử lý độc lập chuỗi trễ của trạm đích $P_{224}$, ngăn ngừa hiện tượng pha loãng tín hiệu trễ khi trộn lẫn sớm với các biến thời tiết ngoại sinh.

4. **Nhánh tự hồi quy tuyến tính (AR Anchor Head)**:
   Đóng vai trò mỏ neo tuyến tính trực tiếp, triệt tiêu xu hướng dự báo thừa do Data Drift trên tập kiểm thử 2025.

5. **Hàm mất mát phức hợp bảo toàn vật lý (Physics-Informed Composite Loss)**:
   Kết hợp hàm Huber bất đối xứng (phạt nặng sai số dự báo thiếu để đảm bảo an toàn cấp điện), thành phần tỷ số sai số WAPE, thành phần gia quyền đỉnh tải và số hạng phạt độ mượt đạo hàm ($\Delta^1, \Delta^2$) để triệt tiêu các dao động sóng răng cưa phi vật lý.

---

## 3. Dữ liệu thực nghiệm và kiểm chứng vật lý

### 3.1. Thông số Trạm biến áp 110/22kV Tân Hưng

- **Đối tượng nghiên cứu**: Máy biến áp T2 (Mã điều độ: **MBA 224**), công suất định mức 63 MVA, cấp điện áp 110/22kV.
- **4 Xuất tuyến 22kV thành phần**:
  - **MC-474 Tân Hưng**: Phụ tải Công nghiệp - Khu công nghiệp tập trung.
  - **MC-476 Tân Hưng**: Phụ tải Sinh hoạt đô thị, trung tâm dân cư, cơ quan, y tế.
  - **MC-478 Tân Hưng**: Xuất tuyến tập trung dày đặc Điện mặt trời mái nhà (Rooftop Solar PV).
  - **MC-480 Tân Hưng**: Phụ tải Nông nghiệp, trang trại và trạm bơm tưới tiêu.
- **4 Biến số môi trường và thời tiết**: Nhiệt độ không khí (`temp`), Độ ẩm tương đối (`rhum`), Lượng mưa (`prcp`), Tốc độ gió (`wspd`).

### 3.2. Phân chia chuỗi thời gian theo thứ tự thời gian (80/10/10)

Tổng quy mô chuỗi thời gian gồm 103.344 mốc dữ liệu liên tục với tần suất 30 phút/chu kỳ (09/02/2020 đến 31/12/2025):

| Tập dữ liệu | Số bản ghi | Tỷ lệ | Khoảng thời gian | Mục đích sử dụng |
| :--- | :---: | :---: | :--- | :--- |
| **Train Set** | 82.675 | 80.0% | 09/02/2020 00:00:00 - 27/10/2024 09:00:00 | Huấn luyện tham số KAN, GRU và Graph |
| **Validation Set** | 10.334 | 10.0% | 27/10/2024 09:30:00 - 30/05/2025 16:00:00 | Tinh chỉnh siêu tham số và Early Stopping |
| **Test Set** | 10.335 | 10.0% | 30/05/2025 16:30:00 - 31/12/2025 23:30:00 | Đánh giá độc lập (Giai đoạn sụt giảm phụ tải) |
| **Tổng cộng** | **103.344** | **100%** | **09/02/2020 - 31/12/2025** | Chuỗi liên tục 100%, không khuyết thiếu |

### 3.3. Kiểm chứng định luật bảo toàn công suất (Kirchhoff)

Phương trình bảo toàn công suất tại nút thanh cái 22kV được xác thực trên toàn bộ 103.344 mốc:
$$P_{224}(t) = P_{474}(t) + P_{476}(t) + P_{478}(t) + P_{480}(t)$$
- Tỷ lệ khớp: 100% số bản ghi.
- Sai số tuyệt đối lớn nhất: $\max |P_{224} - \sum P_i| = 7.11 \times 10^{-15}\text{ MW}$ (triệt tiêu ở mức độ chính xác số học dấu phẩy động).

---

## 4. Kết quả thực nghiệm và đối chuẩn

### 4.1. Hiệu năng dự báo đa bước của ST-TopoKAN

Đánh giá độc lập trên tập kiểm thử Test Set qua 6 khoảng dự báo:

| Khoảng dự báo | Bước ($H$) | Cấu hình tối ưu | MAE (MW) | RMSE (MW) | WAPE (%) | Hệ số $R^2$ | Số tham số | Thời gian suy luận (GPU) |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1P (30 phút)** | 1 | `Topo_KAN_MS` | 1.254 | 1.909 | **6.20%** | 0.9497 | 332.2 K | 0.065 ms |
| **2P (1 giờ)** | 2 | `Topo_KAN_MS` | 1.475 | 2.205 | **7.29%** | 0.9329 | 334.8 K | 0.064 ms |
| **6P (3 giờ)** | 6 | `Topo_KAN_MS` | 1.960 | 2.821 | **9.69%** | 0.8902 | 342.6 K | 0.086 ms |
| **12P (6 giờ)** | 12 | `Topo_KAN_Standard` | 2.197 | 3.059 | **10.86%** | 0.8709 | 361.8 K | 0.115 ms |
| **24P (12 giờ)** | 24 | `Topo_KAN_Standard` | 2.576 | 3.536 | **12.73%** | 0.8277 | 375.5 K | 0.120 ms |
| **48P (24 giờ)** | 48 | `Topo_KAN_Standard` | 2.804 | 3.797 | **13.86%** | 0.8013 | 403.6 K | 0.130 ms |
| **Trung bình** | — | **ST-TopoKAN** | **2.044** | **2.888** | **10.10%** | **0.8788** | **~358 K** | **0.080 ms** |

*Ghi chú: Kết quả sử dụng cơ chế Ensemble trung bình của 3 mô hình khởi tạo độc lập (Seeds: 42, 123, 999). Độ lệch chuẩn giữa các seed ở mốc 30 phút đạt ±0.04%.*

### 4.2. Đối chuẩn với 6 dòng kiến trúc học sâu kinh điển

Khảo sát đối chuẩn trên 72 kịch bản thực nghiệm độc lập (6 dòng kiến trúc × 2 biến thể BASE/TOPO × 6 khoảng dự báo) trên cùng tập kiểm thử:

| Kiến trúc | Biến thể | 1P (30p) | 2P (1h) | 6P (3h) | 12P (6h) | 24P (12h) | 48P (24h) | WAPE TB | MAE TB | Hệ số $R^2$ | Số tham số | Tốc độ suy luận |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **MLP** | BASE | 8.95% | 10.54% | 12.76% | 14.27% | 16.44% | 16.92% | 13.31% | 2.69 | 0.8157 | 202.3 K | 0.026 ms |
| **MLP** | TOPO | 7.19% | 8.14% | 10.44% | 12.90% | 14.28% | 15.43% | 11.40% | 2.31 | 0.8569 | 229.8 K | 0.025 ms |
| **LSTM** | BASE | 9.08% | 11.47% | 12.91% | 14.63% | 19.55% | 19.61% | 14.54% | 2.94 | 0.7867 | 79.2 K | 0.029 ms |
| **LSTM** | TOPO | 7.31% | 8.86% | 12.99% | 17.09% | 18.14% | 19.30% | 13.95% | 2.82 | 0.7899 | 83.2 K | 0.031 ms |
| **CNN** | BASE | 9.48% | 10.85% | 14.64% | 16.50% | 20.68% | 20.10% | 15.38% | 3.11 | 0.7610 | 39.7 K | 0.028 ms |
| **CNN** | TOPO | 7.01% | 8.24% | 11.69% | 15.88% | 18.10% | 19.05% | 13.33% | 2.70 | 0.7988 | 43.4 K | 0.028 ms |
| **GRU** | BASE | 9.16% | 9.69% | 12.35% | 16.10% | 19.64% | 19.46% | 14.40% | 2.91 | 0.7849 | 64.9 K | 0.029 ms |
| **GRU** | TOPO | 6.90% | 8.30% | 13.05% | 16.21% | 18.15% | 17.88% | 13.42% | 2.71 | 0.8066 | 68.6 K | 0.029 ms |
| **TCN** | BASE | 9.15% | 9.55% | 11.80% | 14.04% | 15.69% | 16.44% | 12.78% | 2.59 | 0.8276 | 39.7 K | 0.029 ms |
| **TCN** | TOPO | 6.98% | 8.23% | 11.80% | 13.29% | 15.24% | 16.57% | 12.02% | 2.43 | 0.8419 | 43.4 K | 0.029 ms |
| **iTransformer** | BASE | 9.30% | 10.23% | 11.91% | 14.23% | 17.63% | 17.91% | 13.54% | 2.74 | 0.8076 | 206.7 K | 0.036 ms |
| **iTransformer** | TOPO | 6.86% | 8.11% | 10.85% | 14.45% | 14.89% | 18.30% | 12.24% | 2.48 | 0.8299 | 226.0 K | 0.036 ms |
| **ST-TopoKAN** | **Đề xuất** | **6.20%** | **7.29%** | **9.69%** | **10.86%** | **12.73%** | **13.86%** | **10.10%** | **2.04** | **0.8788** | **358.4 K** | **0.080 ms** |

**Đúc kết thực nghiệm:**
- **Tính phổ quát của cơ chế tô-pô**: Khi tích hợp khối `SparseTopologyEncoder` (Top-K, k=4), 100% kiến trúc học sâu đều giảm sai số (WAPE cải thiện từ -0.59% đến -2.05%). Điều này xác thực rằng tương quan không gian giữa các xuất tuyến là thuộc tính vật lý khách quan trong vận hành trạm.
- **Ưu thế của ST-TopoKAN**: Đạt WAPE trung bình 10.10%, vượt trội hơn mô hình BASE tốt nhất (12.78%), mô hình TOPO tốt nhất (11.40%) và vượt qua mô hình SOTA Inverted Transformer (12.24%), đồng thời giữ vị trí dẫn đầu ở toàn bộ 6 khoảng dự báo.

### 4.3. Đánh giá cắt lớp thành phần (Ablation Study)

Đánh giá đóng góp biên của từng khối chức năng trong ST-TopoKAN:

| Cấu hình biến thể | WAPE Trung bình (%) | Mức cải thiện biên ($\Delta$) | Vai trò kỹ thuật |
| :--- | :---: | :---: | :--- |
| (1) `KAN_base` | 13.40% | — | Đường cơ sở mạng Kolmogorov-Arnold thuần túy |
| (2) `KAN_base + AR Head` | 12.91% | -0.49% | Mỏ neo tuyến tính, khắc phục bước đầu Data Drift |
| (3) Bản (2) + `Sparse Graph (Topology)` | 11.98% | -0.93% | Đóng góp lớn nhất: Bắt tương quan không gian liên xuất tuyến |
| (4) Bản (3) + `MS-KAN (Multi-Scale)` | 11.16% | -0.82% | Tích hợp lưới mịn và thô bắt biến thiên trơn |
| (5) Bản (4) + `Nhánh GRU` | 10.86% | -0.30% | Giữ trọn vẹn trí nhớ ngắn hạn của tải trễ $P_{224}$ |
| (6) **ST-TopoKAN Đầy đủ** | **10.10%** | **-0.76%** | Tối ưu hóa toàn diện bằng Hàm mất mát phức hợp |

---

## 5. Nền tảng điều độ SCADA và Web App

Ứng dụng web điều độ SCADA hoàn chỉnh được xây dựng tại thư mục `web_app/`:

- **Chuẩn nhận diện điều độ hệ thống điện (EVN / NSMO)**:
  - Giao diện nền sáng (`#F8FAFC`), phối màu Xanh Navy Điều độ (`#003B7A`) và Đỏ Quốc Gia (`#D32F2F`).
  - Tích hợp biểu giá điện 3 giá của EVN theo thời gian thực (Giờ cao điểm, Bình thường, Thấp điểm).
- **Hoạt họa dòng công suất thời gian thực**:
  - Sơ đồ đơn tuyến (Single Line Diagram - SLD) chuẩn IEC với hoạt họa dòng hạt điện tử di chuyển từ lưới 110kV qua MBA T2 (224) đến thanh cái C21 và 4 xuất tuyến. Tốc độ di chuyển tỷ lệ thuận với công suất thực tế.
- **Trực quan hóa Duck Curve và B-Spline Inspector**:
  - Phân tích vùng trũng trưa và tốc độ dốc tải $dP/dt$.
  - Trực quan hóa hình dạng đường cong kích hoạt B-spline bậc 3 trên từng cạnh nơ-ron KAN.

---

## 6. Cấu trúc thư mục

```
ST-TopoKAN-PowerGrid/
├── reports/                      # Báo cáo chuyên đề khoa học bản Word hoàn chỉnh (.docx)
│   └── BaoCao_ST_TopoKAN.docx
├── presentation/                 # Slide báo cáo thuyết trình chính thức (.pptx)
│   └── ST_TopoKAN.pptx
├── notebooks/                    # 5 tệp Jupyter Notebook thực nghiệm
│   ├── ST_TopoKAN.ipynb          # Huấn luyện mô hình ST-TopoKAN, MS-KAN, đánh giá 6 horizons
│   ├── deepbase&deeptopo.ipynb   # Đối chuẩn 6 kiến trúc Deep Learning (BASE vs TOPO) qua 6 horizons
│   ├── Xu_ly_01.ipynb            # Tiền xử lý tầng 1: Làm sạch dữ liệu vật lý SCADA
│   ├── Xu_ly_02.ipynb            # Tiền xử lý tầng 2: Lấy mẫu chu kỳ 30 phút, đồng bộ thời gian
│   └── Xu_ly_03.ipynb            # Tiền xử lý tầng 3: Ghép dữ liệu thời tiết và sinh đặc trưng
├── data/                         # Bộ dữ liệu chuỗi thời gian chuẩn hoá chia 80/10/10
│   ├── train.csv                 # 82.675 dòng (02/2020 - 10/2024)
│   ├── val.csv                   # 10.334 dòng (10/2024 - 05/2025)
│   ├── test.csv                  # 10.335 dòng (05/2025 - 12/2025)
│   └── split_metadata.json       # Metadata chi tiết tỷ lệ phân chia và thời gian
├── data_raw/                     # Dữ liệu gốc lưu trữ
│   ├── Tan_Hung_dataraw.rar      # Tệp nén chứa 67 bảng SCADA gốc từ đơn vị vận hành
│   └── weather_today_data.csv    # Dữ liệu khí tượng thu thập
├── validation/                   # Kiểm toán dữ liệu độc lập và nhật ký tái tạo
│   ├── KET_QUA_DOI_CHIEU.txt     # Báo cáo đối chiếu dữ liệu và phân tích lỗi định dạng gốc
│   ├── ket_qua_kiem_tra.json     # Kết quả kiểm tra tính toàn vẹn và định luật Kirchhoff
│   ├── kiem_tra_TIME_du_lieu_goc.csv # Danh sách dòng thiếu ngày trong dữ liệu thô
│   └── nhat_ky_chay_lai.txt      # Nhật ký chạy lại quy trình tiền xử lý
├── web_app/                      # Ứng dụng Web Giám sát SCADA và Dự báo Phụ tải ST-TopoKAN
│   ├── backend/                  # API server FastAPI (Python)
│   ├── frontend/                 # Giao diện SCADA Web (HTML5/Canvas/ECharts/Tailwind)
│   └── README_WEB.md             # Hướng dẫn chi tiết về nền tảng Web
├── DANH_MUC_FILE.csv             # Danh mục đối chiếu tên tệp, tên gốc và mã SHA-256
├── SHA256SUMS.txt                # Bản băm SHA-256 toàn bộ 19 tệp tin trong repository
├── README.md                     # Tài liệu hướng dẫn khoa học của dự án (Tệp này)
└── run_web.py                    # Script khởi chạy nhanh Web App (1-Click Startup)
```

---

## 7. Hướng dẫn cài đặt và khởi chạy

### 7.1. Cài đặt môi trường Python

Yêu cầu Python 3.10 hoặc 3.11 trong môi trường ảo:

```bash
# Tạo và kích hoạt môi trường ảo
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
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

### 7.3. Khởi chạy Ứng dụng Web SCADA Điều độ

Khởi chạy từ thư mục gốc bằng một lệnh:

```bash
python run_web.py
```

Hệ thống sẽ:
1. Tự động kiểm tra và giải phóng cổng mạng khả dụng (mặc định: `http://127.0.0.1:8000`).
2. Nạp dữ liệu kiểm thử từ `data/test.csv`.
3. Tự động mở trình duyệt hiển thị Dashboard Điều độ Trạm biến áp Tân Hưng 110/22kV.
4. Tài liệu API Swagger khả dụng tại: `http://127.0.0.1:8000/api/docs`.

---

## 8. Xác thực toàn vẹn dữ liệu (SHA-256)

Toàn bộ 19 tệp tin trong kho lưu trữ được niêm phong bằng mã băm SHA-256. Kiểm tra tính toàn vẹn bằng lệnh:

```bash
# Linux / macOS / Git Bash:
sha256sum -c SHA256SUMS.txt

# Windows PowerShell:
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

## 9. Trích dẫn và bản quyền

Trích dẫn công trình:

```bibtex
@article{st_topokan_2025,
  title={ST-TopoKAN: Spatial-Temporal Topological Kolmogorov-Arnold Network for Substation Electric Load Forecasting},
  author={Nhom Nghien Cuu Chuyen De AI - Dai Hoc Thuy Loi},
  journal={Bao Cao Khoa Hoc Chuyen De Tri Tue Nhan Tao},
  year={2025},
  publisher={Truong Dai hoc Thuy Loi}
}
```

Dự án được phân phối dưới giấy phép **MIT License**.
