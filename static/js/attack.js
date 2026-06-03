/* ─────────────────────────────────────────────────────────────
   ATTACK.JS  v4.0
   
   Fix: REMOVED enc-speed animation entirely.
   dashboard.js now owns enc-speed via polling.
   This prevents the two scripts fighting over the same element.
─────────────────────────────────────────────────────────────── */

var attackBtn  = document.getElementById('launchAttack');
var recoverBtn = document.getElementById('recoverFiles');

function sleep(ms) {
  return new Promise(function(r){ setTimeout(r, ms); });
}

function addLog(msg, type) {
  var t = document.getElementById('terminal');
  if (!t) return;
  var d = document.createElement('div');
  d.className = 'log ' + (type || 'info');
  var ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  d.innerHTML = '<span class="log-ts">[' + ts + ']</span>' + msg;
  t.appendChild(d);
  t.scrollTop = t.scrollHeight;
}

function clearTerminal() {
  var t = document.getElementById('terminal');
  if (t) t.innerHTML = '';
}

function shake() {
  if (!document.body.animate) return;
  document.body.animate(
    [{ transform: 'translateX(0)'   },
     { transform: 'translateX(-6px)'},
     { transform: 'translateX(6px)' },
     { transform: 'translateX(-3px)'},
     { transform: 'translateX(0)'   }],
    { duration: 380 }
  );
}

// ── ATTACK ────────────────────────────────────────────────────
if (attackBtn) {
  attackBtn.addEventListener('click', async function() {
    attackBtn.disabled = true;
    if (recoverBtn) recoverBtn.disabled = true;
    clearTerminal();

var steps = [

  ['Threat detected in the system...', 'warning'],

  ['Starting ransomware service...', 'warning'],

  ['Scanning files...', 'warning'],

  ['System started  encryption.', 'error']

];

    for (var i = 0; i < steps.length; i++) {
      addLog(steps[i][0], steps[i][1]);
      await sleep(500);
    }

  shake();

addLog(
  'Encryption started successfully.',
  'error'
);

addLog(
  'Locking victim files...',
  'error'
);

var tl = document.getElementById('timeline');

if(tl){

  tl.innerHTML = `

    <div class="timeline-item active">
      <div class="timeline-dot red"></div>
      <div class="timeline-content">
        <div class="timeline-title">
          Attack initialized
        </div>
        <div class="timeline-time">
          ${new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>

    <div class="timeline-item active">
      <div class="timeline-dot orange"></div>
      <div class="timeline-content">
        <div class="timeline-title">
          Filesystem scan started
        </div>
        <div class="timeline-time">
          ${new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>

  `;

}

/* START ENCRYPTION IMMEDIATELY */
await fetch('/attack');
/* INSTANTLY UPDATE FILE STATUS */
var statusCells =
document.querySelectorAll(
  '.status-safe'
);

statusCells.forEach(function(cell){

  cell.innerHTML =
  'ENCRYPTED';

  cell.classList.remove(
    'status-safe'
  );

  cell.classList.add(
    'status-encrypted'
  );

});

/* COUNTDOWN BEFORE PAYMENT PAGE */
for (var j = 5; j >= 1; j--) {

  addLog(
    'Opening payment page in ' + j + '...',
    'warning'
  );

  await sleep(1000);

}

/* OPEN PAYMENT PAGE */
window.location.href = '/payment';

  });

}
// ── RECOVERY ─────────────────────────────────────────────────
if (recoverBtn) {

  recoverBtn.addEventListener('click', async function(e) {

    e.preventDefault();

    e.stopPropagation();

    recoverBtn.disabled = true;

    if (attackBtn) attackBtn.disabled = true;

    clearTerminal();

var steps = [

  ['Recovery process started...', 'info'],

  ['Checking encrypted files...', 'info'],

  ['Loading recovery key...', 'info'],

  ['Restoring locked files...', 'success'],

  ['Recovering system data...', 'success'],

];

    for (var i = 0; i < steps.length; i++) {

      addLog(steps[i][0], steps[i][1]);

      await sleep(640);

    }

    await fetch('/decrypt', {
      method: 'GET',
      cache: 'no-store'
    });

    setTimeout(function(){

      addLog('✅ Recovery sequence complete.', 'success');

      recoverBtn.disabled = false;

      if (attackBtn) attackBtn.disabled = false;

    }, 3000);

  });

}