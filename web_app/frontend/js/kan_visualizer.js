/**
 * Interactive Kolmogorov-Arnold Network (KAN) B-Spline Inspector
 * Clean Light Theme.
 */
const KanVisualizer = {
  chart: null,

  init(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    this.chart = echarts.init(el);
    this.loadCurves(5, 3);
  },

  async loadCurves(gridSize = 5, splineOrder = 3) {
    if (!this.chart) return;
    try {
      const data = await API.getSplineBasis(gridSize, splineOrder);
      this.render(data);
    } catch (err) {
      console.error('Error loading KAN spline basis:', err);
    }
  },

  render(data) {
    const seriesList = [];
    const colors = ['#0284c7', '#4f46e5', '#7c3aed', '#db2777', '#e11d48', '#d97706', '#16a34a', '#0891b2', '#2563eb', '#059669'];

    // 1. Plot individual B-spline basis functions
    data.basis_curves.forEach((curve, i) => {
      seriesList.push({
        name: curve.label,
        type: 'line',
        smooth: true,
        data: curve.values,
        lineStyle: { width: 1.5, type: 'dotted', color: colors[i % colors.length] },
        itemStyle: { color: colors[i % colors.length] },
        symbol: 'none'
      });
    });

    // 2. Base GELU activation
    seriesList.push({
      name: 'w_b · GELU(x) (Nền)',
      type: 'line',
      smooth: true,
      data: data.base_activation_gelu,
      lineStyle: { width: 2, color: '#94a3b8', type: 'dashed' },
      itemStyle: { color: '#94a3b8' },
      symbol: 'none'
    });

    // 3. Composite learned activation phi(x)
    seriesList.push({
      name: 'φ(x) = w_b·GELU(x) + ∑ c_k·B_k(x) (Hàm học KAN)',
      type: 'line',
      smooth: true,
      data: data.composite_activation_phi,
      lineStyle: { width: 3, color: '#0284c7' },
      itemStyle: { color: '#0284c7' },
      symbol: 'none'
    });

    const option = {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8' } },
        backgroundColor: '#ffffff',
        borderColor: '#cbd5e1',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
      },
      legend: {
        top: 6,
        textStyle: { color: '#475569', fontSize: 11, fontFamily: 'Inter' },
        type: 'scroll'
      },
      grid: { left: '3%', right: '3%', bottom: '10%', top: '16%', containLabel: true },
      xAxis: {
        type: 'category',
        name: 'Đặc trưng chuẩn hóa x ∈ [-2.0, 2.0]',
        nameLocation: 'middle',
        nameGap: 24,
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        data: data.x_axis,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      yAxis: {
        type: 'value',
        name: 'Giá trị kích hoạt φ(x)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      series: seriesList
    };

    this.chart.setOption(option);
  }
};
