/* ─────────────────────────────────────────────────────────────
   DASHBOARD.JS  v4.0  — All fixes applied
   
   Key changes:
   - NO dirty checks on status / phase / speed (always update)
   - Smarter log/timeline check: skip only if count same AND > 0
   - _lastLogCount starts at -1 to force first-render always
   - isFetching guard prevents overlapping requests
   - 1200ms polling for smooth, lag-free experience
   - updateSpeed() always fires on every poll
─────────────────────────────────────────────────────────────── */

var _lastLogCount = -1;   // -1 forces render on very first poll
var _lastTlCount  = -1;
var _lastFileHash = '';
var _isFetching   = false;

// ── Poll ──────────────────────────────────────────────────────
async function fetchStatus() {
  if (_isFetching) return;
  _isFetching = true;
  try {
    var res  = await fetch('/status');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();

    updateStatusBadge(data);      // no dirty check
    updatePhaseTracker(data);     // no dirty check
    updateMetrics(data);
    updateFileSidebar(data);
    updateGlobeThreatCount(data);
    updateSpeed(data);            // no dirty check
    updateLogs(data.logs);
    updateTimeline(data.timeline);
    updateVictimTable(data.files);

  } catch(e) {
    console.error('[Dashboard] Fetch error:', e);
  } finally {
    _isFetching = false;
  }
}

// ── Status badge — always update, no cache ────────────────────
function updateStatusBadge(data) {
  var badge = document.getElementById('statusBadge');
  var label = document.getElementById('statusLabel');
  var sub   = document.getElementById('statusSublabel');
  if (!badge || !label) return;

  var s = (data.status || 'SAFE').toUpperCase();

  // Always reset className then reapply
  if (s === 'COMPROMISED' || s === 'ENCRYPTING') {
    badge.className   = 'status-badge danger';
    label.textContent = s === 'ENCRYPTING' ? 'ENCRYPTING...' : 'COMPROMISED';
    label.style.color = '#ef4444';
    if (sub) { sub.textContent = 'System under active attack'; sub.style.color = '#fca5a5'; }

  } else if (s === 'RECOVERING') {
    badge.className   = 'status-badge warning';
    label.textContent = 'RECOVERING';
    label.style.color = '#f59e0b';
    if (sub) { sub.textContent = 'File recovery in progress...'; sub.style.color = '#fde68a'; }

  } else {
    badge.className   = 'status-badge';
    label.textContent = 'SAFE';
    label.style.color = '#22c55e';
    if (sub) { sub.textContent = 'All systems nominal'; sub.style.color = '#86efac'; }
  }
}

// ── Phase tracker — always update, no cache ───────────────────
var PHASES = ['IDLE','RECON','INFILTRATE','LATERAL','ENCRYPT','COMPLETE'];

function updatePhaseTracker(data) {
  var cur = (data.phase || 'IDLE').toUpperCase();
  var idx = PHASES.indexOf(cur);
  if (idx < 0) idx = 0;

  document.querySelectorAll('.phase-step').forEach(function(step, i) {
    step.classList.remove('done', 'active');
    if      (i < idx)  step.classList.add('done');
    else if (i === idx) step.classList.add('active');
  });
}

// ── Metrics (bars) ────────────────────────────────────────────
function updateMetrics(data) {
  var enc   = data.encrypted || 0;
  var rec   = data.recovered || 0;
  var safe  = data.safe      || 0;
  var total = enc + rec + safe;
  if (total < 1) total = 1;

  setText('enc-count',  enc);
  setText('rec-count',  rec);
  setText('safe-count', safe);
  setText('threat-num', (data.threat || 0) + '%');

  setWidth('enc-bar',  (enc  / total * 100).toFixed(1) + '%');
  setWidth('rec-bar',  (rec  / total * 100).toFixed(1) + '%');
  setWidth('safe-bar', (safe / total * 100).toFixed(1) + '%');
}

// ── File sidebar ──────────────────────────────────────────────
function updateFileSidebar(data) {
  setText('stat-enc',  data.encrypted || 0);
  setText('stat-rec',  data.recovered || 0);
  setText('stat-safe', data.safe      || 0);
}

// ── Globe threat count ────────────────────────────────────────
function updateGlobeThreatCount(data) {
  var el = document.getElementById('globeThreatCount');
  if (!el) return;
  var c = data.encrypted || 0;
  el.textContent = '\u25cf ' + c + ' ACTIVE THREAT' + (c !== 1 ? 'S' : '');
  el.style.color = c > 0 ? 'rgba(255,61,107,0.90)' : 'rgba(167,139,250,0.55)';
}

// ── Encryption speed — always update ─────────────────────────
function updateSpeed(data) {
  var el = document.getElementById('enc-speed');
  if (el) el.textContent = (data.encryption_speed || 0).toFixed(1);
}

// ── Terminal logs ─────────────────────────────────────────────
function updateLogs(logs) {
  var terminal = document.getElementById('terminal');
  if (!terminal) return;

  var newCount = (logs && logs.length) ? logs.length : 0;

  // Skip re-render ONLY if same count AND count > 0
  // If count is 0 or changed, always re-render
  if (newCount === _lastLogCount && newCount > 0) return;
  _lastLogCount = newCount;

  if (newCount === 0) {
    terminal.innerHTML =
      '<div class="log info">' +
        '<span class="log-ts">[--:--:--]</span>' +
        '--- RADSAS ready.' +
      '</div>' +
      '<div class="log info">' +
        '<span class="log-ts">[--:--:--]</span>' +
        'Awaiting operator command...' +
      '</div>';
    return;
  }

  var frag = document.createDocumentFragment();
  logs.slice(-60).forEach(function(log) {
    var level = (log.level || 'INFO').toLowerCase();
    var d     = document.createElement('div');
    d.className = 'log ' + level;
    d.innerHTML =
      '<span class="log-ts">[' + log.time + ']</span>' +
      log.message;
    frag.appendChild(d);
  });

  terminal.innerHTML = '';
  terminal.appendChild(frag);
  terminal.scrollTop = terminal.scrollHeight;
}

// ── Timeline ──────────────────────────────────────────────────
function updateTimeline(timeline) {
  var container = document.getElementById('timeline');
  if (!container) return;

  var newCount = (timeline && timeline.length) ? timeline.length : 0;

  if (newCount === _lastTlCount && newCount > 0) return;
  _lastTlCount = newCount;

  if (newCount === 0) {
    container.innerHTML =
      '<div class="empty-state">No events \u2014 start a simulation</div>';
    return;
  }

  var frag = document.createDocumentFragment();
  timeline.slice(-30).forEach(function(item) {
    var d = document.createElement('div');
    d.className = 'timeline-item';
    d.innerHTML =
      '<div class="timeline-time">'  + item.time  + '</div>' +
      '<div class="timeline-event">' + item.event + '</div>';
    frag.appendChild(d);
  });

  container.innerHTML = '';
  container.appendChild(frag);
  container.scrollTop = container.scrollHeight;
}

// ── Victim file table ─────────────────────────────────────────
function updateVictimTable(files) {
  if (!files) return;
  var hash = files.map(function(f){ return f.name + f.status; }).join('|');
  if (hash === _lastFileHash) return;
  _lastFileHash = hash;

  var tbody = document.getElementById('victimTable');
  var fc    = document.getElementById('fileCount');
  if (!tbody) return;
  if (fc) fc.textContent = files.length + ' FILES';

  var frag = document.createDocumentFragment();
  files.forEach(function(f) {
    var row = document.createElement('tr');
    var cls = f.status === 'ENCRYPTED' ? 'status-encrypted'
            : f.status === 'RECOVERED' ? 'status-recovered'
            : 'status-safe';
    row.innerHTML =
      '<td class="mono">'              + f.name   + '</td>' +
      '<td class="dim">'               + f.ext    + '</td>' +
      '<td class="dim">'               + f.size   + '</td>' +
      '<td><span class="' + cls + '">' + f.status + '</span></td>';
    frag.appendChild(row);
  });
  tbody.innerHTML = '';
  tbody.appendChild(frag);
}

// ── Helpers ───────────────────────────────────────────────────
function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setWidth(id, val) {
  var el = document.getElementById(id);
  if (el) el.style.width = val;
}

// ── Start — 1200ms, smooth and lag-free ───────────────────────
fetchStatus();
setInterval(fetchStatus, 1200);