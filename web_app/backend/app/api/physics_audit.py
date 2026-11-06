from fastapi import APIRouter

router = APIRouter(prefix="/api/physics-audit", tags=["Physics-Informed Data Audit"])

@router.get("/stages")
def get_physics_cleaning_stages():
    return {
        "pipeline_title": "Quy trình tiền xử lý 7 tầng dựa trên bản chất vật lý điện lực (Physics-Informed Preprocessing)",
        "verified_conservation": {
            "formula": "P_224 = P_474 + P_476 + P_478 + P_480",
            "max_absolute_error": "7.11e-15",
            "all_intervals_30min": True,
            "missing_cells_after_clean": 0,
            "duplicate_timestamps": 0
        },
        "stages": [
            {
                "step": 1,
                "name": "Xử lý Zero nghi ngờ (Suspicious Zeros)",
                "condition": "Cảm biến báo P = 0 nhưng có đầy đủ 3 pha điện áp (U_A, U_B, U_C) và 3 pha dòng điện (I_A, I_B, I_C) + Cos_phi",
                "action": "Tính lại công suất thực tế theo định luật vật lý 3 pha: P_phys = sqrt(3) * U * I * cos(phi) thay cho giá trị 0 bị lỗi của sensor.",
                "significance": "Tránh mất mát mẫu tải thực tế và ngăn ngừa làm lệch trung bình trượt."
            },
            {
                "step": 2,
                "name": "Đánh giá sai số vật lý trên tải dương",
                "condition": "P_clean > 0 và P_phys > 0.1 MW",
                "action": "Tính sai số tuyệt đối và phần trăm: Error% = |P - P_phys| / P_phys. Lọc ra các điểm đo có dấu hiệu hư hỏng phần cứng.",
                "significance": "Thiết lập đường đối chứng vật lý khách quan cho các bước làm sạch tiếp theo."
            },
            {
                "step": 3,
                "name": "Phân loại & Xử lý P âm (Solar vs Đấu ngược cực tính)",
                "condition": "Công suất đo P mang giá trị âm (< 0)",
                "action": "Trong khung giờ nắng (06:00 - 18:00): gán về 0 (điện mặt trời mái nhà phát ngược lên lưới). Ngoài giờ nắng: nếu khớp P_phys thì đảo dấu (sửa lỗi đấu ngược cực tính của biến dòng CT).",
                "significance": "Giải quyết dứt điểm hiện tượng công suất âm đặc thù của vùng có mật độ điện mặt trời cao như Tây Ninh."
            },
            {
                "step": 4,
                "name": "Lấp đầy dữ liệu NaN từ nguồn vật lý",
                "condition": "Dữ liệu đo bị khuyết thiếu (NaN)",
                "action": "Cứu các bản ghi NaN bằng công thức vật lý P_phys nếu cảm biến vẫn ghi nhận được giá trị điện áp và dòng điện.",
                "significance": "Hồi phục dữ liệu nguyên bản với độ chính xác cao nhất mà không cần đến suy đoán thống kê."
            },
            {
                "step": 5,
                "name": "Xử lý vi phạm vật lý nặng (Lệch > 10%)",
                "condition": "Sai số tương đối giữa công suất đo và công suất tính toán vật lý vượt quá 10%",
                "action": "Thay thế giá trị đo đạc bị nhiễu nặng bằng giá trị P_phys chuẩn.",
                "significance": "Loại bỏ hoàn toàn các xung nhiễu đột biến do lỗi truyền thông SCADA."
            },
            {
                "step": 6,
                "name": "Phát hiện Outlier thống kê (MAD & Jump Detector)",
                "condition": "Các điểm nhảy vọt bất thường vượt ngưỡng sai lệch trung vị tuyệt đối (MAD)",
                "action": "Sử dụng Z-score hiệu chỉnh theo MAD (vững hơn chuẩn hóa Z thông thường) và bộ phát hiện bước nhảy để gắn cờ điểm ngoại lai.",
                "significance": "Bảo vệ mô hình ST-TopoKAN khỏi các điểm dị biệt gây nổ gradient trong quá trình huấn luyện."
            },
            {
                "step": 7,
                "name": "Nội suy đa tầng (Multi-tier Interpolation)",
                "condition": "Các khoảng trống dữ liệu còn lại sau các bước lọc trên",
                "action": "Nội suy tuyến tính nếu khoảng trống <= 1 giờ; nếu dài hơn thì dùng mẫu cùng giờ của 4 tuần lân cận -> theo mùa (mùa mưa/khô) -> theo năm.",
                "significance": "Tạo ra chuỗi thời gian liên tục 100% không khuyết thiếu để trích xuất đặc trưng trễ (Lag 48, Lag 336)."
            }
        ]
    }

