/**
 * High-performance ECharts instances for ST-TopoKAN Telemetry & Forecasting
 * Clean National Grid EVN Standard Theme (White, EVN Blue #005baa, Dispatch Red #d32f2f).
 */
const ChartManager = {
  telemetryChart: null,
  forecastChart: null,
  duckCurveChart: null,
  topoChart: null,

  initTelemetryChart(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    this.telemetryChart = echarts.init(el);
    return this.telemetryChart;
  },

  updateTelemetryChart(seriesData) {
    if (!this.telemetryChart) return;

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
        data: ['P_224 (Tổng)', 'MC-474 (KCN)', 'MC-476 (Dân sinh)', 'MC-478 (Solar)', 'MC-480 (Nông nghiệp)', 'Nhiệt độ (°C)'],
        top: 6,
        textStyle: { color: '#334155', fontSize: 11, fontFamily: 'Inter' }
      },
      grid: { left: '3%', right: '3%', bottom: '12%', top: '14%', containLabel: true },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
        { type: 'slider', bottom: '1%', height: 16, borderColor: '#e2e8f0', textStyle: { color: '#64748b' } }
      ],
      xAxis: {
        type: 'category',
        data: seriesData.timestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Công suất (MW)',
          nameTextStyle: { color: '#475569', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
        },
        {
          type: 'value',
          name: 'Nhiệt độ (°C)',
          nameTextStyle: { color: '#d32f2f', fontSize: 11 },
          min: 20,
          max: 45,
          position: 'right',
          splitLine: { show: false },
          axisLabel: { color: '#d32f2f', fontSize: 10, fontFamily: 'JetBrains Mono' }
        }
      ],
      series: [
        {
          name: 'P_224 (Tổng)',
          type: 'line',
          smooth: true,
          data: seriesData.series.P_224,
          lineStyle: { width: 2.5, color: '#005baa' },
          itemStyle: { color: '#005baa' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 91, 170, 0.15)' },
              { offset: 1, color: 'rgba(0, 91, 170, 0.01)' }
            ])
          }
        },
        {
          name: 'MC-474 (KCN)',
          type: 'line',
          smooth: true,
          data: seriesData.series.P_474,
          lineStyle: { width: 1.5, color: '#1e40af' },
          itemStyle: { color: '#1e40af' }
        },
        {
          name: 'MC-476 (Dân sinh)',
          type: 'line',
          smooth: true,
          data: seriesData.series.P_476,
          lineStyle: { width: 1.5, color: '#0284c7' },
          itemStyle: { color: '#0284c7' }
        },
        {
          name: 'MC-478 (Solar)',
          type: 'line',
          smooth: true,
          data: seriesData.series.P_478,
          lineStyle: { width: 2, color: '#d97706' },
          itemStyle: { color: '#d97706' }
        },
        {
          name: 'MC-480 (Nông nghiệp)',
          type: 'line',
          smooth: true,
          data: seriesData.series.P_480,
          lineStyle: { width: 1.5, color: '#15803d' },
          itemStyle: { color: '#15803d' }
        },
        {
          name: 'Nhiệt độ (°C)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: seriesData.series.temp,
          lineStyle: { width: 1.5, type: 'dashed', color: '#d32f2f' },
          itemStyle: { color: '#d32f2f' }
        }
      ]
    };

    this.telemetryChart.setOption(option);
  },

  initForecastChart(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    this.forecastChart = echarts.init(el);
    return this.forecastChart;
  },

  updateForecastChart(forecastData) {
    if (!this.forecastChart) return;

    const histLen = forecastData.history.timestamps.length;
    const futureLen = forecastData.future.timestamps.length;

    const allTimestamps = [...forecastData.history.timestamps, ...forecastData.future.timestamps];

    const histSeries = [...forecastData.history.values, ...Array(futureLen).fill(null)];
    const actualSeries = [...Array(histLen - 1).fill(null), forecastData.history.values[histLen - 1], ...forecastData.future.actual];
    const forecastSeries = [...Array(histLen - 1).fill(null), forecastData.history.values[histLen - 1], ...forecastData.future.forecast];
    const ciUpperSeries = [...Array(histLen - 1).fill(null), forecastData.history.values[histLen - 1], ...forecastData.future.ci_upper];
    const ciLowerSeries = [...Array(histLen - 1).fill(null), forecastData.history.values[histLen - 1], ...forecastData.future.ci_lower];

    const option = {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8' } },
        backgroundColor: '#ffffff',
        borderColor: '#005baa',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
      },
      legend: {
        data: ['Lịch sử 24h', 'Thực tế (Ground Truth)', 'ST-TopoKAN Dự báo', 'Khoảng tin cậy 95% (Upper)', 'Khoảng tin cậy 95% (Lower)'],
        top: 6,
        textStyle: { color: '#334155', fontSize: 11, fontFamily: 'Inter' },
        selected: { 'Khoảng tin cậy 95% (Upper)': true, 'Khoảng tin cậy 95% (Lower)': true }
      },
      grid: { left: '3%', right: '3%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: allTimestamps,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      yAxis: {
        type: 'value',
        name: 'Công suất P_224 (MW)',
        nameTextStyle: { color: '#475569', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      series: [
        {
          name: 'Lịch sử 24h',
          type: 'line',
          smooth: true,
          data: histSeries,
          lineStyle: { width: 2, color: '#64748b' },
          itemStyle: { color: '#64748b' },
          areaStyle: { color: 'rgba(100, 116, 139, 0.05)' }
        },
        {
          name: 'Thực tế (Ground Truth)',
          type: 'line',
          smooth: true,
          data: actualSeries,
          lineStyle: { width: 2, color: '#334155', type: 'dashed' },
          itemStyle: { color: '#334155' }
        },
        {
          name: 'ST-TopoKAN Dự báo',
          type: 'line',
          smooth: true,
          data: forecastSeries,
          lineStyle: { width: 2.5, color: '#005baa' },
          itemStyle: { color: '#005baa' }
        },
        {
          name: 'Khoảng tin cậy 95% (Upper)',
          type: 'line',
          smooth: true,
          data: ciUpperSeries,
          lineStyle: { opacity: 0 },
          stack: 'confidence-band',
          symbol: 'none'
        },
        {
          name: 'Khoảng tin cậy 95% (Lower)',
          type: 'line',
          smooth: true,
          data: ciLowerSeries,
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(0, 91, 170, 0.12)' },
          symbol: 'none'
        }
      ]
    };

    this.forecastChart.setOption(option);
  },

  initDuckCurveChart(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    this.duckCurveChart = echarts.init(el);
    return this.duckCurveChart;
  },

  updateDuckCurveChart(duckData) {
    if (!this.duckCurveChart) return;

    const option = {
      backgroundColor: '#ffffff',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', lineStyle: { color: '#94a3b8' } },
        backgroundColor: '#ffffff',
        borderColor: '#d97706',
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: '#0f172a', fontFamily: 'JetBrains Mono', fontSize: 12 },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);'
      },
      legend: {
        data: ['Phụ tải MBA 224 (Duck Curve)', 'Xuất tuyến 478 (Rooftop Solar)', 'Tốc độ dốc tải dP/dt (MW/h)'],
        top: 6,
        textStyle: { color: '#334155', fontSize: 11, fontFamily: 'Inter' }
      },
      grid: { left: '3%', right: '4%', bottom: '10%', top: '14%', containLabel: true },
      xAxis: {
        type: 'category',
        data: duckData.hours,
        boundaryGap: true,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Công suất (MW)',
          nameTextStyle: { color: '#475569', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          axisLabel: { color: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }
        },
        {
          type: 'value',
          name: 'Tốc độ dốc dP/dt (MW/h)',
          nameTextStyle: { color: '#d32f2f', fontSize: 11 },
          position: 'right',
          splitLine: { show: false },
          axisLabel: { color: '#d32f2f', fontSize: 10, fontFamily: 'JetBrains Mono' }
        }
      ],
      series: [
        {
          name: 'Phụ tải MBA 224 (Duck Curve)',
          type: 'line',
          smooth: true,
          data: duckData.p224_mean,
          lineStyle: { width: 3, color: '#005baa' },
          itemStyle: { color: '#005baa' },
          markArea: {
            itemStyle: { color: 'rgba(0, 91, 170, 0.06)' },
            data: [
              [
                { name: 'Bụng Vịt (11h-13h)', xAxis: '11:00' },
                { xAxis: '13:00' }
              ],
              [
                { name: 'Cổ Vịt (17h-19h)', xAxis: '17:00' },
                { xAxis: '19:00' }
              ]
            ]
          }
        },
        {
          name: 'Xuất tuyến 478 (Rooftop Solar)',
          type: 'line',
          smooth: true,
          data: duckData.feeders.P_478_solar,
          lineStyle: { width: 2, color: '#d97706' },
          itemStyle: { color: '#d97706' }
        },
        {
          name: 'Tốc độ dốc tải dP/dt (MW/h)',
          type: 'bar',
          yAxisIndex: 1,
          data: duckData.ramp_rates_mw_per_h,
          itemStyle: {
            color: (params) => (params.value >= 0 ? '#d32f2f' : '#005baa')
          }
        }
      ]
    };

    this.duckCurveChart.setOption(option);
  },

  initTopologyHeatmap(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return null;
    this.topoChart = echarts.init(el);
    return this.topoChart;
  },

  updateTopologyHeatmap(graphData) {
    if (!this.topoChart) return;

    const matrix = graphData.matrix;
    const nodes = graphData.nodes;
    const data = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        data.push([i, j, matrix[i][j]]);
      }
    }

    const option = {
      backgroundColor: '#ffffff',
      tooltip: {
        position: 'top',
        formatter: (params) => `${nodes[params.value[0]]} ↔ ${nodes[params.value[1]]}: ${params.value[2]}`
      },
      grid: { height: '76%', top: '6%', left: '18%', right: '6%' },
      xAxis: {
        type: 'category',
        data: nodes,
        splitArea: { show: true },
        axisLabel: { color: '#334155', fontSize: 10, interval: 0, rotate: 30 }
      },
      yAxis: {
        type: 'category',
        data: nodes,
        splitArea: { show: true },
        axisLabel: { color: '#334155', fontSize: 10 }
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
        inRange: {
          color: ['#f8fafc', '#e0f2fe', '#93c5fd', '#005baa', '#003b7a']
        },
        textStyle: { color: '#475569' }
      },
      series: [
        {
          name: 'Trọng số liên kết Tô-pô (Top-K)',
          type: 'heatmap',
          data: data,
          label: { show: false }
        }
      ]
    };

    this.topoChart.setOption(option);
  },

  resizeAll() {
    if (this.telemetryChart) this.telemetryChart.resize();
    if (this.forecastChart) this.forecastChart.resize();
    if (this.duckCurveChart) this.duckCurveChart.resize();
    if (this.topoChart) this.topoChart.resize();
  }
};

window.addEventListener('resize', () => {
  ChartManager.resizeAll();
});
