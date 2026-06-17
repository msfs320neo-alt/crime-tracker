// ── Auth guard ─────────────────────────────────────────────────────────────────
const token = localStorage.getItem('nw_token');
const me    = JSON.parse(localStorage.getItem('nw_user') || 'null');
if (!token || !me) { window.location.href = '/login.html'; throw new Error('unauth'); }

// ── Built-in types ─────────────────────────────────────────────────────────────

const BUILTIN_CRIME = [
  // violent
  { name:'Shooting / Gunshots',       color:'#dc2626', icon:'🔴', category:'crime' },
  { name:'Assault',                   color:'#c94040', icon:'⚡', category:'crime' },
  { name:'Robbery',                   color:'#e03030', icon:'🔫', category:'crime' },
  { name:'Carjacking',                color:'#b91c1c', icon:'🚨', category:'crime' },
  { name:'Domestic Disturbance',      color:'#7c3aed', icon:'🏚️', category:'crime' },
  { name:'Stalking',                  color:'#6366f1', icon:'🕵️', category:'crime' },
  { name:'Harassment',                color:'#0284c7', icon:'😠', category:'crime' },
  // property
  { name:'Burglary',                  color:'#e05252', icon:'🏠', category:'crime' },
  { name:'Theft',                     color:'#f0a030', icon:'🏃', category:'crime' },
  { name:'Shoplifting',               color:'#ca8a04', icon:'🛍️', category:'crime' },
  { name:'Vehicle Break-in',          color:'#f07830', icon:'🚗', category:'crime' },
  { name:'Bike Theft',                color:'#fb923c', icon:'🚲', category:'crime' },
  { name:'Package Theft',             color:'#f59e0b', icon:'📦', category:'crime' },
  { name:'Catalytic Converter Theft', color:'#d97706', icon:'🔧', category:'crime' },
  { name:'Identity Theft / Fraud',    color:'#059669', icon:'🪪', category:'crime' },
  { name:'Scam',                      color:'#10b981', icon:'💳', category:'crime' },
  // damage / nuisance
  { name:'Vandalism',                 color:'#a064f0', icon:'🔨', category:'crime' },
  { name:'Graffiti',                  color:'#9333ea', icon:'🎨', category:'crime' },
  { name:'Arson',                     color:'#ef4444', icon:'🔥', category:'crime' },
  { name:'Illegal Dumping',           color:'#65a30d', icon:'🗑️', category:'crime' },
  { name:'Trespassing',               color:'#0891b2', icon:'🚫', category:'crime' },
  { name:'Hit and Run',               color:'#f97316', icon:'💥', category:'crime' },
  // substances / disorder
  { name:'Drug Activity',             color:'#d064a0', icon:'💊', category:'crime' },
  { name:'Public Intoxication',       color:'#db2777', icon:'🍺', category:'crime' },
  { name:'Noise Complaint',           color:'#8b5cf6', icon:'🔊', category:'crime' },
  // general
  { name:'Suspicious Activity',       color:'#4fa8d0', icon:'👁️', category:'crime' },
  { name:'Other',                     color:'#7b82a8', icon:'⚠️', category:'crime' },
];

// ── Keyword → type guesser ─────────────────────────────────────────────────────

const TYPE_KEYWORDS = {
  'Shooting / Gunshots':       ['shoot','shot','gun','gunshot','firearm','bullet','fired','shots fired','bang'],
  'Assault':                   ['attack','attacked','hit','punch','punched','beat','beaten','fight','assault','stabbed','stab','knife'],
  'Robbery':                   ['rob','robbery','mugged','mugger','demanded','held up','armed rob'],
  'Carjacking':                ['carjack','carjacking','stole car','took car','car stolen at gunpoint'],
  'Domestic Disturbance':      ['domestic','screaming inside','fighting inside','yelling inside','couple fighting'],
  'Stalking':                  ['stalking','stalk','been following','following me','watching my'],
  'Harassment':                ['harass','harassment','threatening me','threats','bother','following and'],
  'Burglary':                  ['broke in','break in','break-in','burglar','burglary','forced entry','broken into','entered my home'],
  'Theft':                     ['stole','stolen','theft','pickpocket','took my','my wallet','my phone taken'],
  'Shoplifting':               ['shoplifting','shoplift','stole from store','store theft','stole merchandise'],
  'Vehicle Break-in':          ['car window','broke into car','smashed window','vehicle break','car door'],
  'Bike Theft':                ['bike','bicycle','e-bike','ebike','my bike','cycling'],
  'Package Theft':             ['package','porch pirate','delivery','parcel','ups','fedex','amazon','stole package'],
  'Catalytic Converter Theft': ['catalytic','converter','under my car','under the car','exhaust stolen'],
  'Identity Theft / Fraud':    ['identity theft','id theft','personal info stolen','credit card stolen','bank account'],
  'Scam':                      ['scam','scammer','fraud','con man','fake','phishing','swindle','tricked'],
  'Vandalism':                 ['vandal','vandalism','damage','damaged','smashed','destroyed','keyed','broke my','scratched'],
  'Graffiti':                  ['graffiti','spray paint','tagged','tagging','spray-painted','wrote on'],
  'Arson':                     ['fire','arson','set fire','burning','burned','flames','ignite','lit on fire'],
  'Illegal Dumping':           ['dump','dumping','trash','garbage','waste','junk','debris left','mattress'],
  'Trespassing':               ['trespass','trespassing','private property','on my property','no trespassing','uninvited'],
  'Hit and Run':               ['hit and run','hit-and-run','fled the scene','crashed and fled','drove away after'],
  'Drug Activity':             ['drug','drugs','dealer','dealing','selling drugs','needle','narcotic','meth','crack','heroin','pills','buying drugs'],
  'Public Intoxication':       ['drunk','intoxicated','intoxication','alcohol','drinking in public','passed out'],
  'Noise Complaint':           ['noise','loud','party','loud music','shouting outside','banging'],
  'Suspicious Activity':       ['suspicious','lurking','weird person','strange person','unusual','acting strange','casing'],
  // non-crime
  'Car Accident':              ['accident','collision','crash','rear-ended','fender bender','smash','car crash'],
  'Road Closure':              ['road closed','road closure','blocked road','street closed'],
  'Pothole':                   ['pothole','pot hole','hole in road','road damage'],
  'Broken Streetlight':        ['streetlight','street light','light out','lamp out','dark street'],
  'Flooding':                  ['flood','flooding','flooded','water on road','standing water'],
  'Downed Tree':               ['tree down','fallen tree','downed tree','tree fell','branch down'],
  'Stray Dog':                 ['stray dog','loose dog','dog running','aggressive dog'],
  'Wildlife Sighting':         ['coyote','bear','fox','raccoon','wildlife','animal sighting','snake'],
  'Missing Person':            ['missing person','missing child','missing adult','can\'t find','gone missing'],
  'Missing Pet':               ['missing cat','missing dog','lost pet','my cat','my dog is missing'],
  'Fire':                      ['fire','house fire','building fire','car fire','smoke','flames'],
  'Gas Leak':                  ['gas leak','smell gas','gas smell','gas line'],
  'Medical Emergency':         ['medical','heart attack','unconscious','seizure','ambulance needed','not breathing'],
  'Pest Infestation':          ['rats','mice','cockroach','bed bugs','infestation','rodent'],
};

const BUILTIN_COMMUNITY = [
  // traffic
  { name:'Car Accident',          color:'#f59e0b', icon:'💥', category:'traffic' },
  { name:'Road Closure',          color:'#f59e0b', icon:'🚧', category:'traffic' },
  { name:'Traffic Jam',           color:'#d97706', icon:'🚦', category:'traffic' },
  { name:'Hit and Run',           color:'#f97316', icon:'🚨', category:'traffic' },
  { name:'Reckless Driving',      color:'#fb923c', icon:'🏎️', category:'traffic' },
  // environmental
  { name:'Flooding',              color:'#3b82f6', icon:'🌊', category:'environmental' },
  { name:'Downed Tree',           color:'#22c55e', icon:'🌳', category:'environmental' },
  { name:'Illegal Dumping',       color:'#65a30d', icon:'🗑️', category:'environmental' },
  { name:'Pollution',             color:'#84cc16', icon:'☣️', category:'environmental' },
  { name:'Fallen Power Line',     color:'#facc15', icon:'⚡', category:'environmental' },
  // infrastructure
  { name:'Pothole',               color:'#6366f1', icon:'🕳️', category:'infrastructure' },
  { name:'Broken Streetlight',    color:'#6366f1', icon:'💡', category:'infrastructure' },
  { name:'Water Main Break',      color:'#6366f1', icon:'💧', category:'infrastructure' },
  { name:'Power Outage',          color:'#6366f1', icon:'🔌', category:'infrastructure' },
  { name:'Damaged Sidewalk',      color:'#818cf8', icon:'🚶', category:'infrastructure' },
  // animal / wildlife
  { name:'Stray Dog',             color:'#84cc16', icon:'🐕', category:'animal' },
  { name:'Stray Cat',             color:'#84cc16', icon:'🐈', category:'animal' },
  { name:'Wildlife Sighting',     color:'#22c55e', icon:'🦌', category:'animal' },
  { name:'Animal Injury',         color:'#84cc16', icon:'🐾', category:'animal' },
  { name:'Swarm / Bees',          color:'#fbbf24', icon:'🐝', category:'animal' },
  // emergency
  { name:'Fire',                  color:'#dc2626', icon:'🔥', category:'emergency' },
  { name:'Medical Emergency',     color:'#ef4444', icon:'🚑', category:'emergency' },
  { name:'Gas Leak',              color:'#f97316', icon:'💨', category:'emergency' },
  { name:'Hazmat',                color:'#dc2626', icon:'☢️', category:'emergency' },
  // missing
  { name:'Missing Person',        color:'#a855f7', icon:'🔍', category:'missing' },
  { name:'Missing Pet',           color:'#c084fc', icon:'🐾', category:'missing' },
  { name:'Welfare Check',         color:'#a855f7', icon:'👤', category:'missing' },
  // noise
  { name:'Noise Complaint',       color:'#8b5cf6', icon:'🔊', category:'noise' },
  { name:'Construction Noise',    color:'#8b5cf6', icon:'🔨', category:'noise' },
  { name:'Loud Music / Party',    color:'#7c3aed', icon:'🎵', category:'noise' },
  // community
  { name:'Community Notice',      color:'#22c55e', icon:'📢', category:'community' },
  { name:'Safety Advisory',       color:'#3b82f6', icon:'🔔', category:'community' },
  { name:'Neighborhood Watch',    color:'#22c55e', icon:'👀', category:'community' },
  // event
  { name:'Community Event',       color:'#a855f7', icon:'🎉', category:'event' },
  { name:'Block Party',           color:'#a855f7', icon:'🎊', category:'event' },
  { name:'Garage Sale',           color:'#c084fc', icon:'🏷️', category:'event' },
  // lost & found
  { name:'Lost Item',             color:'#06b6d4', icon:'❓', category:'lost-found' },
  { name:'Found Item',            color:'#06b6d4', icon:'📦', category:'lost-found' },
  { name:'Lost Pet',              color:'#0891b2', icon:'🐾', category:'lost-found' },
  { name:'Found Pet',             color:'#0891b2', icon:'🐶', category:'lost-found' },
  // public health
  { name:'Public Health Concern', color:'#3b82f6', icon:'🏥', category:'public-health' },
  { name:'Pest Infestation',      color:'#3b82f6', icon:'🐀', category:'public-health' },
  { name:'Contamination Risk',    color:'#0ea5e9', icon:'⚠️', category:'public-health' },
];

const LANDMARK_META = {
  'Park':         { icon:'🌳', color:'#22c55e' },
  'Lake':         { icon:'💧', color:'#3b82f6' },
  'School':       { icon:'🏫', color:'#f59e0b' },
  'Hospital':     { icon:'🏥', color:'#ef4444' },
  'Police':       { icon:'🚔', color:'#3b82f6' },
  'Fire Station': { icon:'🚒', color:'#ef4444' },
  'Library':      { icon:'📚', color:'#8b5cf6' },
  'Sports':       { icon:'⚽', color:'#22c55e' },
  'Transit':      { icon:'🚌', color:'#6b7280' },
  'Church':       { icon:'⛪', color:'#94a3b8' },
  'Shopping':     { icon:'🛒', color:'#f59e0b' },
  'Custom':       { icon:'📌', color:'#94a3b8' },
};

// ── State ──────────────────────────────────────────────────────────────────────

let reports      = [];
let customTypes  = [];
let landmarkData = [];
let map, pendingPin = null, pendingMarker = null;
let markers      = {}, landmarkMarkers = {};
let activeFilter = '';
let activeDetailId = null;
let pickingMode  = false;
let adminPickTarget = null; // 'landmark' | 'report'
let pendingPhotos = [];     // File objects staged for upload

// ── API helper ─────────────────────────────────────────────────────────────────

async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type':'application/json', 'Authorization':'Bearer '+token },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) { logout(); return null; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Auth UI ────────────────────────────────────────────────────────────────────

document.getElementById('user-name').textContent   = me.username;
document.getElementById('user-avatar').textContent = me.username.charAt(0).toUpperCase();
if (me.role === 'admin') {
  document.getElementById('open-admin-btn').style.display = '';
  document.getElementById('admin-user-tag').textContent   = '👤 ' + me.username;
}

function logout() {
  localStorage.removeItem('nw_token');
  localStorage.removeItem('nw_user');
  window.location.href = '/login.html';
}
document.getElementById('logout-btn').addEventListener('click', logout);

// ── Map ────────────────────────────────────────────────────────────────────────

// ── Map tile layers ────────────────────────────────────────────────────────────

const TILE_LAYERS = {
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO', maxZoom: 19,
  }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, USGS, USDA — satellite imagery', maxZoom: 19,
  }),
  street: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 19,
  }),
};
let activeLayer = 'dark';

function initMap(lat, lng) {
  map = L.map('map', { zoomControl: true }).setView([lat, lng], 14);
  TILE_LAYERS.dark.addTo(map);

  // Layer toggle
  document.querySelectorAll('.mlt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.layer;
      if (layer === activeLayer) return;
      map.removeLayer(TILE_LAYERS[activeLayer]);
      TILE_LAYERS[layer].addTo(map);
      activeLayer = layer;
      document.querySelectorAll('.mlt-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.layer === layer)
      );
    });
  });

  map.on('click', (e) => {
    if (!pickingMode) return;
    const { lat, lng } = e.latlng;
    exitPickMode();
    if (adminPickTarget === 'landmark') {
      document.getElementById('lm-lat').value = lat.toFixed(6);
      document.getElementById('lm-lng').value = lng.toFixed(6);
      adminPickTarget = null;
      openAdminPanel();
      switchAdminTab('landmarks');
    } else if (adminPickTarget === 'report') {
      document.getElementById('ar-lat').value = lat.toFixed(6);
      document.getElementById('ar-lng').value = lng.toFixed(6);
      adminPickTarget = null;
      openAdminPanel();
      switchAdminTab('addreport');
    } else {
      setPendingPin(lat, lng);
      openModal();
    }
  });

  loadAll();
}

function getUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => initMap(p.coords.latitude, p.coords.longitude),
      () => initMap(40.7128, -74.0060)
    );
  } else initMap(40.7128, -74.0060);
}

// ── Load everything ────────────────────────────────────────────────────────────

async function loadAll() {
  await Promise.all([loadCustomTypes(), loadLandmarks(), loadReports()]);
  populateFilterDropdown();
}

async function loadReports() {
  try {
    const url = activeFilter ? `/reports?type=${encodeURIComponent(activeFilter)}` : '/reports';
    reports = await api('GET', url) || [];
    reports.forEach(r => addMarker(r));
    updateSidebar();
    await loadStats();
  } catch(e) { console.error(e); }
}

async function loadStats() {
  try {
    const s = await api('GET', '/reports/stats');
    if (!s) return;
    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('stat-week').textContent  = s.week;
    document.getElementById('stat-type').textContent  = s.byType.length ? s.byType[0].type.split(' ')[0] : '—';
  } catch {}
}

async function loadCustomTypes() {
  try { customTypes = await api('GET', '/admin/types') || []; } catch {}
}

async function loadLandmarks() {
  try {
    landmarkData = await api('GET', '/landmarks') || [];
    landmarkData.forEach(lm => addLandmarkMarker(lm));
  } catch {}
}

// ── Type helpers ───────────────────────────────────────────────────────────────

function allTypes() {
  return [...BUILTIN_CRIME, ...BUILTIN_COMMUNITY, ...customTypes];
}

function typeInfo(name) {
  return allTypes().find(t => t.name === name) || { color:'#7b82a8', icon:'⚠️', category:'crime' };
}

function populateFilterDropdown() {
  const sel = document.getElementById('filter-type');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All Types</option>';
  populateTypeSelect(sel, false);
  sel.value = cur;
}

const CAT_LABELS = {
  crime:'🔴 Crime', traffic:'🚦 Traffic', environmental:'🌿 Environmental',
  infrastructure:'🏗️ Infrastructure', animal:'🐾 Animal / Wildlife',
  emergency:'🚨 Emergency', missing:'🔍 Missing Person', noise:'🔊 Noise',
  community:'🟢 Community', event:'🎉 Event', 'lost-found':'📦 Lost & Found',
  'public-health':'🏥 Public Health',
};

function populateTypeSelect(selEl, includeBlank = true) {
  selEl.innerHTML = includeBlank ? '<option value="">Select a type…</option>' : '';
  const all = [...BUILTIN_CRIME, ...BUILTIN_COMMUNITY, ...customTypes];
  const groups = {};
  all.forEach(t => { (groups[t.category] = groups[t.category] || []).push(t); });
  Object.entries(CAT_LABELS).forEach(([cat, label]) => {
    if (!groups[cat]?.length) return;
    const og = document.createElement('optgroup'); og.label = label;
    groups[cat].forEach(t => {
      const o = document.createElement('option'); o.value = t.name; o.textContent = `${t.icon} ${t.name}`; og.appendChild(o);
    });
    selEl.appendChild(og);
  });
}

function populateReportTypeDropdown() {
  populateTypeSelect(document.getElementById('form-type'), true);
}

function populateAdminReportTypeDropdown(category) {
  const sel  = document.getElementById('ar-type');
  sel.innerHTML = '';
  const pool = allTypes().filter(t => t.category === category);
  if (!pool.length) { sel.innerHTML = '<option value="">No types for this category</option>'; return; }
  pool.forEach(t => { const o = document.createElement('option'); o.value=t.name; o.textContent=`${t.icon} ${t.name}`; sel.appendChild(o); });
}

// ── Markers (reports) ──────────────────────────────────────────────────────────

function makeReportIcon(report) {
  const info  = typeInfo(report.type);
  const color = info.color;
  const icon  = info.icon;
  return L.divIcon({
    className: '',
    html: `<div class="crime-marker" style="background:${color}"><span>${icon}</span></div>`,
    iconSize:[32,32], iconAnchor:[16,32], popupAnchor:[0,-34],
  });
}

function addMarker(report) {
  if (!report.lat || !report.lng || markers[report.id]) return;
  const marker = L.marker([report.lat, report.lng], { icon: makeReportIcon(report) });
  marker.bindPopup(L.popup({ maxWidth:220 }).setContent(buildPopupHTML(report)));
  marker.on('popupopen', () => {
    const btn = document.getElementById(`popup-btn-${report.id}`);
    if (btn) btn.addEventListener('click', () => openDetail(report.id));
  });
  marker.addTo(map);
  markers[report.id] = marker;
}

function buildPopupHTML(r) {
  const info = typeInfo(r.type);
  return `
    <div class="popup-type" style="color:${info.color}">${info.icon} ${r.type}</div>
    ${r.title?`<div class="popup-title">${r.title}</div>`:''}
    <div class="popup-date">${formatDate(r.date)}${r.time?' · '+r.time:''}</div>
    ${r.reported_by?`<div class="popup-date">👤 ${r.reported_by}</div>`:''}
    ${r.description?`<div class="popup-desc">${r.description}</div>`:''}
    ${r.photos?.[0]?`<img src="${r.photos[0]}" class="popup-photo" loading="lazy" />`:''}
    <button class="popup-view-btn" id="popup-btn-${r.id}">View Details</button>
  `;
}

function removeMarker(id) {
  if (markers[id]) { map.removeLayer(markers[id]); delete markers[id]; }
}

// ── Markers (landmarks) ────────────────────────────────────────────────────────

function addLandmarkMarker(lm) {
  if (landmarkMarkers[lm.id || lm._id]) return;
  const meta  = LANDMARK_META[lm.type] || LANDMARK_META['Custom'];
  const icon  = lm.icon  || meta.icon;
  const color = lm.color || meta.color;
  const leafIcon = L.divIcon({
    className: '',
    html: `<div class="landmark-marker" style="background:${color}22;border-color:${color}55">${icon}</div>`,
    iconSize:[28,28], iconAnchor:[14,14], popupAnchor:[0,-16],
  });
  const marker = L.marker([lm.lat, lm.lng], { icon: leafIcon });
  marker.bindPopup(`<div class="popup-type" style="color:${color}">${icon} ${lm.name}</div><div class="popup-date">${lm.type}${lm.description?'<br>'+lm.description:''}</div>`);
  marker.addTo(map);
  const key = lm.id || lm._id;
  landmarkMarkers[key] = marker;
}

function removeLandmarkMarker(id) {
  if (landmarkMarkers[id]) { map.removeLayer(landmarkMarkers[id]); delete landmarkMarkers[id]; }
}

// ── Pick mode ──────────────────────────────────────────────────────────────────

function enterPickMode(label) {
  pickingMode = true;
  document.getElementById('map').classList.add('picking');
  document.getElementById('pick-banner-text').textContent = label || 'Click anywhere on the map to place the incident pin';
  document.getElementById('pick-banner').style.display = 'flex';
}

function exitPickMode() {
  pickingMode = false;
  document.getElementById('map').classList.remove('picking');
  document.getElementById('pick-banner').style.display = 'none';
}

document.getElementById('open-report-btn').addEventListener('click', () => enterPickMode());
document.getElementById('pick-cancel-btn').addEventListener('click', () => {
  exitPickMode(); adminPickTarget = null;
});

// ── Pending pin ────────────────────────────────────────────────────────────────

function setPendingPin(lat, lng) {
  pendingPin = { lat, lng };
  if (pendingMarker) map.removeLayer(pendingMarker);
  pendingMarker = L.circleMarker([lat, lng], {
    radius:10, color:'#22c55e', fillColor:'#22c55e', fillOpacity:.4, weight:2,
  }).addTo(map);
  document.getElementById('pin-coords-text').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function clearPendingPin() {
  if (pendingMarker) { map.removeLayer(pendingMarker); pendingMarker = null; }
  pendingPin = null;
  document.getElementById('pin-coords-text').textContent = 'No pin placed';
}

// ── Report modal ───────────────────────────────────────────────────────────────

// ── Photo upload helpers ───────────────────────────────────────────────────────

async function uploadPhotos(files) {
  if (!files.length) return [];
  const form = new FormData();
  files.forEach(f => form.append('photos', f));
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.urls || [];
}

function renderPhotoPreviews() {
  const container = document.getElementById('photo-previews');
  container.innerHTML = '';
  pendingPhotos.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'photo-thumb';
    const reader = new FileReader();
    reader.onload = e => {
      div.innerHTML = `<img src="${e.target.result}" alt="photo" /><button type="button" class="photo-remove" data-i="${i}">✕</button>`;
      div.querySelector('.photo-remove').addEventListener('click', () => {
        pendingPhotos.splice(i, 1);
        renderPhotoPreviews();
      });
    };
    reader.readAsDataURL(f);
    container.appendChild(div);
  });
}

document.getElementById('photo-drop-zone').addEventListener('click', () =>
  document.getElementById('form-photos').click()
);
document.getElementById('photo-drop-zone').addEventListener('dragover', e => {
  e.preventDefault(); e.currentTarget.classList.add('drag-over');
});
document.getElementById('photo-drop-zone').addEventListener('dragleave', e =>
  e.currentTarget.classList.remove('drag-over')
);
document.getElementById('photo-drop-zone').addEventListener('drop', e => {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  files.forEach(f => { if (pendingPhotos.length < 10) pendingPhotos.push(f); });
  renderPhotoPreviews();
});
document.getElementById('form-photos').addEventListener('change', e => {
  Array.from(e.target.files).forEach(f => { if (pendingPhotos.length < 10) pendingPhotos.push(f); });
  renderPhotoPreviews();
  e.target.value = '';
});

// ── Type guesser ───────────────────────────────────────────────────────────────

function guessType(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type;
    }
  }
  return null;
}

function showAutoDetect(typeName) {
  const badge = document.getElementById('autodetect-badge');
  const nameEl = document.getElementById('autodetect-name');
  if (typeName) {
    nameEl.textContent = typeName;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

// ── Report modal ───────────────────────────────────────────────────────────────

function openModal() {
  populateReportTypeDropdown();
  document.getElementById('form-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('autodetect-badge').style.display = 'none';
  document.getElementById('modal-overlay').classList.add('active');
  setTimeout(() => document.getElementById('form-title').focus(), 80);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('report-form').reset();
  document.getElementById('autodetect-badge').style.display = 'none';
  document.getElementById('photo-previews').innerHTML = '';
  pendingPhotos = [];
  clearPendingPin();
}

// Auto-detect type as user types the title
let guessTimer = null;
document.getElementById('form-title').addEventListener('input', () => {
  clearTimeout(guessTimer);
  guessTimer = setTimeout(() => {
    const title   = document.getElementById('form-title').value.trim();
    const typeEl  = document.getElementById('form-type');
    const guessed = guessType(title);
    // Only auto-select if user hasn't manually chosen a type
    if (typeEl.value === '' && guessed) {
      typeEl.value = guessed;
      showAutoDetect(guessed);
      typeEl.classList.add('autodetect-flash');
      setTimeout(() => typeEl.classList.remove('autodetect-flash'), 600);
    } else if (!guessed) {
      showAutoDetect(null);
    }
  }, 350);
});

// If user manually changes type, hide auto-detect badge
document.getElementById('form-type').addEventListener('change', () => {
  showAutoDetect(null);
});

document.getElementById('modal-close-btn').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

document.getElementById('report-form').addEventListener('submit', async e => {
  e.preventDefault();
  if (!pendingPin) { alert('Pick a location on the map first.'); return; }
  const title   = document.getElementById('form-title').value.trim();
  const typeEl  = document.getElementById('form-type');
  // Final fallback: if still no type, guess from title one more time
  if (!typeEl.value) {
    const guessed = guessType(title);
    if (guessed) typeEl.value = guessed;
    else typeEl.value = 'Other';
  }
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'Submitting…';
  try {
    btn.textContent = pendingPhotos.length ? 'Uploading photos…' : 'Submitting…';
    const photoUrls = await uploadPhotos(pendingPhotos);
    btn.textContent = 'Submitting…';
    const report = await api('POST', '/reports', {
      type:        typeEl.value,
      title,
      date:        document.getElementById('form-date').value,
      time:        document.getElementById('form-time').value  || null,
      description: document.getElementById('form-description').value.trim() || null,
      severity:    document.querySelector('input[name="severity"]:checked')?.value || 'medium',
      photos:      photoUrls,
      lat: pendingPin.lat, lng: pendingPin.lng,
    });
    if (report) {
      reports.unshift(report);
      addMarker(report);
      updateSidebar();
      await loadStats();
      closeModal();
      map.setView([report.lat, report.lng], Math.max(map.getZoom(), 15));
      markers[report.id]?.openPopup();
    }
  } catch(err) { alert('Failed: '+err.message); }
  finally { btn.disabled = false; btn.textContent = 'Submit Report'; }
});

// ── Detail modal ───────────────────────────────────────────────────────────────

function openDetail(id) {
  const r = reports.find(x => x.id === id);
  if (!r) return;
  activeDetailId = id;
  const info = typeInfo(r.type);
  const sev  = r.severity || 'medium';
  document.getElementById('detail-title').textContent = `${info.icon} ${r.type}`;
  document.getElementById('detail-body').innerHTML = `
    ${r.title?`<div class="detail-title-text">${r.title}</div>`:''}
    <div class="detail-row"><span class="detail-label">Type</span><span class="detail-value" style="color:${info.color};font-weight:700">${r.type}</span></div>
    <div class="detail-row"><span class="detail-label">Category</span><span class="detail-value"><span class="cat-chip cat-${r.category||'crime'}">${(r.category||'crime').toUpperCase()}</span></span></div>
    <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${formatDate(r.date)}${r.time?' at '+r.time:''}</span></div>
    <div class="detail-row"><span class="detail-label">Severity</span><span class="detail-value"><span class="sev-badge ${sev}">${capitalize(sev)}</span></span></div>
    ${r.lat?`<div class="detail-row"><span class="detail-label">Coords</span><span class="detail-value">${r.lat.toFixed(5)}, ${r.lng.toFixed(5)}</span></div>`:''}
    ${r.description?`<div class="detail-row"><span class="detail-label">Details</span><span class="detail-value">${r.description}</span></div>`:''}
    <div class="detail-row"><span class="detail-label">Reported by</span><span class="detail-value">👤 ${r.reported_by||'Unknown'}</span></div>
    <div class="detail-row"><span class="detail-label">Submitted</span><span class="detail-value" style="color:var(--text-muted);font-size:12px">${new Date(r.created_at).toLocaleString()}</span></div>
    ${r.photos?.length ? `<div class="detail-photos">${r.photos.map(url=>`<a href="${url}" target="_blank"><img src="${url}" class="detail-photo" loading="lazy" /></a>`).join('')}</div>` : ''}
  `;
  document.getElementById('detail-delete-btn').style.display = me.role === 'admin' ? '' : 'none';
  document.getElementById('detail-overlay').classList.add('active');
}

function closeDetail() {
  document.getElementById('detail-overlay').classList.remove('active');
  activeDetailId = null;
}

document.getElementById('detail-close-btn').addEventListener('click', closeDetail);
document.getElementById('detail-close-btn2').addEventListener('click', closeDetail);
document.getElementById('detail-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('detail-overlay')) closeDetail();
});

document.getElementById('detail-delete-btn').addEventListener('click', async () => {
  if (!activeDetailId || !confirm('Delete this report?')) return;
  try {
    await api('DELETE', '/reports/'+activeDetailId);
    reports = reports.filter(r => r.id !== activeDetailId);
    removeMarker(activeDetailId);
    updateSidebar(); await loadStats(); closeDetail();
  } catch(err) { alert('Delete failed: '+err.message); }
});

// ── Sidebar ────────────────────────────────────────────────────────────────────

function updateSidebar() {
  const list     = document.getElementById('report-list');
  const filtered = activeFilter ? reports.filter(r => r.type === activeFilter) : reports;
  if (!filtered.length) {
    list.innerHTML = activeFilter
      ? `<li class="empty-state">No <strong>${activeFilter}</strong> reports.</li>`
      : `<li class="empty-state">No reports yet. Click <strong>"+ Report Crime"</strong>.</li>`;
    return;
  }
  list.innerHTML = filtered.map(r => {
    const info = typeInfo(r.type);
    const sev  = r.severity || 'medium';
    const cat  = r.category || 'crime';
    return `<li class="report-item" data-id="${r.id}">
      <div class="report-item-header">
        <div class="crime-dot" style="background:${info.color}"></div>
        <span class="report-item-type">${r.title || r.type}</span>
        <span class="report-item-sev ${sev}">${capitalize(sev)}</span>
      </div>
      <div class="report-item-meta">
        <span style="color:${info.color}">${info.icon} ${r.type}</span>
        <span>· ${formatDate(r.date)}${r.time?' · '+r.time:''}</span>
      </div>
      ${r.reported_by?`<div class="report-item-desc">👤 ${r.reported_by}</div>`:''}
      ${r.description?`<div class="report-item-desc">${r.description}</div>`:''}
    </li>`;
  }).join('');
  list.querySelectorAll('.report-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const r  = reports.find(x => x.id === id);
      if (r?.lat) { map.setView([r.lat, r.lng], Math.max(map.getZoom(), 16)); markers[id]?.openPopup(); }
      openDetail(id);
    });
  });
}

// ── Filter ─────────────────────────────────────────────────────────────────────

document.getElementById('filter-type').addEventListener('change', async e => {
  activeFilter = e.target.value;
  Object.values(markers).forEach(m => map.removeLayer(m)); markers = {};
  await loadReports();
});
document.getElementById('clear-filter-btn').addEventListener('click', async () => {
  activeFilter = ''; document.getElementById('filter-type').value = '';
  Object.values(markers).forEach(m => map.removeLayer(m)); markers = {};
  await loadReports();
});

// ══════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════

function openAdminPanel() {
  document.getElementById('admin-overlay').classList.add('active');
  adminLoadStats();
}
function closeAdminPanel() {
  document.getElementById('admin-overlay').classList.remove('active');
}

document.getElementById('open-admin-btn').addEventListener('click', openAdminPanel);
document.getElementById('admin-close-btn').addEventListener('click', closeAdminPanel);
document.getElementById('admin-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('admin-overlay')) closeAdminPanel();
});

// ── Admin tabs ─────────────────────────────────────────────────────────────────

function switchAdminTab(name) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`).style.display = '';
  document.querySelector(`.admin-nav-btn[data-tab="${name}"]`)?.classList.add('active');

  if (name === 'reports')   adminLoadReports();
  if (name === 'landmarks') adminLoadLandmarks();
  if (name === 'types')     adminLoadTypes();
  if (name === 'addreport') adminInitAddReport();
}

document.querySelectorAll('.admin-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
});

// ── Admin: Dashboard ───────────────────────────────────────────────────────────

async function adminLoadStats() {
  try {
    const s = await api('GET', '/admin/stats');
    if (!s) return;
    document.getElementById('adm-total').textContent = s.totalReports;
    document.getElementById('adm-week').textContent  = s.weekCount;
    document.getElementById('adm-users').textContent = s.totalUsers;
    document.getElementById('adm-types').textContent = s.totalTypes;

    const max = Math.max(...Object.values(s.byType), 1);
    document.getElementById('admin-breakdown').innerHTML = Object.entries(s.byType)
      .sort((a,b)=>b[1]-a[1]).slice(0,8)
      .map(([type, count]) => {
        const info = typeInfo(type);
        return `<div class="breakdown-row">
          <div class="breakdown-label">${info.icon} ${type}</div>
          <div class="breakdown-bar-wrap"><div class="breakdown-bar" style="width:${Math.round(count/max*100)}%;background:${info.color}"></div></div>
          <div class="breakdown-count">${count}</div>
        </div>`;
      }).join('') || '<div style="color:rgba(34,197,94,.3);font-size:12px;padding:8px 0">No reports yet.</div>';
  } catch {}
}

// ── Admin: Reports table ───────────────────────────────────────────────────────

async function adminLoadReports() {
  try {
    const list = await api('GET', '/admin/reports') || [];
    document.getElementById('reports-count').textContent = list.length;
    document.getElementById('admin-reports-body').innerHTML = list.map(r => {
      const info = typeInfo(r.type);
      const sev  = r.severity || 'medium';
      return `<tr>
        <td><span class="tbl-type-dot" style="background:${info.color}"></span>${r.type}</td>
        <td><span class="cat-chip cat-${r.category||'crime'}">${(r.category||'crime').toUpperCase()}</span></td>
        <td>${formatDate(r.date)}</td>
        <td>${r.reported_by}</td>
        <td><span class="sev-badge ${sev}" style="padding:2px 8px;font-size:10px">${capitalize(sev)}</span></td>
        <td><button class="tbl-delete-btn" data-id="${r.id}">Delete</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="6" style="text-align:center;color:rgba(34,197,94,.3);padding:20px">No reports</td></tr>';

    document.querySelectorAll('.tbl-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this report?')) return;
        try {
          await api('DELETE', '/admin/reports/'+btn.dataset.id);
          reports = reports.filter(r => r.id !== btn.dataset.id);
          removeMarker(btn.dataset.id);
          updateSidebar(); await loadStats();
          btn.closest('tr').remove();
          document.getElementById('reports-count').textContent =
            parseInt(document.getElementById('reports-count').textContent) - 1;
          adminLoadStats();
        } catch(e) { alert(e.message); }
      });
    });
  } catch(e) { console.error(e); }
}

// ── Admin: Landmarks ───────────────────────────────────────────────────────────

async function adminLoadLandmarks() {
  try {
    landmarkData = await api('GET', '/landmarks') || [];
    document.getElementById('landmarks-count').textContent = landmarkData.length;
    const ul = document.getElementById('landmarks-list');
    if (!landmarkData.length) {
      ul.innerHTML = '<li class="admin-list-empty">No landmarks yet.</li>'; return;
    }
    ul.innerHTML = landmarkData.map(lm => {
      const meta = LANDMARK_META[lm.type] || LANDMARK_META['Custom'];
      return `<li class="admin-list-item" data-id="${lm.id}">
        <span class="ali-icon">${lm.icon || meta.icon}</span>
        <div class="ali-info">
          <div class="ali-name">${lm.name}</div>
          <div class="ali-meta">${lm.type}${lm.description?' · '+lm.description:''}</div>
        </div>
        <button class="ali-delete" data-id="${lm.id}">Remove</button>
      </li>`;
    }).join('');
    ul.querySelectorAll('.ali-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove landmark?')) return;
        try {
          await api('DELETE', '/landmarks/'+btn.dataset.id);
          removeLandmarkMarker(btn.dataset.id);
          landmarkData = landmarkData.filter(l => l.id !== btn.dataset.id);
          btn.closest('li').remove();
          document.getElementById('landmarks-count').textContent = landmarkData.length;
        } catch(e) { alert(e.message); }
      });
    });
  } catch(e) { console.error(e); }
}

document.getElementById('landmark-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.admin-submit-btn');
  btn.textContent = 'Adding…'; btn.disabled = true;
  try {
    const lmType = document.getElementById('lm-type').value;
    const meta   = LANDMARK_META[lmType] || LANDMARK_META['Custom'];
    const lm = await api('POST', '/landmarks', {
      name:        document.getElementById('lm-name').value,
      type:        lmType,
      lat:         document.getElementById('lm-lat').value,
      lng:         document.getElementById('lm-lng').value,
      icon:        meta.icon,
      color:       meta.color,
      description: document.getElementById('lm-desc').value || null,
    });
    if (lm) {
      landmarkData.push(lm);
      addLandmarkMarker(lm);
      adminLoadLandmarks();
      e.target.reset();
    }
  } catch(err) { alert(err.message); }
  finally { btn.textContent = 'Add Landmark'; btn.disabled = false; }
});

document.getElementById('lm-pick-btn').addEventListener('click', () => {
  adminPickTarget = 'landmark';
  closeAdminPanel();
  enterPickMode('Click the map to place the landmark pin');
});

// ── Admin: Custom Types ────────────────────────────────────────────────────────

async function adminLoadTypes() {
  try {
    customTypes = await api('GET', '/admin/types') || [];
    document.getElementById('types-count').textContent = customTypes.length;
    const ul = document.getElementById('types-list');
    if (!customTypes.length) {
      ul.innerHTML = '<li class="admin-list-empty">No custom types yet.</li>'; return;
    }
    ul.innerHTML = customTypes.map(t => `
      <li class="admin-list-item" data-id="${t.id}">
        <span class="ali-icon">${t.icon}</span>
        <div class="ali-info">
          <div class="ali-name" style="color:${t.color}">${t.name}</div>
          <div class="ali-meta">${t.category.toUpperCase()}</div>
        </div>
        <button class="ali-delete" data-id="${t.id}">Remove</button>
      </li>`).join('');
    ul.querySelectorAll('.ali-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove custom type?')) return;
        try {
          await api('DELETE', '/admin/types/'+btn.dataset.id);
          customTypes = customTypes.filter(t => t.id !== btn.dataset.id);
          btn.closest('li').remove();
          document.getElementById('types-count').textContent = customTypes.length;
          populateFilterDropdown();
        } catch(e) { alert(e.message); }
      });
    });
  } catch(e) { console.error(e); }
}

// Color swatch selection
document.getElementById('color-swatches').addEventListener('click', e => {
  const btn = e.target.closest('.cswatch');
  if (!btn) return;
  document.querySelectorAll('.cswatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ct-color').value = btn.dataset.color;
});

document.getElementById('type-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.admin-submit-btn');
  btn.textContent = 'Adding…'; btn.disabled = true;
  try {
    const t = await api('POST', '/admin/types', {
      name:     document.getElementById('ct-name').value,
      category: document.getElementById('ct-category').value,
      icon:     document.getElementById('ct-icon').value || '⚠️',
      color:    document.getElementById('ct-color').value,
    });
    if (t) {
      customTypes.push(t);
      adminLoadTypes();
      populateFilterDropdown();
      e.target.reset();
      // reset swatch
      document.querySelectorAll('.cswatch').forEach(b => b.classList.remove('active'));
      document.querySelector('.cswatch[data-color="#22c55e"]').classList.add('active');
      document.getElementById('ct-color').value = '#22c55e';
    }
  } catch(err) { alert(err.message); }
  finally { btn.textContent = 'Add Type'; btn.disabled = false; }
});

// ── Admin: Add Report ──────────────────────────────────────────────────────────

function adminInitAddReport() {
  document.getElementById('ar-date').value = new Date().toISOString().split('T')[0];
  populateAdminReportTypeDropdown(document.getElementById('ar-category').value);
}

document.getElementById('ar-category').addEventListener('change', e => {
  populateAdminReportTypeDropdown(e.target.value);
});

document.getElementById('ar-pick-btn').addEventListener('click', () => {
  adminPickTarget = 'report';
  closeAdminPanel();
  enterPickMode('Click the map to place the report pin');
});

document.getElementById('admin-report-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = e.target.querySelector('.admin-submit-btn');
  btn.textContent = 'Submitting…'; btn.disabled = true;
  try {
    const lat = parseFloat(document.getElementById('ar-lat').value);
    const lng = parseFloat(document.getElementById('ar-lng').value);
    if (isNaN(lat) || isNaN(lng)) { alert('Pick a location on the map first.'); return; }
    const report = await api('POST', '/reports', {
      type:        document.getElementById('ar-type').value,
      category:    document.getElementById('ar-category').value,
      date:        document.getElementById('ar-date').value,
      time:        document.getElementById('ar-time').value || null,
      description: document.getElementById('ar-description').value.trim() || null,
      severity:    document.querySelector('input[name="ar-severity"]:checked')?.value || 'medium',
      lat, lng,
    });
    if (report) {
      reports.unshift(report);
      addMarker(report);
      updateSidebar(); await loadStats(); adminLoadStats();
      e.target.reset();
      document.getElementById('ar-date').value = new Date().toISOString().split('T')[0];
      populateAdminReportTypeDropdown('crime');
      alert('Report added!');
    }
  } catch(err) { alert('Failed: '+err.message); }
  finally { btn.textContent = 'Submit Report'; btn.disabled = false; }
});

// ── Location search ────────────────────────────────────────────────────────────

const searchInput   = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let searchTimer = null;

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if (q.length < 3) { searchResults.style.display='none'; return; }
  searchTimer = setTimeout(() => geocodeSearch(q), 350);
});
searchInput.addEventListener('keydown', e => {
  if (e.key==='Escape') { searchResults.style.display='none'; searchInput.blur(); }
  e.stopPropagation();
});
searchInput.addEventListener('keypress', e => e.stopPropagation());
document.addEventListener('click', e => {
  if (!document.getElementById('map-search').contains(e.target)) searchResults.style.display='none';
});

async function geocodeSearch(q) {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`, { headers:{'Accept-Language':'en'} });
    const data = await res.json();
    if (!data.length) { searchResults.innerHTML='<li class="search-no-result">No results found</li>'; searchResults.style.display='block'; return; }
    searchResults.innerHTML = data.map(item => `
      <li class="search-result-item" data-lat="${item.lat}" data-lng="${item.lon}">
        <span class="search-result-name">${item.display_name.split(',').slice(0,2).join(',')}</span>
        <span class="search-result-full">${item.display_name}</span>
      </li>`).join('');
    searchResults.style.display = 'block';
    searchResults.querySelectorAll('.search-result-item').forEach(el => {
      el.addEventListener('click', () => {
        map.flyTo([+el.dataset.lat, +el.dataset.lng], 15, { duration:1 });
        searchInput.value = el.querySelector('.search-result-name').textContent;
        searchResults.style.display = 'none';
      });
    });
  } catch {}
}

// ── Keyboard shortcuts ─────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    if (pickingMode) { exitPickMode(); adminPickTarget=null; }
    else if (document.getElementById('admin-overlay').classList.contains('active')) closeAdminPanel();
    else if (document.getElementById('modal-overlay').classList.contains('active')) closeModal();
    else if (document.getElementById('detail-overlay').classList.contains('active')) closeDetail();
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(s) {
  if (!s) return '';
  return new Date(s+'T00:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase()+s.slice(1) : ''; }

// ── Boot ───────────────────────────────────────────────────────────────────────

getUserLocation();
