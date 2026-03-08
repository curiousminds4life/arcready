/**
 * ArcReady — app.js
 * Tab navigation, mode toggles, reference panel, user form, Ohm's calculator
 */
(function () {
  'use strict';

  var ArcReady = window.ArcReady = window.ArcReady || {};

  /* ============================================================
     TAB NAVIGATION
     ============================================================ */
  var tabButtons = document.querySelectorAll('.nav-tab');
  var tabSections = document.querySelectorAll('.tab-section');

  function showTab(tabName) {
    tabButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabSections.forEach(function (sec) {
      sec.classList.toggle('active', sec.id === 'tab-' + tabName);
    });
    window.scrollTo(0, 0);
    if (tabName === 'progress' && ArcReady.Progress) ArcReady.Progress.render();
  }

  ArcReady.showTab = showTab;

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { showTab(btn.getAttribute('data-tab')); });
  });

  /* ============================================================
     DATA-ACTION BUTTONS
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'goto-safety') showTab('safety');
    if (action === 'goto-theory') showTab('theory');
    if (action === 'goto-lab') showTab('lab');
    if (action === 'goto-reference') showTab('reference');
    if (action === 'goto-progress') showTab('progress');
  });

  // Home-card clicks (cards use data-action OR onclick)
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.home-card[data-action]');
    if (!card) return;
    var action = card.getAttribute('data-action');
    if (action === 'goto-safety') showTab('safety');
    if (action === 'goto-theory') showTab('theory');
  });

  /* ============================================================
     MODE TOGGLE BUTTONS (Study / Practice / Certify)
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.mode-btn');
    if (!btn) return;
    var section = btn.getAttribute('data-section');
    var mode = btn.getAttribute('data-mode');
    if (!section || !mode) return;
    activateMode(section, mode);
  });

  function activateMode(section, mode) {
    var toggleGroup = document.getElementById(section + '-mode-toggle');
    if (toggleGroup) {
      toggleGroup.querySelectorAll('.mode-btn').forEach(function (b) {
        b.classList.toggle('mode-btn--active', b.getAttribute('data-mode') === mode);
      });
    }
    ['study', 'practice', 'certify'].forEach(function (m) {
      var panel = document.getElementById(section + '-' + m);
      if (panel) panel.classList.toggle('mode-content--active', m === mode);
    });
  }

  /* ============================================================
     USER INFO FORM
     ============================================================ */
  var userForm = document.getElementById('user-info-form');
  var nameInput = document.getElementById('user-name');
  var emailInput = document.getElementById('user-email');

  if (nameInput) nameInput.value = localStorage.getItem('arcready_username') || '';
  if (emailInput) emailInput.value = localStorage.getItem('arcready_email') || '';

  if (userForm) {
    userForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (nameInput) localStorage.setItem('arcready_username', nameInput.value.trim());
      if (emailInput) localStorage.setItem('arcready_email', emailInput.value.trim());
      if (ArcReady.TestEngine) ArcReady.TestEngine.toast('Progress info saved!', 'success');
    });
  }

  /* ============================================================
     REFERENCE PANEL
     ============================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ref-open-btn');
    if (!btn) return;
    var refKey = btn.getAttribute('data-ref');
    openRef(refKey);
  });

  var refCloseBtn = document.getElementById('ref-close-btn');
  if (refCloseBtn) refCloseBtn.addEventListener('click', function () {
    var panel = document.getElementById('ref-content-panel');
    if (panel) panel.style.display = 'none';
  });

  function openRef(key) {
    var panel = document.getElementById('ref-content-panel');
    var titleEl = document.getElementById('ref-content-title');
    var bodyEl = document.getElementById('ref-content-body');
    if (!panel || !bodyEl) return;
    var ref = refData[key];
    if (!ref) return;
    if (titleEl) titleEl.textContent = ref.title;
    bodyEl.innerHTML = typeof ref.body === 'function' ? ref.body() : ref.body;
    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Hook: render symbol glossary if needed
    if (key === 'symbols' && ArcReady.renderSymbolGlossary) {
      var symContainer = document.getElementById('ref-symbol-glossary-body');
      if (symContainer) ArcReady.renderSymbolGlossary(symContainer);
    }
  }

  /* ============================================================
     OHM'S LAW CALCULATOR
     ============================================================ */
  ArcReady.calcOhms = function () {
    var E = parseFloat(document.getElementById('ohms-e').value);
    var I = parseFloat(document.getElementById('ohms-i').value);
    var R = parseFloat(document.getElementById('ohms-r').value);
    var P = parseFloat(document.getElementById('ohms-p').value);
    var res = document.getElementById('ohms-result');
    var results = [];
    var eKnown = !isNaN(E), iKnown = !isNaN(I), rKnown = !isNaN(R), pKnown = !isNaN(P);
    if (eKnown && iKnown) { results.push('R = E/I = ' + (E / I).toFixed(4) + ' \u03a9'); results.push('P = E\u00d7I = ' + (E * I).toFixed(4) + ' W'); }
    if (eKnown && rKnown) { results.push('I = E/R = ' + (E / R).toFixed(4) + ' A'); results.push('P = E\u00b2/R = ' + (E * E / R).toFixed(4) + ' W'); }
    if (iKnown && rKnown) { results.push('E = I\u00d7R = ' + (I * R).toFixed(4) + ' V'); results.push('P = I\u00b2\u00d7R = ' + (I * I * R).toFixed(4) + ' W'); }
    if (pKnown && iKnown) { results.push('E = P/I = ' + (P / I).toFixed(4) + ' V'); results.push('R = P/I\u00b2 = ' + (P / (I * I)).toFixed(4) + ' \u03a9'); }
    if (pKnown && eKnown) { results.push('I = P/E = ' + (P / E).toFixed(4) + ' A'); results.push('R = E\u00b2/P = ' + (E * E / P).toFixed(4) + ' \u03a9'); }
    if (pKnown && rKnown) { results.push('I = \u221a(P/R) = ' + Math.sqrt(P / R).toFixed(4) + ' A'); results.push('E = \u221a(P\u00d7R) = ' + Math.sqrt(P * R).toFixed(4) + ' V'); }
    if (res) res.innerHTML = results.length ? '<ul>' + results.map(function (r) { return '<li>' + r + '</li>'; }).join('') + '</ul>' : '<p class="ref-note">Enter at least two values.</p>';
  };

  ArcReady.filterSymbols = function () {
    var q = (document.getElementById('sym-search').value || '').toLowerCase();
    document.querySelectorAll('#symbol-table tbody tr').forEach(function (row) {
      row.style.display = row.textContent.toLowerCase().indexOf(q) >= 0 ? '' : 'none';
    });
  };

  /* ============================================================
     REFERENCE DATA
     ============================================================ */
  var refData = {

    ohms: {
      title: "Ohm's Law & Power Calculator",
      body: function () {
        return '<div class="ohms-calc">' +
          '<p>Enter any <strong>two</strong> known values to calculate the rest.</p>' +
          '<div class="ohms-grid">' +
          '<div class="ohms-field"><label>Voltage E (V)</label><input type="number" id="ohms-e" class="form-input" placeholder="Volts" /></div>' +
          '<div class="ohms-field"><label>Current I (A)</label><input type="number" id="ohms-i" class="form-input" placeholder="Amps" /></div>' +
          '<div class="ohms-field"><label>Resistance R (\u03a9)</label><input type="number" id="ohms-r" class="form-input" placeholder="Ohms" /></div>' +
          '<div class="ohms-field"><label>Power P (W)</label><input type="number" id="ohms-p" class="form-input" placeholder="Watts" /></div>' +
          '</div>' +
          '<button class="btn btn-primary" onclick="ArcReady.calcOhms()">Calculate</button>' +
          '<div id="ohms-result" class="ohms-result"></div>' +
          '<div class="ohms-formulas"><h4>Key Formulas</h4><ul>' +
          '<li>E = I \u00d7 R</li><li>I = E / R</li><li>R = E / I</li>' +
          '<li>P = I \u00d7 E</li><li>P = I\u00b2 \u00d7 R</li><li>P = E\u00b2 / R</li>' +
          '</ul></div></div>';
      }
    },


    boundaries: {
      title: 'NFPA 70E Approach Boundaries',
      body: '<div class="ref-table-wrap"><p>Approach boundaries define how close unqualified and qualified persons may approach energized equipment.</p>' +
        '<table class="ref-table"><thead><tr><th>Boundary</th><th>Who It Applies To</th><th>Rule</th></tr></thead><tbody>' +
        '<tr><td><strong>Limited</strong></td><td>Qualified persons only beyond this point</td><td>Unqualified persons must be escorted by a qualified person</td></tr>' +
        '<tr><td><strong>Restricted</strong></td><td>Qualified persons with PPE</td><td>Increased risk of shock; PPE required, deliberate movement only</td></tr>' +
        '<tr><td><strong>Prohibited (Shock)</strong></td><td>Qualified persons \u2014 inadvertent contact possible</td><td>Direct contact or contact with conductive object prohibited without insulation</td></tr>' +
        '<tr><td><strong>Arc Flash Protection</strong></td><td>Anyone working on or near energized equipment</td><td>Must wear arc-rated PPE rated for the incident energy at this distance</td></tr>' +
        '</tbody></table>' +
        '<p class="ref-note">Exact distances depend on system voltage. Always consult the equipment arc flash label and NFPA 70E Table 130.4(D).</p></div>'
    },

    hrc: {
      title: 'HRC / Arc Flash PPE Categories',
      body: '<div class="ref-table-wrap">' +
        '<table class="ref-table"><thead><tr><th>Category</th><th>Incident Energy</th><th>Minimum Arc Rating</th><th>Required PPE</th></tr></thead><tbody>' +
        '<tr class="hrc-0"><td><strong>Category 0</strong></td><td>&lt; 1.2 cal/cm\u00b2</td><td>N/A</td><td>Non-melting, flammable clothing; safety glasses; hearing protection</td></tr>' +
        '<tr class="hrc-1"><td><strong>Category 1</strong></td><td>1.2 \u2013 4 cal/cm\u00b2</td><td>4 cal/cm\u00b2</td><td>Arc-rated shirt &amp; pants or coverall; face shield; leather gloves; hard hat</td></tr>' +
        '<tr class="hrc-2"><td><strong>Category 2</strong></td><td>4 \u2013 8 cal/cm\u00b2</td><td>8 cal/cm\u00b2</td><td>Arc-rated shirt &amp; pants; arc flash suit; balaclava; rubber insulating gloves; hard hat</td></tr>' +
        '<tr class="hrc-3"><td><strong>Category 3</strong></td><td>8 \u2013 25 cal/cm\u00b2</td><td>25 cal/cm\u00b2</td><td>Arc flash suit (full body); arc-rated gloves; leather protectors; hard hat Class E</td></tr>' +
        '<tr class="hrc-4"><td><strong>Category 4</strong></td><td>25 \u2013 40 cal/cm\u00b2</td><td>40 cal/cm\u00b2</td><td>Heaviest arc flash suit; multi-layer system; Class E hard hat; voltage-rated gloves</td></tr>' +
        '<tr class="hrc-prohibited"><td><strong>PROHIBITED</strong></td><td>&gt; 40 cal/cm\u00b2</td><td>\u2014</td><td>De-energize before work. Energized work PROHIBITED at this level.</td></tr>' +
        '</tbody></table>' +
        '<p class="ref-note">Source: Workplace Safety Standards. All arc-rated clothing must comply with ASTM F-1506. Rubber gloves tested per ASTM D120.</p></div>'
    },

    loto: {
      title: 'LOTOTO \u2014 8-Step Lockout/Tagout/Tryout Procedure',
      body: '<div class="loto-steps">' +
        '<p>Source: Workplace Safety Standards Hazardous Energy Control Program (HECP)</p>' +
        '<ol class="loto-list">' +
        '<li><strong>Identify all energy sources</strong> \u2014 electrical, hydraulic, pneumatic, thermal, gravitational, stored/residual</li>' +
        '<li><strong>Notify affected employees</strong> \u2014 inform all personnel in the area that equipment will be shut down</li>' +
        '<li><strong>Shut down equipment</strong> \u2014 use normal stopping procedure; bring to complete stop</li>' +
        '<li><strong>Isolate all energy sources</strong> \u2014 open disconnects, close valves, block gravity-fed parts</li>' +
        '<li><strong>Apply lockout/tagout devices</strong> \u2014 RED Master Lock or American Lock only; one key per associate; laminated tag with name &amp; date</li>' +
        '<li><strong>Release or restrain stored energy</strong> \u2014 bleed pressure, discharge capacitors, block suspended parts, ground conductors</li>' +
        '<li><strong>Verify isolation (Tryout)</strong> \u2014 attempt to start equipment using normal start controls to confirm zero energy state</li>' +
        '<li><strong>Perform the work</strong> \u2014 only now is it safe to work on the equipment</li>' +
        '</ol>' +
        '<div class="loto-notes">' +
        '<h4>Key Rules</h4>' +
        '<ul>' +
        '<li>All locks must be RED (Master Lock or American Lock only)</li>' +
        '<li>Each associate uses their own lock \u2014 never share keys</li>' +
        '<li>Tags must be laminated and show name + date</li>' +
        '<li>Authorized Associates require Machine Safety Awareness training every 2 years</li>' +
        '</ul></div>' +
        '<button class="btn btn-outline-red" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Checklist</button>' +
        '</div>'
    },

    formulas: {
      title: 'Electrical Formula Sheet',
      body: '<div class="formula-sheet">' +
        '<div class="formula-group">' +
        '<h4>Ohm\u2019s Law</h4>' +
        '<ul><li>E = I \u00d7 R</li><li>I = E / R</li><li>R = E / I</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Power</h4>' +
        '<ul><li>P = I \u00d7 E</li><li>P = I\u00b2 \u00d7 R</li><li>P = E\u00b2 / R</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Series Circuits</h4>' +
        '<ul><li>R\u209c = R\u2081 + R\u2082 + R\u2083 + ...</li><li>I is same throughout</li><li>E\u209c = E\u2081 + E\u2082 + E\u2083 (KVL)</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Parallel Circuits</h4>' +
        '<ul><li>1/R\u209c = 1/R\u2081 + 1/R\u2082 + 1/R\u2083</li><li>E is same across each branch</li><li>I\u209c = I\u2081 + I\u2082 + I\u2083</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>AC Theory</h4>' +
        '<ul><li>f = 1/T (frequency = 1/period)</li><li>V\u1d63\u1d5c\u1d60\u1d62 = V\u209a\u2091\u2090\u2096 / \u221a2 \u2248 0.707 \u00d7 V\u209a\u2091\u2090\u2096</li>' +
        '<li>X\u2097 = 2\u03c0fL (inductive reactance)</li><li>X\u1d04 = 1/(2\u03c0fC) (capacitive reactance)</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>Transformers</h4>' +
        '<ul><li>V\u2081/V\u2082 = N\u2081/N\u2082 (turns ratio)</li><li>Step-up: N\u2082 > N\u2081</li><li>Step-down: N\u2082 < N\u2081</li>' +
        '<li>Example: 4:1 ratio, 480V primary \u2192 120V secondary</li></ul>' +
        '</div>' +
        '<div class="formula-group">' +
        '<h4>3-Phase Systems</h4>' +
        '<ul><li>Wye: V\u2097\u1d62\u2099\u2091 = \u221a3 \u00d7 V\u209a\u02b0\u2090\u209b\u2091 \u2248 1.732 \u00d7 V\u209a\u02b0\u2090\u209b\u2091</li>' +
        '<li>Delta: V\u2097\u1d62\u2099\u2091 = V\u209a\u02b0\u2090\u209b\u2091</li>' +
        '<li>Example: 208V Wye \u2192 phase voltage = 208/1.732 \u2248 120V</li></ul>' +
        '</div>' +
        '<button class="btn btn-outline-red" onclick="window.print()">\uD83D\uDDA8\uFE0F Print Formula Sheet</button>' +
        '</div>'
    },

    symbols: {
      title: 'Electrical Symbol Glossary',
      body: function () {
        return '<div id="ref-symbol-glossary-body" style="min-height:200px;"><div style="color:#999;font-style:italic;padding:24px;">Loading symbols...</div></div>';
      }
    },

    standards: {
      title: 'Standards Overview \u2014 Workplace vs. NFPA 70E',
      body: '<div class="ref-table-wrap">' +
        '<p>The two standards used in ArcReady differ in scope and terminology.</p>' +
        '<table class="ref-table"><thead><tr><th>Topic</th><th>Workplace Standards</th><th>NFPA 70E 2024</th></tr></thead><tbody>' +
        '<tr><td><strong>PPE Term</strong></td><td>Hazard Risk Category (HRC)</td><td>Arc Flash PPE Category</td></tr>' +
        '<tr><td><strong>Pass Threshold</strong></td><td>100% (Safety); 85% (Theory)</td><td>100% (Safety); 85% (Theory)</td></tr>' +
        '<tr><td><strong>LOTO Name</strong></td><td>LOTOTO (Lockout/Tagout/Tryout)</td><td>LOTO (Lockout/Tagout)</td></tr>' +
        '<tr><td><strong>Energized Work Limit</strong></td><td>&gt; 40 cal/cm&sup2; prohibited</td><td>&gt; 40 cal/cm&sup2; prohibited (Art. 130)</td></tr>' +
        '<tr><td><strong>Glove Test Interval</strong></td><td>Every 6 months (ASTM D120)</td><td>Every 6 months (ASTM D120)</td></tr>' +
        '<tr><td><strong>Qualified Person</strong></td><td>Trained &amp; demonstrated competency per HECP</td><td>NFPA 70E Art. 100 definition</td></tr>' +
        '<tr><td><strong>Arc Flash Boundary</strong></td><td>Point where incident energy = 1.2 cal/cm&sup2;</td><td>Same \u2014 per IEEE 1584 study or PPE table</td></tr>' +
        '</tbody></table>' +
        '<p class="ref-note">Use the standard selector on the Safety/Theory tabs to switch your study mode.</p>' +
        '</div>'
    }
  };

  /* ============================================================
     INITIAL STATE
     ============================================================ */
  // Show home tab by default (already handled by CSS active class in HTML)
  // Progress bar will be updated by TestEngine after banks load

  /* ============================================================
     HOME DASHBOARD CERT STATUS UPDATE
     ============================================================ */
  function updateHomeDashboard() {
    var safetyCert = localStorage.getItem('arcready_safety_certified') === 'true';
    var theoryCert = localStorage.getItem('arcready_theory_certified') === 'true';
    var safetyHist = [];
    var theoryHist = [];
    try { safetyHist = JSON.parse(localStorage.getItem('arcready_safety_history') || '[]'); } catch (e) { }
    try { theoryHist = JSON.parse(localStorage.getItem('arcready_theory_history') || '[]'); } catch (e) { }

    // Safety badge
    var sb = document.getElementById('safety-cert-badge');
    var sn = document.getElementById('cert-step-num-1');
    if (sb) {
      if (safetyCert) {
        sb.textContent = 'CERTIFIED \u2713'; sb.style.background = '#2E7D32'; sb.style.color = '#fff';
        if (sn) sn.style.background = '#2E7D32';
      } else if (safetyHist.length > 0) {
        sb.textContent = 'In Progress'; sb.style.background = '#e6a800'; sb.style.color = '#fff';
      } else {
        sb.textContent = 'Not Started'; sb.style.background = '#f5f5f5'; sb.style.color = '#666';
      }
    }

    // Theory badge
    var tb = document.getElementById('theory-cert-badge');
    var tn = document.getElementById('cert-step-num-2');
    var tl = document.getElementById('theory-home-lock');
    var ti = document.getElementById('theory-card-icon');
    var conn1 = document.getElementById('connector-1');
    if (tb) {
      if (theoryCert) {
        tb.textContent = 'CERTIFIED \u2713'; tb.style.background = '#2E7D32'; tb.style.color = '#fff';
        if (tn) tn.style.background = '#2E7D32';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '\u2713';
        if (conn1) conn1.style.background = '#2E7D32';
      } else if (!safetyCert) {
        tb.textContent = 'Locked'; tb.style.background = '#f5f5f5'; tb.style.color = '#999';
        if (tl) tl.style.display = '';
      } else if (theoryHist.length > 0) {
        tb.textContent = 'In Progress'; tb.style.background = '#e6a800'; tb.style.color = '#fff';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '\uD83D\uDCD6';
      } else {
        tb.textContent = 'Available'; tb.style.background = '#0056b3'; tb.style.color = '#fff';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '\uD83D\uDCD6';
        if (conn1) conn1.style.background = '#CC0000';
      }
    }

    // Complete badge
    var cb = document.getElementById('complete-cert-badge');
    var cn = document.getElementById('cert-step-num-3');
    var conn2 = document.getElementById('connector-2');
    if (cb) {
      if (theoryCert) {
        cb.textContent = 'COMPLETE! \uD83C\uDF89'; cb.style.background = '#2E7D32'; cb.style.color = '#fff';
        if (cn) cn.style.background = '#2E7D32';
        if (conn2) conn2.style.background = '#2E7D32';
      } else if (safetyCert) {
        cb.textContent = 'Almost There'; cb.style.background = '#e6a800'; cb.style.color = '#fff';
        if (conn2) conn2.style.background = '#e6a800';
      } else {
        cb.textContent = 'Pending'; cb.style.background = '#f5f5f5'; cb.style.color = '#666';
      }
    }
  }

  ArcReady.updateHomeDashboard = updateHomeDashboard;
  updateHomeDashboard();

  // Also update when cert status changes (fired by test-engine after exam results saved)
  document.addEventListener('certificationUpdated', updateHomeDashboard);
  // Also update when switching to home tab
  var origShowTab = ArcReady.showTab;
  ArcReady.showTab = function (tabName) {
    origShowTab(tabName);
    if (tabName === 'home') updateHomeDashboard();
  };

}());

// Dual-standard: re-render dynamic content on standard change
document.addEventListener('standardChanged', function () {
  if (window.ArcReady && window.ArcReady.renderAll) window.ArcReady.renderAll();
});
