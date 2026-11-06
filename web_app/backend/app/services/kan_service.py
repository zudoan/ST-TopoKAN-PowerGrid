import math
import numpy as np
from typing import Dict, Any, List

class KanService:
    """
    Mathematical service for Kolmogorov-Arnold Network (KAN) visualization,
    B-spline computation (Cox-de Boor recursion) and Multi-Scale Grid activation.
    """

    @staticmethod
    def cox_de_boor(x_vals: np.ndarray, knots: np.ndarray, p: int) -> np.ndarray:
        """
        Computes B-spline basis functions of order p (p=3 for cubic splines)
        over knot vector using the Cox-de Boor recursive formula.
        """
        m = len(knots) - 1
        n = m - p - 1  # number of basis functions
        
        # Base case p = 0
        bases = []
        for i in range(n + p):
            b_i = np.where((x_vals >= knots[i]) & (x_vals < knots[i+1]), 1.0, 0.0)
            bases.append(b_i)
            
        # Recursive steps p = 1 .. p
        current_bases = bases
        for k in range(1, p + 1):
            next_bases = []
            for i in range(n + p - k):
                denom1 = knots[i+k] - knots[i]
                denom2 = knots[i+k+1] - knots[i+1]
                
                term1 = np.zeros_like(x_vals)
                if denom1 > 1e-6:
                    term1 = ((x_vals - knots[i]) / denom1) * current_bases[i]
                    
                term2 = np.zeros_like(x_vals)
                if denom2 > 1e-6:
                    term2 = ((knots[i+k+1] - x_vals) / denom2) * current_bases[i+1]
                    
                next_bases.append(term1 + term2)
            current_bases = next_bases
            
        return np.array(current_bases[:n])

    def get_spline_basis_curves(self, grid_size: int = 5, spline_order: int = 3) -> Dict[str, Any]:
        """
        Generates the family of cubic B-splines over the normalized range [-2.0, 2.0].
        """
        x = np.linspace(-2.0, 2.0, 200)
        h = 4.0 / grid_size
        
        # Extended knots for cubic splines
        knots = np.linspace(-2.0 - spline_order * h, 2.0 + spline_order * h, grid_size + 1 + 2 * spline_order)
        basis_funcs = self.cox_de_boor(x, knots, spline_order)
        
        curves = []
        for i in range(basis_funcs.shape[0]):
            curves.append({
                "basis_index": i,
                "label": f"B_{i,3}(x)",
                "values": [round(float(v), 4) for v in basis_funcs[i]]
            })

        # Base GELU activation
        def gelu(val):
            return 0.5 * val * (1.0 + np.tanh(np.sqrt(2.0 / np.pi) * (val + 0.044715 * np.power(val, 3))))
        
        gelu_curve = [round(float(v), 4) for v in gelu(x)]

        # Sample learned non-linear activation for an electrical load feature
        # phi(x) = w_b * GELU(x) + sum(c_k * B_k(x))
        sample_weights = np.array([0.45, -0.32, 0.88, -0.65, 0.95, -0.20, 0.40, 0.15])[:basis_funcs.shape[0]]
        spline_term = np.dot(sample_weights, basis_funcs)
        learned_phi = 0.5 * np.array(gelu_curve) + spline_term

        return {
            "x_axis": [round(float(v), 3) for v in x],
            "grid_size": grid_size,
            "spline_order": spline_order,
            "knots": [round(float(k), 2) for k in knots],
            "basis_curves": curves,
            "base_activation_gelu": gelu_curve,
            "composite_activation_phi": [round(float(v), 4) for v in learned_phi],
            "formula": "phi(x) = w_b * GELU(x) + sum_k(c_k * B_k(x))"
        }

    def get_kan_vs_mlp_comparison(self) -> Dict[str, Any]:
        """
        Scientific comparison between KAN and classical MLP in time-series load forecasting.
        """
        return {
            "comparisons": [
                {
                    "metric": "Vị trí hàm kích hoạt",
                    "mlp": "Tại nút (Nodes) với hàm cố định: ReLU, GELU, Sigmoid",
                    "kan": "Tại cạnh (Edges) với hàm spline tham số hóa linh hoạt B(x)",
                    "benefit_for_power": "Học trực tiếp các đường cong tải phi tuyến phức tạp thay vì chỉ kéo dãn không gian tuyến tính"
                },
                {
                    "metric": "Hiệu quả tham số (Parameter Efficiency)",
                    "mlp": "Cần mạng sâu/rộng để xấp xỉ hàm phi tuyến cao bậc (O(N^2))",
                    "kan": "Định lý Kolmogorov-Arnold cho phép xấp xỉ chính xác với số nút ít hơn nhiều",
                    "benefit_for_power": "Mô hình ST-TopoKAN chỉ cần ~332K - 403K tham số, thời gian suy luận < 0.13ms/mẫu"
                },
                {
                    "metric": "Khả năng xử lý đa tỷ lệ (Multi-Scale)",
                    "mlp": "Độ phân giải tĩnh trên toàn miền dữ liệu",
                    "kan": "Lưới kép (Coarse Grid=5 + Fine Grid=10) giải quyết đồng thời xu hướng nền và dao động nhanh",
                    "benefit_for_power": "Nắm bắt chính xác hiện tượng dốc tải (Ramping) của điện mặt trời giữa trưa và phụ tải đỉnh chập tối"
                },
                {
                    "metric": "Tính diễn giải toán học (Interpretability)",
                    "mlp": "Hộp đen (Black-box), khó phân rã trọng số",
                    "kan": "Mỗi cạnh biểu diễn trực tiếp hàm giải tích $\\phi(x)$, có thể vẽ và kiểm tra trực quan",
                    "benefit_for_power": "Kỹ sư điều độ SCADA có thể xác thực tính tin cậy của mô hình trước khi ra lệnh đóng cắt"
                }
            ]
        }

kan_service = KanService()

