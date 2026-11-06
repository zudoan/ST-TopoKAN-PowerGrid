/**
 * ST-TopoKAN API Client Layer
 */
const API = {
  baseUrl: '',

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err);
      throw err;
    }
  },

  async getMetadata() {
    return this.get('/api/telemetry/metadata');
  },

  async getLiveTelemetry(index = 0) {
    return this.get(`/api/telemetry/live?index=${index}`);
  },

  async getTelemetrySeries(start = 0, count = 48) {
    return this.get(`/api/telemetry/series?start=${start}&count=${count}`);
  },

  async getForecastWindow(index = 100, horizon = 48) {
    return this.get(`/api/forecast/window?index=${index}&horizon=${horizon}`);
  },

  async getBenchmarks() {
    return this.get('/api/forecast/benchmarks');
  },

  async getSingleLineDiagram() {
    return this.get('/api/topology/single-line-diagram');
  },

  async getLearnedGraph() {
    return this.get('/api/topology/learned-graph');
  },

  async getSplineBasis(gridSize = 5, splineOrder = 3) {
    return this.get(`/api/kan/spline-basis?grid_size=${gridSize}&spline_order=${splineOrder}`);
  },

  async getKanComparison() {
    return this.get('/api/kan/comparison');
  },

  async getDuckCurve() {
    return this.get('/api/duck-curve/profile');
  },

  async getPhysicsAudit() {
    return this.get('/api/physics-audit/stages');
  }
};

