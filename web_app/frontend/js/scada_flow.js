/**
 * SCADA Single Line Diagram (SLD) Clean Engineering Canvas
 * Conforming to EVN / IEC 61850 substation standards (National Grid White/Blue/Red).
 */
class ScadaFlowVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.telemetry = null;
    this.animId = null;
    this.dpr = window.devicePixelRatio || 1;
    this.initCanvas();
    this.initParticles();
    this.startAnimation();
  }

  initCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = 300;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    window.addEventListener('resize', () => {
      const r = this.canvas.parentElement.getBoundingClientRect();
      this.width = r.width || 800;
      this.height = 300;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
    });
  }

  initParticles() {
    this.particles = [];
    for (let path = 0; path < 5; path++) {
      const count = path === 0 ? 12 : 6;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          pathIndex: path,
          progress: Math.random(),
          speed: 0.0016 + Math.random() * 0.0016,
          size: path === 0 ? 2.5 : 2.0
        });
      }
    }
  }

  updateTelemetry(data) {
    this.telemetry = data;
  }

  startAnimation() {
    const render = () => {
      this.draw();
      this.animId = requestAnimationFrame(render);
    };
    this.animId = requestAnimationFrame(render);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clean white canvas background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // Subtle engineering background grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Geometry layout
    const gridX = 60;
    const gridY = h * 0.5;
    const mc172X = w * 0.22;
    const trafoX = w * 0.38;
    const busX = w * 0.52;
    const feederEndX = w * 0.88;

    const feederYPositions = [
      h * 0.16, // Feeder 474
      h * 0.38, // Feeder 476
      h * 0.62, // Feeder 478
      h * 0.84  // Feeder 480
    ];

    let loadFactor = 0.5;
    let p224 = 20.24;
    let feeders = [
      { p: 7.47, color: '#005baa', code: 'MC-474', name: '474' },
      { p: 2.74, color: '#1e40af', code: 'MC-476', name: '476' },
      { p: 2.32, color: '#d97706', code: 'MC-478', name: '478' },
      { p: 7.71, color: '#15803d', code: 'MC-480', name: '480' }
    ];

    if (this.telemetry && this.telemetry.transformer_224) {
      p224 = this.telemetry.transformer_224.p_mw;
      loadFactor = Math.max(0.15, Math.min(1.2, this.telemetry.transformer_224.load_factor_pct / 100));
      if (this.telemetry.feeders && this.telemetry.feeders.length === 4) {
        feeders = this.telemetry.feeders.map((f, i) => ({
          p: f.p_mw,
          color: ['#005baa', '#1e40af', '#d97706', '#15803d'][i],
          code: f.code,
          name: f.name.replace('Xuất tuyến ', '')
        }));
      }
    }

    // 1. Draw 110kV Line (National High Voltage Red)
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(gridX, gridY);
    ctx.lineTo(mc172X, gridY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mc172X + 18, gridY);
    ctx.lineTo(trafoX - 22, gridY);
    ctx.stroke();

    // 2. Draw 22kV Line from Trafo to Busbar (EVN Blue)
    ctx.strokeStyle = '#005baa';
    ctx.beginPath();
    ctx.moveTo(trafoX + 22, gridY);
    ctx.lineTo(busX, gridY);
    ctx.stroke();

    // 3. Draw 22kV Vertical Busbar
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#003b7a';
    ctx.beginPath();
    ctx.moveTo(busX, h * 0.12);
    ctx.lineTo(busX, h * 0.88);
    ctx.stroke();

    // 4. Draw Feeder Lines
    ctx.lineWidth = 2;
    feeders.forEach((f, idx) => {
      const y = feederYPositions[idx];
      ctx.strokeStyle = f.color;
      ctx.beginPath();
      ctx.moveTo(busX, y);
      ctx.lineTo(feederEndX, y);
      ctx.stroke();

      // Feeder Breaker symbol (clean IEC square)
      const breakerX = busX + 55;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(breakerX - 7, y - 7, 14, 14);
      ctx.fillRect(breakerX - 7, y - 7, 14, 14);

      // Breaker status dot
      ctx.fillStyle = f.p > 0.05 ? '#15803d' : '#94a3b8';
      ctx.beginPath();
      ctx.arc(breakerX, y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Feeder Labels
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${f.code}`, breakerX + 16, y - 3);

      ctx.fillStyle = f.color;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(`${f.p.toFixed(2)} MW`, breakerX + 16, y + 11);
    });

    // 5. Draw Grid Node 110kV
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d32f2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gridX, gridY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('110kV', gridX, gridY + 3);

    ctx.fillStyle = '#475569';
    ctx.font = '600 9px Inter, sans-serif';
    ctx.fillText('LƯỚI QUỐC GIA', gridX, gridY + 28);

    // 6. Draw MC 172 Breaker
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mc172X, gridY - 8, 16, 16);
    ctx.fillRect(mc172X, gridY - 8, 16, 16);

    ctx.fillStyle = '#15803d'; // Closed/energized
    ctx.beginPath();
    ctx.arc(mc172X + 8, gridY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('MC-172', mc172X + 8, gridY - 14);

    // 7. Draw Transformer MBA 224 (Two Interlocking Circles)
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(trafoX - 7, gridY, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#005baa';
    ctx.beginPath();
    ctx.arc(trafoX + 7, gridY, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#003b7a';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText('MBA T2 (224) 63MVA', trafoX, gridY - 24);

    ctx.fillStyle = '#003b7a';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`${p224.toFixed(1)} MW`, trafoX, gridY + 34);

    // 8. 22kV Busbar Label
    ctx.fillStyle = '#003b7a';
    ctx.font = '700 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THANH CÁI 22kV (C21)', busX, h * 0.08);

    // 9. Particle Electron Flow (Subtle & Crisp)
    this.particles.forEach(p => {
      const speedMult = Math.max(0.5, loadFactor * 1.6);
      p.progress += p.speed * speedMult;
      if (p.progress > 1) p.progress = 0;

      let px = 0, py = 0;
      let pColor = '#005baa';

      if (p.pathIndex === 0) {
        pColor = p.progress < 0.6 ? '#d32f2f' : '#005baa';
        px = gridX + p.progress * (busX - gridX);
        py = gridY;
      } else {
        const fIdx = p.pathIndex - 1;
        pColor = feeders[fIdx].color;
        px = busX + p.progress * (feederEndX - busX);
        py = feederYPositions[fIdx];
      }

      ctx.fillStyle = pColor;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
