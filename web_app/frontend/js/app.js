/**
 * Main Application Controller for ST-TopoKAN Web Platform
 * Clean Enterprise Architecture (Light Theme, Fail-safe Tab Switching).
 */
const App = {
  currentIndex: 100,
  maxIndex: 10334,
  isPlaying: false,
  playSpeedMs: 1500,
  playTimer: null,
  activeTab: 'scada',
  currentHorizon: 48,
  sldVisualizer: null,

  async init() {
    console.log('Initializing ST-TopoKAN SCADA & Forecasting System...');
    
    // 1. Initialize canvas SLD visualizer
    this.sldVisualizer = new ScadaFlowVisualizer('sldCanvas');

    // 2. Initialize Charts
    ChartManager.initTelemetryChart('telemetryChart');
    ChartManager.initForecastChart('forecastChart');
    ChartManager.initDuckCurveChart('duckCurveChart');
    ChartManager.initTopologyHeatmap('topologyHeatmap');
    KanVisualizer.init('kanSplineChart');

    // 3. Load initial metadata
    await this.loadMetadata();

    // 4. Setup Event Listeners
    this.setupEventListeners();

    // 5. Initial data load
    await this.updateCurrentState();
    await this.loadBenchmarks();
    await this.loadDuckCurve();
    await this.loadTopologyGraph();
    await this.loadPhysicsAudit();

    // 6. Refresh charts layout
    setTimeout(() => {
      ChartManager.resizeAll();
    }, 200);
  },

  async loadMetadata() {
    try {
      const meta = await API.getMetadata();
      const titleEl = document.getElementById('substationTitle');
      if (titleEl) titleEl.innerText = meta.substation_name;
      
      const badgeEl = document.getElementById('totalRecordsBadge');
      if (badgeEl) badgeEl.innerText = `${meta.test_total_records.toLocaleString()} bản ghi (Test)`;
      
      this.maxIndex = meta.test_total_records - 49;
      
      const slider = document.getElementById('timelineSlider');
      if (slider) {
        slider.max = this.maxIndex;
        slider.value = this.currentIndex;
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  },

  setupEventListeners() {
    // Robust Tab switching by data-tab attribute
    const tabButtons = document.querySelectorAll('[data-tab]');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Timeline Slider
    const slider = document.getElementById('timelineSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        this.currentIndex = parseInt(e.target.value);
        this.updateCurrentState();
      });
    }

    // Play/Pause Auto Simulation
    const playBtn = document.getElementById('playPauseBtn');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        this.togglePlay();
      });
    }

    // Step Forward / Backward
    const stepPrev = document.getElementById('stepPrevBtn');
    if (stepPrev) {
      stepPrev.addEventListener('click', () => {
        this.step(-1);
      });
    }

    const stepNext = document.getElementById('stepNextBtn');
    if (stepNext) {
      stepNext.addEventListener('click', () => {
        this.step(1);
      });
    }

    // Speed Selector
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.speed-btn').forEach(b => {
          b.classList.remove('bg-[#003b7a]', 'text-white');
          b.classList.add('bg-slate-100', 'text-slate-700');
        });
        btn.classList.remove('bg-slate-100', 'text-slate-700');
        btn.classList.add('bg-[#003b7a]', 'text-white');
        this.playSpeedMs = parseInt(btn.dataset.speed);
        if (this.isPlaying) {
          clearInterval(this.playTimer);
          this.playTimer = setInterval(() => this.step(1), this.playSpeedMs);
        }
      });
    });

    // Horizon Selector Buttons (1P, 2P, 6P, 12P, 24P, 48P)
    document.querySelectorAll('.horizon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.horizon-btn').forEach(b => {
          b.classList.remove('bg-[#003b7a]', 'text-white', 'border-[#003b7a]', 'font-bold');
          b.classList.add('bg-white', 'border-slate-300', 'text-slate-700');
        });
        btn.classList.remove('bg-white', 'border-slate-300', 'text-slate-700');
        btn.classList.add('bg-[#003b7a]', 'text-white', 'border-[#003b7a]', 'font-bold');
        
        this.currentHorizon = parseInt(btn.dataset.horizon);
        this.updateForecastTab();
      });
    });

    // KAN Grid size slider
    const kanGridSlider = document.getElementById('kanGridSlider');
    if (kanGridSlider) {
      kanGridSlider.addEventListener('input', (e) => {
        const g = parseInt(e.target.value);
        const valEl = document.getElementById('kanGridVal');
        if (valEl) valEl.innerText = g;
        KanVisualizer.loadCurves(g, 3);
      });
    }
  },

  switchTab(tabId) {
    if (!tabId) return;
    this.activeTab = tabId;

    // Toggle active class on all tab buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
      const match = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', match);
    });

    // Toggle hidden class on tab contents
    document.querySelectorAll('.tab-content').forEach(section => {
      const isTarget = section.id === `tab-${tabId}`;
      section.classList.toggle('hidden', !isTarget);
    });

    // Refresh charts on tab reveal
    setTimeout(() => {
      ChartManager.resizeAll();
      if (tabId === 'forecast') {
        this.updateForecastTab();
      } else if (tabId === 'duck-curve') {
        if (ChartManager.duckCurveChart) ChartManager.duckCurveChart.resize();
      } else if (tabId === 'kan') {
        if (KanVisualizer.chart) KanVisualizer.chart.resize();
        if (ChartManager.topoChart) ChartManager.topoChart.resize();
      }
    }, 60);
  },

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    const playBtn = document.getElementById('playPauseBtn');
    if (this.isPlaying) {
      playBtn.innerText = 'Dừng phát lại';
      playBtn.className = 'px-3.5 py-1.5 rounded text-xs font-semibold bg-[#d32f2f] text-white hover:bg-[#b71c1c] transition-colors shadow-sm';
      this.playTimer = setInterval(() => this.step(1), this.playSpeedMs);
    } else {
      playBtn.innerText = 'Phát lại SCADA';
      playBtn.className = 'px-3.5 py-1.5 rounded text-xs font-semibold bg-[#003b7a] text-white hover:bg-[#002b59] transition-colors shadow-sm';
      clearInterval(this.playTimer);
    }
  },

  step(delta) {
    this.currentIndex += delta;
    if (this.currentIndex > this.maxIndex) this.currentIndex = 48;
    if (this.currentIndex < 48) this.currentIndex = 48;
    
    const slider = document.getElementById('timelineSlider');
    if (slider) slider.value = this.currentIndex;

    this.updateCurrentState();
  },

  async updateCurrentState() {
    try {
      const telemetry = await API.getLiveTelemetry(this.currentIndex);
      this.renderTelemetryCards(telemetry);

      if (this.sldVisualizer) {
        this.sldVisualizer.updateTelemetry(telemetry);
      }

      const start = Math.max(0, this.currentIndex - 36);
      const seriesData = await API.getTelemetrySeries(start, 48);
      ChartManager.updateTelemetryChart(seriesData);

      if (this.activeTab === 'forecast') {
        await this.updateForecastTab();
      }
    } catch (err) {
      console.error('Failed to update state:', err);
    }
  },

  renderTelemetryCards(telemetry) {
    const t224 = telemetry.transformer_224;
    
    const tsEl = document.getElementById('currentTimestamp');
    if (tsEl) tsEl.innerText = `${telemetry.date_display} ${telemetry.time_display}`;

    const sliderDisplay = document.getElementById('sliderTimeDisplay');
    if (sliderDisplay) sliderDisplay.innerText = `${telemetry.date_display} ${telemetry.time_display}`;

    // MBA 224 Primary KPIs
    const elP224 = document.getElementById('valP224');
    if (elP224) elP224.innerText = t224.p_mw.toFixed(2);

    const elSMVA = document.getElementById('valSMVA');
    if (elSMVA) elSMVA.innerText = `${t224.s_mva.toFixed(2)} MVA`;

    const elQMVAR = document.getElementById('valQMVAR');
    if (elQMVAR) elQMVAR.innerText = t224.q_mvar.toFixed(2);

    const elLoadFactor = document.getElementById('valLoadFactor');
    if (elLoadFactor) elLoadFactor.innerText = `${t224.load_factor_pct}%`;

    const barEl = document.getElementById('loadFactorBar');
    if (barEl) barEl.style.width = `${Math.min(100, t224.load_factor_pct)}%`;

    const elCurrent = document.getElementById('valCurrent22kv');
    if (elCurrent) elCurrent.innerText = `${t224.current_secondary_a.toLocaleString()} A`;

    // Physical Conservation Check
    const check = t224.conservation_check;
    const checkBadge = document.getElementById('conservationBadge');
    if (checkBadge) {
      if (check.is_conserved) {
        checkBadge.className = 'px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300';
        checkBadge.innerText = `CÂN BẰNG NĂNG LƯỢNG (ΔP = ${check.delta_mw.toExponential(2)} MW)`;
      } else {
        checkBadge.className = 'px-2.5 py-1 rounded text-xs font-mono font-bold bg-red-50 text-red-800 border border-red-300';
        checkBadge.innerText = `LỆCH CÔNG SUẤT: ΔP = ${check.delta_mw} MW`;
      }
    }

    // Tariff badge
    const tariff = telemetry.tariff;
    const tariffEl = document.getElementById('tariffBadge');
    if (tariffEl) {
      tariffEl.innerText = tariff.badge;
      tariffEl.className = `px-2.5 py-1 rounded text-xs font-semibold border ${
        tariff.zone_code === 'PEAK' ? 'badge-peak' : (tariff.zone_code === 'OFF_PEAK' ? 'badge-offpeak' : 'badge-normal')
      }`;
    }

    // Weather widget
    const w = telemetry.weather;
    const elTemp = document.getElementById('weatherTemp');
    if (elTemp) elTemp.innerText = `${w.temp_c.toFixed(1)}°C`;

    const elHum = document.getElementById('weatherHum');
    if (elHum) elHum.innerText = `${w.humidity_pct.toFixed(0)}%`;

    const elWind = document.getElementById('weatherWind');
    if (elWind) elWind.innerText = `${w.wind_speed_kmh.toFixed(1)} km/h`;

    const elPrecip = document.getElementById('weatherPrecip');
    if (elPrecip) elPrecip.innerText = `${w.precip_mm.toFixed(1)} mm`;

    // 4 Feeders Cards
    const feedersContainer = document.getElementById('feedersContainer');
    if (feedersContainer && telemetry.feeders) {
      feedersContainer.innerHTML = telemetry.feeders.map(f => `
        <div class="evn-card p-3 bg-white">
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#003b7a] border border-slate-200">${f.code}</span>
            <span class="text-xs font-mono text-slate-500">${f.current_a} A</span>
          </div>
          <div class="text-xs font-bold text-slate-800 truncate">${f.name}</div>
          <div class="text-[11px] text-slate-500 mb-2 truncate">${f.category}</div>
          
          <div class="flex items-baseline justify-between mb-1">
            <span class="text-lg font-bold font-mono text-slate-900">${f.p_mw.toFixed(2)} <span class="text-xs font-normal text-slate-500">MW</span></span>
            <span class="text-xs font-mono text-slate-600 font-semibold">${f.load_factor_pct}% tải</span>
          </div>

          <div class="w-full bg-slate-100 rounded h-1.5 overflow-hidden border border-slate-200">
            <div class="h-full rounded transition-all duration-300" style="width: ${f.load_factor_pct}%; background-color: ${f.color}"></div>
          </div>
        </div>
      `).join('');
    }
  },

  async updateForecastTab() {
    try {
      const forecastData = await API.getForecastWindow(this.currentIndex, this.currentHorizon);
      ChartManager.updateForecastChart(forecastData);

      const m = forecastData.window_metrics;
      const b = forecastData.official_test_benchmark;

      const modelNameEl = document.getElementById('forecastModelName');
      if (modelNameEl) modelNameEl.innerText = forecastData.model_architecture;

      const horizonBadgeEl = document.getElementById('forecastHorizonBadge');
      if (horizonBadgeEl) horizonBadgeEl.innerText = forecastData.horizon_name;

      const elWape = document.getElementById('valWape');
      if (elWape) elWape.innerText = `${m.wape_pct.toFixed(2)}%`;

      const elBenchWape = document.getElementById('valBenchWape');
      if (elBenchWape) elBenchWape.innerText = `Kỳ vọng test: ${b.wape_pct}%`;

      const elMae = document.getElementById('valMae');
      if (elMae) elMae.innerText = `${m.mae_mw.toFixed(3)} MW`;

      const elBenchMae = document.getElementById('valBenchMae');
      if (elBenchMae) elBenchMae.innerText = `Test: ${b.mae_mw} MW`;

      const elRmse = document.getElementById('valRmse');
      if (elRmse) elRmse.innerText = `${m.rmse_mw.toFixed(3)} MW`;

      const elBenchRmse = document.getElementById('valBenchRmse');
      if (elBenchRmse) elBenchRmse.innerText = `Test: ${b.rmse_mw} MW`;

      const elR2 = document.getElementById('valR2');
      if (elR2) elR2.innerText = m.r2_score.toFixed(4);

      const elBenchR2 = document.getElementById('valBenchR2');
      if (elBenchR2) elBenchR2.innerText = `Test: ${b.r2_score}`;

      const elParams = document.getElementById('valParams');
      if (elParams) elParams.innerText = `${b.params_k}K`;

      const elLatency = document.getElementById('valLatency');
      if (elLatency) elLatency.innerText = `${b.inference_latency_ms} ms`;
    } catch (err) {
      console.error('Failed to update forecast tab:', err);
    }
  },

  async loadBenchmarks() {
    try {
      const data = await API.getBenchmarks();
      const tbody = document.getElementById('benchmarkTableBody');
      if (!tbody) return;

      tbody.innerHTML = data.benchmarks.map(b => `
        <tr class="border-b border-slate-200 hover:bg-slate-50 transition-colors">
          <td class="py-2.5 px-3 font-mono font-bold text-[#003b7a]">${b.horizon_name}</td>
          <td class="py-2.5 px-3 font-mono text-slate-700">${b.model}</td>
          <td class="py-2.5 px-3 font-mono font-bold ${b.wape < 10 ? 'text-[#15803d]' : 'text-amber-700'}">${b.wape.toFixed(2)}%</td>
          <td class="py-2.5 px-3 font-mono text-slate-900">${b.mae.toFixed(4)}</td>
          <td class="py-2.5 px-3 font-mono text-slate-900">${b.rmse.toFixed(4)}</td>
          <td class="py-2.5 px-3 font-mono text-slate-900 font-semibold">${b.r2.toFixed(4)}</td>
          <td class="py-2.5 px-3 font-mono text-slate-600">${b.params_k}K</td>
          <td class="py-2.5 px-3 font-mono text-slate-600">${b.latency_ms} ms</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Failed to load benchmarks:', err);
    }
  },

  async loadDuckCurve() {
    try {
      const data = await API.getDuckCurve();
      ChartManager.updateDuckCurveChart(data);

      const h = data.duck_curve_highlights;
      const elDip = document.getElementById('solarDipText');
      if (elDip) elDip.innerText = h.solar_belly_hour;

      const elPeak = document.getElementById('eveningPeakText');
      if (elPeak) elPeak.innerText = h.evening_peak_hour;

      const elRamp = document.getElementById('maxRampSpeed');
      if (elRamp) elRamp.innerText = `${h.max_ramp_speed_mw_h} MW/h (${h.max_ramp_time})`;

      const elAnalysis = document.getElementById('duckAnalysisText');
      if (elAnalysis) elAnalysis.innerText = h.analysis;
    } catch (err) {
      console.error('Failed to load duck curve:', err);
    }
  },

  async loadTopologyGraph() {
    try {
      const data = await API.getLearnedGraph();
      ChartManager.updateTopologyHeatmap(data);
      const badge = document.getElementById('topoSparsityBadge');
      if (badge) badge.innerText = `Độ thưa: ${data.sparsity_pct}% (Top-${data.topk})`;
    } catch (err) {
      console.error('Failed to load topology graph:', err);
    }
  },

  async loadPhysicsAudit() {
    try {
      const audit = await API.getPhysicsAudit();
      const container = document.getElementById('physicsAuditContainer');
      if (!container) return;

      container.innerHTML = audit.stages.map(s => `
        <div class="evn-card p-3.5 border-l-4 ${s.step <= 3 ? 'border-l-[#003b7a]' : 'border-l-[#005baa]'}">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-[#003b7a] border border-slate-200">BƯỚC ${s.step}</span>
            <span class="text-[11px] text-slate-500 font-mono">Quy chuẩn SCADA & Vật lý</span>
          </div>
          <h4 class="text-xs font-bold text-slate-900 mb-1">${s.name}</h4>
          <p class="text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mb-1"><span class="font-bold">Điều kiện:</span> ${s.condition}</p>
          <p class="text-xs text-slate-700 mb-1.5 leading-relaxed"><span class="font-bold text-[#003b7a]">Giải pháp:</span> ${s.action}</p>
          <div class="text-[11px] text-emerald-800 bg-emerald-50 p-1.5 rounded border border-emerald-200">
            <span class="font-bold">Ý nghĩa:</span> ${s.significance}
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error('Failed to load physics audit:', err);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
