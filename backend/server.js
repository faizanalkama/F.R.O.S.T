const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const http = require('http');
const WebSocket = require('ws');
const Y = require('yjs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv/config');

const mongoose = require('mongoose');
const CrdtSnapshot = require('./models/CrdtSnapshot');
const User = require('./models/User');
const Expedition = require('./models/Expedition');
const Roster = require('./models/Roster');
const Geofence = require('./models/Geofence');
const Item = require('./models/Item');
const InventoryMovement = require('./models/InventoryMovement');
const Requisition = require('./models/Requisition');
const Manifest = require('./models/Manifest');
const Telemetry = require('./models/Telemetry');
const AuditLog = require('./models/AuditLog');

mongoose.connect(process.env.MONGO_URI || process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/v1/sync/crdt-binary', express.raw({ type: 'application/octet-stream', limit: '10mb' }));

async function createAuditLog(category, action, severity, metadata = {}) {
  try {
    await AuditLog.create({
      log_id: `LOG-${crypto.randomUUID().substring(0, 8)}`,
      category,
      action,
      severity,
      admin_id: metadata.adminId || null,
      commander_id: metadata.commanderId || null,
      details: metadata.requestDetails || null,
      status: metadata.status || null,
      signature_hash: metadata.signatureHash || null,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}

app.get('/api/v1/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);
    const mapped = logs.map(l => ({
      id: l.log_id,
      timestamp: l.timestamp,
      category: l.category,
      action: l.action,
      severity: l.severity,
      metadata: {
        adminId: l.admin_id,
        commanderId: l.commander_id,
        requestDetails: l.details,
        status: l.status,
        signatureHash: l.signature_hash
      }
    }));
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('Database not connected');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'fail', database: 'disconnected', error: error.message, timestamp: new Date() });
  }
});

app.get('/api/v1/health', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('Database not connected');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(500).json({ status: 'fail', database: 'disconnected', error: error.message, timestamp: new Date() });
  }
});

const PORT = process.env.PORT || 5000;
const ML_URL = process.env.ML_URL || 'http://localhost:8000';
const JWT_SECRET = process.env.JWT_SECRET || 'icenet-secret-key-change-in-production';

// ─────────────────────────────────────────────────────────────────────────────
// §3.2  CRDT Sync Engine
// ─────────────────────────────────────────────────────────────────────────────
const globalDoc = new Y.Doc();
let persistTimer = null;
function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(globalDoc));
      await CrdtSnapshot.findOneAndUpdate({ doc_id: 'global' }, { state, updated_at: new Date() }, { upsert: true, new: true });
    } catch (_) { }
  }, 2000);
}
globalDoc.on('update', schedulePersist);

const server = http.createServer(app);
const wssCrdt = new WebSocket.Server({ noServer: true });
const wssTelemetry = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === '/crdt') {
    wssCrdt.handleUpgrade(request, socket, head, ws => wssCrdt.emit('connection', ws, request));
  } else if (url.pathname === '/telemetry') {
    wssTelemetry.handleUpgrade(request, socket, head, ws => wssTelemetry.emit('connection', ws, request));
  } else {
    wssCrdt.handleUpgrade(request, socket, head, ws => wssCrdt.emit('connection', ws, request));
  }
});

wssCrdt.on('connection', (ws) => {
  const serverSV = Y.encodeStateVector(globalDoc);
  ws.send(JSON.stringify({ type: 'sv', sv: Array.from(serverSV) }));
  const fullUpdate = Y.encodeStateAsUpdate(globalDoc);
  ws.send(JSON.stringify({ type: 'update', update: Array.from(fullUpdate) }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'sv') {
        const clientSV = new Uint8Array(msg.sv);
        const diff = Y.encodeStateAsUpdate(globalDoc, clientSV);
        ws.send(JSON.stringify({ type: 'update', update: Array.from(diff) }));
        return;
      }
      if (msg.type === 'update') {
        const update = new Uint8Array(msg.update);
        Y.applyUpdate(globalDoc, update);
        wssCrdt.clients.forEach(c => {
          if (c !== ws && c.readyState === WebSocket.OPEN) {
            c.send(JSON.stringify({ type: 'update', update: msg.update }));
          }
        });
        return;
      }
    } catch (_) {
      const update = new Uint8Array(raw);
      Y.applyUpdate(globalDoc, update);
      wssCrdt.clients.forEach(c => {
        if (c !== ws && c.readyState === WebSocket.OPEN) c.send(raw);
      });
    }
  });
});

app.post('/api/v1/sync/crdt', (req, res) => {
  try {
    const { update, stateVector } = req.body;
    if (!update) return res.status(400).json({ error: 'Missing update field' });
    const updateBuf = new Uint8Array(update);
    Y.applyUpdate(globalDoc, updateBuf);
    let serverDiff = null;
    if (stateVector) {
      serverDiff = Array.from(Y.encodeStateAsUpdate(globalDoc, new Uint8Array(stateVector)));
    }
    const payload = JSON.stringify({ type: 'update', update: Array.from(updateBuf) });
    wssCrdt.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(payload); });
    res.json({ success: true, message: 'CRDT update merged', serverDiff });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v1/sync/crdt/state', (_req, res) => {
  res.json({ state: Array.from(Y.encodeStateAsUpdate(globalDoc)) });
});

// Load CRDT snapshot from MongoDB on startup
CrdtSnapshot.findOne({ doc_id: 'global' }).then((snap) => {
  if (snap && snap.state) {
    Y.applyUpdate(globalDoc, new Uint8Array(snap.state));
    console.log('[CRDT] Restored canonical doc from MongoDB snapshot');
  }
}).catch(() => { });

// ─────────────────────────────────────────────────────────────────────────────
// JWT Auth
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  // For seed users without hash, accept their usernames as passwords for demo fallback
  const valid = user.password_hash ? await bcrypt.compare(password, user.password_hash) : password === user.username;
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ username: user.username, role: user.role, station: user.station, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { username: user.username, role: user.role, station: user.station, name: user.name } });
});

app.get('/api/v1/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
    res.json(decoded);
  } catch (_) { res.status(401).json({ error: 'Invalid token' }); }
});

function authMiddleware(roles) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'Auth required' });
    try {
      const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
      if (roles && !roles.includes(decoded.role)) return res.status(403).json({ error: 'Insufficient role' });
      req.user = decoded;
      next();
    } catch (_) { res.status(401).json({ error: 'Invalid token' }); }
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Research Centers Detail Data
// ─────────────────────────────────────────────────────────────────────────────
const researchCentersMemory = {
  maitri: { id: 'maitri', name: 'Maitri Station', coords: '70°46′S, 11°44′E', region: 'Schirmacher Oasis, Antarctica', crew: 25, temp: -34, power: 96, status: 'Operational', alert: 'Stable ice shelf conditions', leader: 'Dr. Aisha Malik', summary: 'Primary glaciology and atmospheric chemistry operations continue with full payload capacity and no transport restrictions.', weather: { condition: 'Clear / light katabatic flow', wind: 24, humidity: 58, visibility: '7.2 km', pressure: 1014, risk: 'Low' }, rosters: [{ name: 'Leena Reddy', role: 'Station Lead', shift: 'Day', status: 'On station' }, { name: 'Omar Haddad', role: 'Glaciology Lead', shift: 'Day', status: 'In field' }, { name: 'Priya Nair', role: 'Meteorology Analyst', shift: 'Night', status: 'Monitoring' }, { name: 'Milan Sethi', role: 'Power Systems', shift: 'Day', status: 'On station' }, { name: 'Tariq Chen', role: 'Logistics Officer', shift: 'Night', status: 'On call' }], logistics: { batteryReserve: '82%', sensorHealth: 'Optimal', nextMaintenance: 'Tomorrow, 09:30 UTC', runwayStatus: 'Open' } },
  bharati: { id: 'bharati', name: 'Bharati Station', coords: '69°24′S, 76°12′E', region: 'Larsemann Hills, Antarctica', crew: 18, temp: -41, power: 92, status: 'Operational', alert: 'Cold front moving east', leader: 'Capt. Ishan Verma', summary: 'Field teams are active with a moderate snow squall watch, but all research and power systems remain stable.', weather: { condition: 'Snow squall watch', wind: 31, humidity: 73, visibility: '3.4 km', pressure: 1002, risk: 'Moderate' }, rosters: [{ name: 'Nadia Foster', role: 'Station Operations', shift: 'Day', status: 'On station' }, { name: 'Arjun Patel', role: 'Ice Core Team', shift: 'Day', status: 'In field' }, { name: 'Elena Rossi', role: 'Climate Systems', shift: 'Night', status: 'Monitoring' }, { name: 'Siddharth Rao', role: 'Facility Tech', shift: 'Day', status: 'On station' }], logistics: { batteryReserve: '76%', sensorHealth: 'Nominal', nextMaintenance: 'Today, 18:00 UTC', runwayStatus: 'Limited access' } },
  himadri: { id: 'himadri', name: 'Himadri Station', coords: '78°55′N, 11°56′E', region: 'Ny-Ålesund, Svalbard', crew: 12, temp: -8, power: 99, status: 'Operational', alert: 'Low wind, clear Arctic conditions', leader: 'Dr. Helena Berg', summary: 'Arctic atmospheric research is in a favorable window, with excellent visibility and normal ventilation operations.', weather: { condition: 'Clear with low cloud cover', wind: 12, humidity: 62, visibility: '10.1 km', pressure: 1018, risk: 'Low' }, rosters: [{ name: 'Jonas Eriksen', role: 'Scientific Lead', shift: 'Day', status: 'On station' }, { name: 'Marta Novak', role: 'Ocean Sensors', shift: 'Day', status: 'Monitoring' }, { name: 'Keisuke Sato', role: 'Energy Systems', shift: 'Night', status: 'On call' }, { name: 'Alicia Moore', role: 'Field Technician', shift: 'Day', status: 'In field' }], logistics: { batteryReserve: '89%', sensorHealth: 'Optimal', nextMaintenance: 'Thursday, 11:00 UTC', runwayStatus: 'Open' } }
};

app.get('/api/v1/research-centers', async (_req, res) => {
  try {
    const centers = Object.values(researchCentersMemory);
    const enhancedCenters = await Promise.all(centers.map(async (center) => {
      const stationName = center.name.split(' ')[0]; // 'Maitri', 'Bharati', 'Himadri'
      const crewCount = await User.countDocuments({ station: new RegExp(`^${stationName}$`, 'i') });
      return { ...center, crew: crewCount };
    }));
    res.json(enhancedCenters);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch research centers' });
  }
});

// GET /api/stations/:stationName/roster
app.get('/api/stations/:stationName/roster', async (req, res) => {
  try {
    const { stationName } = req.params;
    // Find all users deployed to this station (case-insensitive)
    const roster = await User.find({
      station: new RegExp(`^${stationName}$`, 'i')
    }).select('name username role shift status department');

    // Default missing names to username, and set defaults for mock roles
    const mappedRoster = roster.map(r => ({
      name: r.name || r.username,
      role: r.role || 'Unassigned',
      shift: r.shift || 'Dynamic',
      status: r.status || 'Active'
    }));

    res.json({ success: true, roster: mappedRoster });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch station roster', error: error.message });
  }
});
app.get('/api/v1/research-centers/:id', async (req, res) => {
  try {
    const center = researchCentersMemory[req.params.id];
    if (!center) return res.status(404).json({ error: 'Research center not found' });

    const stationName = center.name.split(' ')[0];
    const stationRegex = new RegExp(`^${stationName}$`, 'i');

    // Fetch users for roster
    const users = await User.find({ station: stationRegex });

    // Determine leader
    const leaderUser = users.find(u =>
      u.role.toLowerCase() === 'commander' ||
      u.role.toLowerCase() === 'station lead' ||
      u.role.toLowerCase() === 'admin'
    );
    const leaderName = leaderUser ? leaderUser.name || leaderUser.username : 'Unassigned (Vacant)';

    // Map rosters
    const rosters = users.map(u => ({
      name: u.name || u.username,
      role: u.role,
      shift: 'Dynamic',
      status: 'Active'
    }));

    // Fetch logistics (items)
    const items = await Item.find({ station: stationRegex });
    const totalItems = items.length;
    const criticalItems = items.filter(i => i.quantity <= i.critical_threshold).length;

    // Calculate mock battery reserve based on active items if no real telemetry
    const logistics = {
      batteryReserve: `${Math.max(50, 100 - criticalItems * 5)}%`,
      sensorHealth: criticalItems === 0 ? 'Optimal' : (criticalItems < 3 ? 'Warning' : 'Critical'),
      nextMaintenance: 'Dynamic based on stock',
      runwayStatus: totalItems > 0 ? 'Open' : 'Restricted'
    };

    res.json({
      ...center,
      leader: `Lead: ${leaderName}`,
      rosters: rosters,
      logistics: logistics,
      crew: users.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch research center details' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Expeditions CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/expeditions', async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const query = statusFilter ? { status: statusFilter } : {};
    const records = await Expedition.find(query);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.post('/api/v1/expeditions', async (req, res) => {
  try {
    const e = await Expedition.create(req.body);
    res.json({ success: true, expedition: e });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.patch('/api/v1/expeditions/:id', async (req, res) => {
  try {
    const e = await Expedition.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!e) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, expedition: e });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.patch('/api/v1/expeditions/:id/coordinates', async (req, res) => {
  try {
    const e = await Expedition.findByIdAndUpdate(req.params.id, { currentCoordinates: req.body.currentCoordinates }, { new: true });
    res.json({ success: true, expedition: e });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const Budget = require('./models/Budget');
app.get('/api/v1/budget/:fiscalYear', async (req, res) => {
  try {
    const b = await Budget.findOne({ fiscalYear: req.params.fiscalYear });
    res.json(b || { allocations: [], totalAllocated: 0, fiscalYear: req.params.fiscalYear });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.put('/api/v1/budget/:fiscalYear', async (req, res) => {
  try {
    const b = await Budget.findOneAndUpdate(
      { fiscalYear: req.params.fiscalYear },
      req.body,
      { new: true, upsert: true }
    );
    res.json({ success: true, budget: b });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Roster CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/roster', async (req, res) => {
  const records = await Roster.find();
  res.json(records);
});
app.get('/api/v1/roster/:id', async (req, res) => {
  const r = await Roster.findOne({ personnel_id: req.params.id });
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});
app.post('/api/v1/roster', async (req, res) => {
  const data = { ...req.body, personnel_id: req.body.personnel_id || `PER-${Date.now()}` };
  const personnel = await Roster.create(data);
  res.json({ success: true, personnel });
});
app.patch('/api/v1/roster/:id', async (req, res) => {
  const personnel = await Roster.findOneAndUpdate({ personnel_id: req.params.id }, req.body, { new: true });
  res.json({ success: true, personnel });
});
app.delete('/api/v1/roster/:id', async (req, res) => {
  await Roster.findOneAndDelete({ personnel_id: req.params.id });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Geofence CRUD
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/geofences', async (req, res) => {
  res.json(await Geofence.find());
});
app.post('/api/v1/geofences', async (req, res) => {
  const data = { ...req.body, geofence_id: req.body.geofence_id || `GF-${Date.now()}` };
  const geofence = await Geofence.create(data);
  res.json({ success: true, geofence });
});
app.delete('/api/v1/geofences/:id', async (req, res) => {
  await Geofence.findOneAndDelete({ geofence_id: req.params.id });
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Marine AIS Proxy (mock for demo)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/ais/vessel/:mmsi', (req, res) => {
  const mmsi = req.params.mmsi;
  const baseData = {
    mmsi,
    vessel_name: 'MV Vasily Golovnin',
    flag: 'Russia',
    type: 'Ice-Class Cargo',
    lat: -55.0 - Math.random() * 10,
    lng: 20.0 + Math.random() * 30,
    speed_knots: 12 + Math.random() * 5,
    heading: 180 + Math.random() * 30,
    destination: 'Maitri Station, Antarctica',
    eta: new Date(Date.now() + 14 * 86400000).toISOString(),
    last_update: new Date().toISOString(),
  };
  res.json(baseData);
});

// ─────────────────────────────────────────────────────────────────────────────
// LoRa Gateway Simulator Endpoint
// ─────────────────────────────────────────────────────────────────────────────
let loraSimInterval = null;
app.post('/api/v1/simulator/lora/start', async (req, res) => {
  if (loraSimInterval) return res.json({ message: 'Already running' });
  const personnel = await Roster.find();
  let tick = 0;

  loraSimInterval = setInterval(() => {
    tick++;
    personnel.forEach(p => {
      const jitter = () => (Math.random() - 0.5) * 0.005;
      const payload = {
        node_id: p.personnel_id,
        personnel_id: p.personnel_id,
        lat: -70.768 + jitter() + tick * 0.0001,
        lng: 11.734 + jitter(),
        battery_pct: Math.max(10, 100 - tick * 2 + Math.floor(Math.random() * 5)),
        status: 'ACTIVE',
        barometric_pressure: 980 + Math.random() * 20,
        timestamp: new Date().toISOString(),
      };
      const dataStr = JSON.stringify({ type: 'telemetry', data: payload });
      wssTelemetry.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
      wssCrdt.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
    });
  }, 15000);

  res.json({ success: true, message: `LoRa simulator started for ${personnel.length} nodes at 15s intervals` });
});

app.post('/api/v1/simulator/lora/stop', (req, res) => {
  clearInterval(loraSimInterval);
  loraSimInterval = null;
  res.json({ success: true, message: 'LoRa simulator stopped' });
});

app.post('/api/v1/simulator/lora/sos', async (req, res) => {
  const { personnel_id } = req.body;
  let person = await Roster.findOne({ personnel_id });
  if (!person) person = (await Roster.find())[0] || { personnel_id: 'EXP-BIO-04', blood_type: 'Unknown', allergies: 'Unknown', name: 'Unknown', role: 'Unknown' };

  const payload = {
    node_id: person.personnel_id,
    personnel_id: person.personnel_id,
    lat: -70.768 + (Math.random() - 0.5) * 0.01,
    lng: 11.734 + (Math.random() - 0.5) * 0.01,
    battery_pct: Math.floor(Math.random() * 15) + 3,
    status: 'SOS',
    barometric_pressure: 960 + Math.random() * 10,
    timestamp: new Date().toISOString(),
    blood_type: person.blood_type,
    allergies: person.allergies,
    name: person.name,
    role: person.role,
  };
  const dataStr = JSON.stringify({ type: 'telemetry', data: payload });
  wssTelemetry.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
  wssCrdt.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
  res.json({ success: true, payload });
});

// ─────────────────────────────────────────────────────────────────────────────
// Live weather proxy for Antarctic and Arctic stations
// ─────────────────────────────────────────────────────────────────────────────
const weatherStations = {
  maitri: { name: 'Maitri', latitude: -70.77, longitude: 11.74 },
  bharati: { name: 'Bharati', latitude: -69.41, longitude: 76.19 },
  himadri: { name: 'Himadri', latitude: 78.92, longitude: 11.93 },
};
const weatherCache = new Map();

app.get('/api/v1/aws/current', async (req, res) => {
  const stationId = String(req.query.station || 'maitri').toLowerCase();
  const station = weatherStations[stationId];
  if (!station) return res.status(400).json({ error: 'Unknown weather station' });

  try {
    const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: station.latitude,
        longitude: station.longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure',
        hourly: 'surface_pressure,wind_speed_10m,visibility',
        wind_speed_unit: 'ms',
        past_days: 1,
        forecast_days: 7,
        timezone: 'UTC',
      },
      timeout: 12000,
    });

    const { current, hourly } = response.data;
    if (!current || !hourly?.time?.length) throw new Error('Weather provider returned incomplete station data');

    const toUtcMillis = value => new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`).getTime();
    const observedAt = toUtcMillis(current.time);
    let currentHourIndex = -1;
    let priorHourIndex = -1;
    hourly.time.forEach((time, index) => {
      const sampleTime = toUtcMillis(time);
      if (sampleTime <= observedAt) currentHourIndex = index;
      if (sampleTime <= observedAt - 3 * 60 * 60 * 1000) priorHourIndex = index;
    });

    if (currentHourIndex < 0 || priorHourIndex < 0) throw new Error('Weather provider lacks the pressure history needed for the model');

    const dailyWind = new Map();
    hourly.time.forEach((time, index) => {
      const day = time.slice(0, 10);
      const sampleTime = toUtcMillis(time);
      if (sampleTime < observedAt || sampleTime >= observedAt + 7 * 86400000) return;
      const wind = Number(hourly.wind_speed_10m?.[index]);
      if (!Number.isFinite(wind)) return;
      const samples = dailyWind.get(day) || [];
      samples.push(wind * 3.6);
      dailyWind.set(day, samples);
    });

    const pressureNow = Number(current.surface_pressure);
    const pressureThreeHoursAgo = Number(hourly.surface_pressure[priorHourIndex]);
    const windSpeed = Number(current.wind_speed_10m);
    const data = {
      timestamp: new Date(observedAt).toISOString(),
      station: `${station.name}-AWS`,
      station_id: stationId,
      source: 'Open-Meteo',
      stale: false,
      temperature: Number(current.temperature_2m),
      U10: windSpeed,
      wind_kmh: windSpeed * 3.6,
      humidity: Number(current.relative_humidity_2m),
      pressure_hpa: pressureNow,
      pressure_drop: pressureNow - pressureThreeHoursAgo,
      visibility_km: Number(hourly.visibility?.[currentHourIndex]) / 1000,
      wind_forecast: [...dailyWind.entries()].slice(0, 7).map(([day, samples]) => ({
        day: new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        wind: samples.reduce((sum, value) => sum + value, 0) / samples.length,
      })),
    };

    weatherCache.set(stationId, { data, fetched_at: Date.now() });
    res.json(data);
  } catch (error) {
    const cached = weatherCache.get(stationId);
    if (cached && Date.now() - cached.fetched_at < 60 * 60 * 1000) {
      return res.json({ ...cached.data, stale: true, stale_age_minutes: Math.floor((Date.now() - cached.fetched_at) / 60000) });
    }
    res.status(502).json({ error: 'Live weather unavailable', source: 'Open-Meteo', detail: error.message });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// §3.1  Immutable Cargo Ledger
// ─────────────────────────────────────────────────────────────────────────────
function canonicalJsonStringify(value) {
  if (value === null || value === undefined) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(v => canonicalJsonStringify(v)).join(',') + ']';
  if (typeof value === 'object' && !(value instanceof Date)) {
    const keys = Object.keys(value).sort();
    return '{' + keys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(value[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

const VALID_STATUSES = ['Draft', 'Procured', 'Packed (Goa)', 'In Transit (Ocean)', 'Awaiting Heli-lift', 'Delivered (Base)'];

app.post('/api/v1/cargo/manifest', async (req, res) => {
  const { manifest_id, items, destination, vessel, vessel_mmsi } = req.body;
  if (!manifest_id || !Array.isArray(items) || items.length === 0 || !destination || !vessel) {
    return res.status(400).json({ error: 'manifest_id, destination, vessel, and cargo items are required' });
  }

  const existing = await Manifest.findOne({ manifest_id });
  if (existing) return res.status(409).json({ error: 'Manifest already exists' });

  const data = { manifest_id, destination, vessel, status: 'Draft', items, vessel_mmsi: vessel_mmsi || null, crypto_hash: null, sealed_at: null, sealed_payload_json: null, tamper_detected: false, tamper_alerts: [] };

  try {
    const saved = await Manifest.create(data);
    return res.status(201).json({ success: true, manifest: saved });
  } catch (error) {
    return res.status(503).json({ error: 'Unable to persist manifest', detail: error.message });
  }
});

app.post('/api/v1/cargo/manifest/:id/seal', async (req, res) => {
  const manifest = await Manifest.findOne({ manifest_id: req.params.id });
  if (!manifest) return res.status(404).json({ error: 'Manifest not found' });
  if (manifest.crypto_hash) return res.status(409).json({ error: 'Already sealed' });

  const payloadObj = { manifest_id: manifest.manifest_id, destination: manifest.destination, vessel: manifest.vessel, items: manifest.items, vessel_mmsi: manifest.vessel_mmsi };
  const canonicalJson = canonicalJsonStringify(payloadObj);
  const hash = crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');

  const updated = await Manifest.findOneAndUpdate({ manifest_id: manifest.manifest_id }, { crypto_hash: hash, sealed_at: new Date(), sealed_payload_json: canonicalJson, status: 'Packed (Goa)', updated_at: new Date() }, { new: true });
  await createAuditLog('Transport', `Manifest ${manifest.manifest_id} sealed and cryptographically signed`, 'info', {
    adminId: 'GOA-HQ-01',
    requestDetails: `Destination: ${manifest.destination}, Vessel: ${manifest.vessel}`,
    status: 'Packed (Goa)',
    signatureHash: hash
  });
  res.json({ success: true, crypto_hash: hash, sealed_payload: canonicalJson, manifest: updated });
});

app.patch('/api/v1/cargo/manifest/:id/status', async (req, res) => {
  const { status: newStatus } = req.body;
  if (!VALID_STATUSES.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });
  const manifest = await Manifest.findOne({ manifest_id: req.params.id });
  if (!manifest) return res.status(404).json({ error: 'Not found' });
  const curIdx = VALID_STATUSES.indexOf(manifest.status);
  const tgtIdx = VALID_STATUSES.indexOf(newStatus);
  if (tgtIdx <= curIdx) return res.status(400).json({ error: `Cannot move backward` });
  if (tgtIdx >= 2 && !manifest.crypto_hash) return res.status(400).json({ error: 'Must seal first' });

  const updated = await Manifest.findOneAndUpdate({ manifest_id: manifest.manifest_id }, { status: newStatus, updated_at: new Date() }, { new: true });
  res.json({ success: true, manifest: updated });
});

app.post('/api/v1/cargo/verify', async (req, res) => {
  const { manifest_id, items, destination, vessel, vessel_mmsi } = req.body;
  if (!manifest_id || !items) return res.status(400).json({ error: 'manifest_id and items required' });
  const manifest = await Manifest.findOne({ manifest_id });
  if (!manifest) return res.status(404).json({ error: 'Not found' });
  if (!manifest.crypto_hash) return res.status(400).json({ error: 'Never sealed' });

  const incomingPayload = {
    manifest_id,
    destination: destination || manifest.destination,
    vessel: vessel || manifest.vessel,
    items,
    vessel_mmsi: vessel_mmsi || manifest.vessel_mmsi,
  };
  const incomingCanonical = canonicalJsonStringify(incomingPayload);
  const incomingHash = crypto.createHash('sha256').update(incomingCanonical, 'utf8').digest('hex');

  if (incomingHash !== manifest.crypto_hash) {
    const alert = { detected_at: new Date(), incoming_hash: incomingHash, stored_hash: manifest.crypto_hash, details: `Sealed: ${manifest.sealed_payload_json} | Incoming: ${incomingCanonical}` };
    const tamperAlerts = Array.isArray(manifest.tamper_alerts) ? manifest.tamper_alerts : [];

    await Manifest.findOneAndUpdate({ manifest_id: manifest.manifest_id }, { tamper_alerts: [...tamperAlerts, alert], tamper_detected: true, updated_at: new Date() }, { new: true });
    return res.status(400).json({ error: 'TAMPER ALERT', hash_mismatch: true, stored_hash: manifest.crypto_hash, incoming_hash: incomingHash, sealed_payload: manifest.sealed_payload_json, incoming_payload: incomingCanonical, alert });
  }
  if (manifest.status !== 'Delivered (Base)') {
    await Manifest.findOneAndUpdate({ manifest_id: manifest.manifest_id }, { status: 'Delivered (Base)', updated_at: new Date() }, { new: true });
  }
  res.json({ success: true, message: 'Integrity verified', stored_hash: manifest.crypto_hash, incoming_hash: incomingHash });
});

app.post('/api/v1/cargo/verify-hash', async (req, res) => {
  const manifestId = String(req.body.manifest_id || '').trim();
  const scannedHash = String(req.body.scanned_hash || '').trim().toLowerCase();
  if (!manifestId || !/^[a-f0-9]{64}$/.test(scannedHash)) {
    return res.status(400).json({ error: 'manifest_id and a 64-character SHA-256 hash are required' });
  }
  const manifest = await Manifest.findOne({ manifest_id: manifestId });
  if (!manifest) return res.status(404).json({ error: 'Manifest not found' });
  if (!manifest.crypto_hash) return res.status(409).json({ error: 'Manifest has not been sealed' });

  const matches = scannedHash === String(manifest.crypto_hash).toLowerCase();
  if (!matches) {
    const tamperAlerts = Array.isArray(manifest.tamper_alerts) ? manifest.tamper_alerts : [];
    await Manifest.findOneAndUpdate({ manifest_id: manifest.manifest_id }, { tamper_detected: true, tamper_alerts: [...tamperAlerts, { detected_at: new Date(), scanned_hash: scannedHash, stored_hash: manifest.crypto_hash, method: 'manual_hash_comparison' }], updated_at: new Date() }, { new: true });
  }

  res.json({
    manifest_id: manifest.manifest_id,
    matches,
    result: matches ? 'MATCH' : 'MISMATCH',
    expected_hash: manifest.crypto_hash,
    scanned_hash: scannedHash,
    checked_at: new Date().toISOString(),
    method: 'manual_hash_comparison',
    note: 'A hash match verifies the pasted value against the sealed reference; it does not inspect physical cargo contents.',
  });
});

app.get('/api/v1/cargo/manifests/latest', async (req, res) => {
  const latest = await Manifest.findOne({ crypto_hash: { $ne: null } }).sort({ sealed_at: -1 });
  if (!latest) return res.status(404).json({ error: 'No sealed manifest found' });
  res.json(latest);
});

app.get('/api/v1/cargo/manifest/:id', async (req, res) => {
  const m = await Manifest.findOne({ manifest_id: req.params.id });
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
});
app.get('/api/v1/cargo/manifests', async (req, res) => {
  res.json(await Manifest.find());
});

// ─────────────────────────────────────────────────────────────────────────────
// Telemetry + ML + Inventory
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/v1/telemetry/ingest', async (req, res) => {
  const dataStr = JSON.stringify({ type: 'telemetry', data: req.body });
  wssTelemetry.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
  wssCrdt.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(dataStr); });
  try { await Telemetry.create(req.body); } catch (_) { }
  res.json({ success: true });
});

const { getPredictiveInsights } = require('./controllers/mlController');
app.get('/api/v1/ml/insights', getPredictiveInsights);

app.get('/api/v1/ml/predict-window', async (req, res) => {
  try {
    const r = await axios.get(`${ML_URL}/predict-window`, { params: req.query });
    res.json(r.data);
  } catch (e) {
    console.error('ML Predict Window Error:', e.message);
    res.status(200).json({ safe: false, probability: 0, status: 'offline', message: 'ML Service unreachable', safe_to_fly: false });
  }
});

app.get('/api/v1/inventory', async (req, res) => {
  try {
    const items = await Item.find();
    return res.json(items.map(i => ({ ...i, qty: i.quantity })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/v1/inventory', async (req, res) => {
  try { const i = await Item.create(req.body); return res.json(i); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/v1/requisitions', async (req, res) => {
  const station = req.query.station ? String(req.query.station).toLowerCase() : undefined;
  const records = await Requisition.find(station ? { station: new RegExp("^" + station + "$", "i") } : {}).sort({ created_at: -1 });
  res.json(records);
});

app.post('/api/v1/requisitions', async (req, res) => {
  const station = String(req.body.station || '').trim().toLowerCase();
  const item = String(req.body.item || '').trim();
  const quantity = Number(req.body.quantity);
  const urgency = req.body.urgency || 'ROUTINE';
  if (!station || !item || !Number.isFinite(quantity) || quantity <= 0 || !['ROUTINE', 'CRITICAL'].includes(urgency)) {
    return res.status(400).json({ error: 'station, item, positive quantity, and valid urgency are required' });
  }

  const now = new Date();
  const record = {
    requisition_id: `REQ-${crypto.randomUUID()}`,
    station,
    item,
    quantity,
    unit: String(req.body.unit || 'Units'),
    urgency,
    status: 'PENDING_APPROVAL',
    decided_by: null,
    created_at: now,
    updated_at: now,
  };

  try {
    const saved = await Requisition.create(record);
    await createAuditLog('Inventory Request', `Commander (${station}) requested ${quantity} ${record.unit} of ${item}`, urgency === 'CRITICAL' ? 'critical' : 'info', {
      commanderId: `CMD-${station.toUpperCase()}`,
      requestDetails: `Urgency: ${urgency}`,
      status: 'Pending Review'
    });
    res.status(201).json({ success: true, requisition: saved });
  } catch (error) {
    return res.status(503).json({ error: 'Unable to persist requisition', detail: error.message });
  }
});

app.patch('/api/v1/requisitions/:id', async (req, res) => {
  const decision = String(req.body.decision || '').toUpperCase();
  if (!['APPROVED', 'DENIED'].includes(decision)) return res.status(400).json({ error: 'decision must be APPROVED or DENIED' });

  const record = await Requisition.findOne({ requisition_id: req.params.id });
  if (!record) return res.status(404).json({ error: 'Requisition not found' });
  if (record.status !== 'PENDING_APPROVAL') return res.status(409).json({ error: 'Requisition is already decided' });

  try {
    const updated = await Requisition.findOneAndUpdate({ requisition_id: req.params.id }, { status: decision, decided_by: String(req.body.decided_by || 'admin'), updated_at: new Date() }, { new: true });
    await createAuditLog('Inventory Request', `Admin ${decision.toLowerCase()} request for ${record.quantity} ${record.unit} of ${record.item}`, decision === 'DENIED' ? 'warning' : 'info', {
      adminId: String(req.body.decided_by || 'GOA-HQ-01'),
      commanderId: `CMD-${record.station.toUpperCase()}`,
      status: decision
    });
    res.json({ success: true, requisition: updated });
  } catch (error) {
    return res.status(503).json({ error: 'Unable to persist requisition decision', detail: error.message });
  }
});

app.post('/api/v1/inventory/movements', async (req, res) => {
  const {
    station, item_id, name, category, unit, quantity_delta, stock_after,
    critical_threshold, lead_time_days, unit_cost, client_event_id, recorded_at, movement_type,
  } = req.body;
  const delta = Number(quantity_delta);
  const stock = Number(stock_after);
  if (!station || !item_id || !name || !client_event_id || !Number.isFinite(delta) || !Number.isFinite(stock) || stock < 0) {
    return res.status(400).json({ error: 'station, item_id, name, client_event_id, quantity_delta, and a non-negative stock_after are required' });
  }

  const optionalNumber = value => value === undefined || value === null || value === '' ? undefined : Number(value);
  const threshold = optionalNumber(critical_threshold);
  const leadTime = optionalNumber(lead_time_days);
  const unitCost = optionalNumber(unit_cost);
  if ([threshold, leadTime, unitCost].some(value => value !== undefined && (!Number.isFinite(value) || value < 0))) {
    return res.status(400).json({ error: 'threshold, lead_time_days, and unit_cost must be non-negative numbers' });
  }
  const recordedAt = recorded_at ? new Date(recorded_at) : new Date();
  if (Number.isNaN(recordedAt.getTime())) return res.status(400).json({ error: 'recorded_at must be a valid timestamp' });
  const movementType = movement_type || (delta === 0 ? 'snapshot' : delta < 0 ? 'consumption' : 'restock');
  const validMovementTypes = ['snapshot', 'consumption', 'restock', 'adjustment', 'disposal'];
  if (!validMovementTypes.includes(movementType)) return res.status(400).json({ error: 'Invalid movement_type' });

  const movement = {
    client_event_id: String(client_event_id),
    station: String(station).trim(),
    item_id: String(item_id),
    name: String(name).trim(),
    category,
    unit,
    quantity_delta: delta,
    stock_after: stock,
    critical_threshold: threshold,
    lead_time_days: leadTime,
    unit_cost: unitCost,
    movement_type: movementType,
    event_type: delta === 0 ? 'snapshot' : 'adjustment',
    recorded_at: recordedAt,
  };

  try {
    const existing = await InventoryMovement.findOne({ client_event_id: String(client_event_id) });
    if (existing) return res.status(200).json({ success: true, movement: existing, duplicate: true });

    const saved = await InventoryMovement.create(movement);

    if (delta !== 0) {
      await createAuditLog('Logistics', `Inventory adjusted via Edge Node: ${name} [${delta > 0 ? '+' : ''}${delta} ${unit}]`, delta < 0 ? 'warning' : 'info', {
        commanderId: `CMD-${station.toUpperCase()}`,
        status: 'Synchronized',
        requestDetails: `New Stock Level: ${stock} ${unit}`
      });
    }

    return res.status(201).json({ success: true, movement: saved, duplicate: false });
  } catch (error) {
    return res.status(503).json({ error: 'Unable to persist inventory movement', detail: error.message });
  }
});

app.get('/api/v1/inventory/forecast', async (req, res) => {
  const station = req.query.station ? String(req.query.station) : null;
  const databaseMovements = await InventoryMovement.find(station ? { station } : {}).sort({ recorded_at: 1 });

  const now = Date.now();
  const lookbackStart = now - 90 * 24 * 60 * 60 * 1000;
  const grouped = new Map();
  for (const movement of databaseMovements) {
    const key = `${movement.station}\0${movement.item_id}`;
    let group = grouped.get(key);
    if (!group) {
      group = { station: movement.station, item_id: movement.item_id, latest: movement, consumption: [] };
      grouped.set(key, group);
    }
    group.latest = movement;
    const recordedAt = new Date(movement.recorded_at).getTime();
    if (movement.movement_type === 'consumption' && movement.quantity_delta < 0 && recordedAt >= lookbackStart) {
      group.consumption.push(movement);
    }
  }

  const items = [...grouped.values()].map(group => {
    const latest = group.latest;
    const firstUsage = group.consumption[0];
    const lastUsage = group.consumption[group.consumption.length - 1];
    const historyDays = firstUsage && lastUsage
      ? Math.max(0, (new Date(lastUsage.recorded_at).getTime() - new Date(firstUsage.recorded_at).getTime()) / 86400000)
      : 0;
    const enoughHistory = group.consumption.length >= 2 && historyDays >= 7;
    const consumed = group.consumption.reduce((total, movement) => total - movement.quantity_delta, 0);
    const dailyRate = enoughHistory ? consumed / Math.max(historyDays, 1) : null;
    const stock = Number(latest.stock_after);
    const threshold = latest.critical_threshold ?? null;
    const daysToThreshold = dailyRate !== null && threshold !== null
      ? Math.max(0, (stock - threshold) / dailyRate)
      : null;
    const daysToStockout = dailyRate !== null && dailyRate > 0 ? stock / dailyRate : null;

    let status = 'collecting_history';
    if (threshold === null) status = 'threshold_not_configured';
    else if (stock <= threshold) status = 'reorder_now';
    else if (enoughHistory) status = 'trend_available';

    return {
      station: group.station,
      item_id: group.item_id,
      name: latest.name,
      category: latest.category,
      unit: latest.unit,
      current_stock: stock,
      critical_threshold: threshold,
      usage_event_count: group.consumption.length,
      history_days: Math.floor(historyDays),
      average_daily_consumption: dailyRate,
      days_until_threshold: daysToThreshold,
      days_until_stockout: daysToStockout,
      lead_time_days: latest.lead_time_days ?? null,
      unit_cost: latest.unit_cost ?? null,
      status,
    };
  }).sort((a, b) => {
    const rank = { reorder_now: 0, threshold_not_configured: 1, collecting_history: 2, trend_available: 3 };
    return rank[a.status] - rank[b.status] || (a.days_until_threshold ?? Infinity) - (b.days_until_threshold ?? Infinity);
  });

  res.json({ method: 'stock-threshold-and-consumption-baseline', trained_model: false, items });
});

// ─────────────────────────────────────────────────────────────────────────────
// Personnel (Expedition Teams)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/v1/personnel/expedition', async (req, res) => {
  try {
    console.log("-> Fetching expedition personnel...");
    const User = require('./models/User');
    // Use regex to catch variations of "Summer" and "Winter"
    const personnel = await User.find({
      expeditionTeam: { $regex: /summer|winter/i }
    });
    console.log(`-> Found ${personnel.length} personnel in DB`);
    res.status(200).json({ success: true, data: personnel });
  } catch (error) {
    console.error("DB Fetch Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/v1/personnel', async (req, res) => {
  try {
    const User = require('./models/User');
    const username = req.body.name.toLowerCase().replace(/\s+/g, '.') + Math.floor(Math.random() * 100000);
    const newUser = new User({ ...req.body, username });
    const savedUser = await newUser.save();
    res.status(201).json({ success: true, data: savedUser });
  } catch (error) {
    console.error("DB Save Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('=========================================');
  console.log('🚀 SYSTEM DIAGNOSTIC RUN 🚀');
  console.log(`Port Listening: OK (Port ${PORT})`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL: ${process.env.MONGO_URI || process.env.DATABASE_URL ? 'Configured' : 'Missing'}`);
  console.log(`Database Connection: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Pending/Failed'}`);
  console.log('=========================================');
});
