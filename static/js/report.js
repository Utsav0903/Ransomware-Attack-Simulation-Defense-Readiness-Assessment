/* ─────────────────────────────────────────────────────────────
   REPORT.JS  —  Forensic report renderer
───────────────────────────────────────────────────────────── */

async function loadReport() {
  try {
    var res  = await fetch('/generate-report');
    var data = await res.json();

    var enc    = data.encrypted_files || 0;
    var rec    = data.recovered_files || 0;
    var safe   = data.safe_files      || 0;
    var total  = enc + rec + safe;
    var rate   = total > 0 ? Math.round((rec / total) * 100) : 0;
    var threat = data.threat_score    || 0;
    var incidentId =
   'INC-' +

    String(
     Math.floor(
      1000 + Math.random() * 9000
      )
    );

html(
  'incidentId',
  incidentId
);
 var status =
(data.status || '').toUpperCase();

var unsafe =

status === 'COMPROMISED' ||
status === 'RECOVERING'  ||
status === 'RESOLVED'    ||
enc > 0;


html(
  'sumThreatState',
  unsafe ? 'COMPROMISED' : 'SAFE'
);

html(
  'sumFiles',
  enc + rec
);

var recoveryLabel =

status === 'RECOVERING'
? 'RECOVERING'

: rec > 0
? 'RECOVERED'

: unsafe
? 'COMPROMISED'

: 'READY';

html(
  'sumRecovery',
  recoveryLabel
);

html(
  'sumThreat',
  threat + '%'
);
var incident =
document.getElementById(
  'incidentStatus'
);

if(incident){

  if(unsafe){

    incident.innerHTML =
    'ACTIVE INCIDENT';

    incident.style.background =
    'rgba(255,61,107,0.14)';

    incident.style.color =
    '#ff4d6d';

  }

  else{

    incident.innerHTML =
    'SYSTEM SECURE';

    incident.style.background =
    'rgba(74,222,128,0.14)';

    incident.style.color =
    '#4ade80';

  }

}

    // ── Generated timestamp ───────────────────────────────────
    var ts = document.getElementById('rptGeneratedAt');
    if (ts) ts.textContent = 'Generated: ' + (data.generated_at || new Date().toLocaleString());

    // ── KPI cards ─────────────────────────────────────────────
    html('kpiStatusVal', unsafe ? 'UNSAFE' : 'SAFE');
    html('kpiEnc',    enc    + '');
    html('kpiRec',    rec    + '');
    html('kpiSafe',   safe   + '');
    html('kpiThreat', threat + '%');
    html('kpiRate',   rate   + '%');

    var statusKpi = document.getElementById('kpiStatusVal');
    if (statusKpi) statusKpi.style.color = unsafe ? '#ff3d6b' : '#4ade80';

    var kpiCard =
document.getElementById('kpiStatus');

if(kpiCard){

  if(unsafe){

    kpiCard.style.borderColor =
    'rgba(255,61,107,0.42)';

    kpiCard.style.boxShadow =
    '0 0 28px rgba(255,61,107,0.16)';

  }

  else{

    kpiCard.style.borderColor =
    'rgba(74,222,128,0.40)';

    kpiCard.style.boxShadow =
    '0 0 28px rgba(74,222,128,0.14)';

  }

}

    // ── Attack details ────────────────────────────────────────
   var attackState =
status === 'RESOLVED'
? 'INCIDENT RESOLVED'

: unsafe
? 'ACTIVE RANSOMWARE INCIDENT'

: 'SYSTEM SECURE';

var recoveryState =
rec > 0 ? 'Recovery in progress'
        : 'Recovery ready';

var avgTime =
unsafe ? '~18 seconds'
       : '~0 seconds';

html(
'rptAttack',

  det(
    '⚔',
    'Threat State',
    attackState
  ) +

  det(
    '🔒',
    'Encryption Engine',
    'Fernet AES-128'
  ) +

  det(
    '📂',
    'Attack Vector',
    unsafe
      ? 'Filesystem encryption'
      : 'No active attack'
  ) +

  det(
    '🧬',
    'Incident Type',
    unsafe
      ? 'Ransomware Simulation'
      : 'System nominal'
  ) +

  det(
    '📄',
    'Files Impacted',
    enc + ' compromised'
  ) +

  det(
    '⏱',
    'Attack Duration',
    avgTime
  ) +

  det(
    '🛠',
    'Recovery Status',
    recoveryState
  ) +

  det(
    '⚡',
    'Threat Score',
    threat + '%'
  )

);

    // ── File bars ─────────────────────────────────────────────
    if (total > 0) {
      html('rptFileBars',
        bar('ENCRYPTED FILES', enc,  total, 'linear-gradient(90deg,#e8133a,#ff4166)', '#ff3d6b') +
        bar('RECOVERED FILES', rec,  total, 'linear-gradient(90deg,#1d4ed8,#60a5fa)', '#60a5fa') +
        '<div class="rpt-summary">' +
  '<b style="color:#dde8ff">' + total + '</b> total &nbsp;|&nbsp; ' +
  '<b style="color:' + (unsafe?'#ff3d6b':'#4ade80') + '">' +
    (unsafe ? 'COMPROMISED' : 'NOMINAL') +
  '</b>' +
'</div>'
      );
    } else {
      html('rptFileBars', '<div style="opacity:.26;font-size:11px;padding:8px 0;">No file data recorded.</div>');
    }

    // ── Event log ─────────────────────────────────────────────
    var logs = (data.logs || []).slice(-30);
    if (!logs.length) {
      html('rptLog', '<div style="opacity:.24;font-size:11px;padding:8px 0;">No log entries.</div>');
    } else {
      html('rptLog', logs.reverse().map(function (l) {
        var c = l.level === 'CRITICAL' ? '#ff3d6b'
              : l.level === 'SUCCESS'  ? '#4ade80'
              : l.level === 'WARNING'  ? '#fbbf24'
              : '#60a5fa';

        return '<div class="rpt-log-item ' +

	(l.level || "info").toLowerCase() +

	'">' +

	'<div class="rpt-log-top">' +

	'<div class="rpt-log-badge ' +

	(l.level || "info").toLowerCase() +

	'">' +

	(l.level || "INFO") +

	'</div>' +

	'<div class="rpt-log-time">' +

	(l.time || "--:--:--") +

	'</div>' +

	'</div>' +

	'<div class="rpt-log-msg">' +

	(l.message || "") +

	'</div>' +

	'</div>';
	}).join(''));
	    }

    // ── Recommendations ───────────────────────────────────────
    var RECS = [ ['💾', 'Keep backup of important files'],

  ['🛡', 'Use strong antivirus protection'],

  ['🔒', 'Avoid opening unknown files or links'],

  ['⚡', 'Update system security regularly'],

  ['🔑', 'Protect sensitive files with encryption']
    ];
    html('rptRecs', RECS.map(function (r) {
      return '<div class="rec-row"><span class="rec-ico">' + r[0] + '</span><span>' + r[1] + '</span></div>';
    }).join(''));

  } catch (e) {
    console.error('[Report]', e);
  }
}

// ── Helpers ───────────────────────────────────────────────────

function html(id, content) {
  var el = document.getElementById(id);
  if (el) el.innerHTML = content;
}

function det(icon, label, value) {
  return '<div class="det-row">' +
    '<span class="det-icon">' + icon  + '</span>' +
    '<span class="det-label">' + label + '</span>' +
    '<span class="det-val">'   + value + '</span>' +
    '</div>';
}

function bar(label, count, total, gradient, color) {
  var pct = (count / total * 100).toFixed(1);
  return '<div class="fb-row">' +
    '<div class="fb-head">' +
      '<span class="fb-name">' + label + '</span>' +
      '' +
    '</div>' +
    '<div class="fb-track">' +
      '<div class="fb-fill" style="width:' + pct + '%;background:' + gradient + '"></div>' +
    '</div>' +
    '</div>';
}

// Load on open
loadReport();

/* =========================================================
   ANIMATED COUNTERS
========================================================= */

function animateValue(id, value){

  var el =
  document.getElementById(id);

  if(!el) return;

  var start = 0;

  var end =
  parseInt(value);

  var duration = 600;

  var startTime = null;

  function update(ts){

    if(!startTime)
      startTime = ts;

    var progress =
    Math.min(
      (ts - startTime) / duration,
      1
    );

    var current =
    Math.floor(
      progress * (end - start)
    );

    el.innerHTML =
    current;

    if(progress < 1){

      requestAnimationFrame(update);

    }

  }

  requestAnimationFrame(update);

}

/* =========================================
   LIVE AUTO REFRESH
========================================= */

setInterval(() => {

    loadReport();

}, 2000);

console.log(
  '[RADSAS] Live forensic monitor active'
);