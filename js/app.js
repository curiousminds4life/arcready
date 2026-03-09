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

  function showTab(tabName, skipHash) {
    tabButtons.forEach(function (btn) {
      var active = btn.getAttribute('data-tab') === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    tabSections.forEach(function (sec) {
      sec.classList.toggle('active', sec.id === 'tab-' + tabName);
    });
    window.scrollTo(0, 0);
    if (!skipHash) {
      window.location.hash = tabName;
    }

    // Move Quick Launch into the active tab section
    var quickLaunch = document.querySelector('.global-quick-start');
    var activeSection = document.getElementById('tab-' + tabName);
    if (quickLaunch && activeSection) {
      activeSection.appendChild(quickLaunch);
    }

    // Update Page Title
    var tabTitles = {
      'home': 'Home',
      'safety': 'Safety Training',
      'theory': 'Theory Study',
      'lab': 'Virtual Lab',
      'reference': 'Reference',
      'progress': 'My Progress'
    };
    document.title = 'ArcReady — ' + (tabTitles[tabName] || 'Electrical Safety');

    if (tabName === 'progress' && ArcReady.Progress) ArcReady.Progress.render();
  }

  ArcReady.showTab = showTab;

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showTab(btn.getAttribute('data-tab'));
      // Close mobile menu on selection
      var navInner = document.querySelector('.nav-inner');
      if (navInner) navInner.classList.remove('nav-active');
    });
  });

  /* ============================================================
     MOBILE NAV TOGGLE
     ============================================================ */
  var navToggle = document.getElementById('nav-toggle');
  var navInner = document.querySelector('.nav-inner');
  if (navToggle && navInner) {
    navToggle.addEventListener('click', function () {
      navInner.classList.toggle('nav-active');
    });
  }

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

    // Close mobile menu if open
    var navInner = document.querySelector('.nav-inner');
    if (navInner) navInner.classList.remove('nav-active');
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
    // Hook: render standards-based content
    if (ArcReady.renderAll) {
      ArcReady.renderAll();
    }
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
      title: 'Approach Boundaries',
      body: '<div id="approach-boundaries-table" class="ref-table-wrap"><p class="ref-note">Loading boundary data...</p></div>'
    },

    hrc: {
      title: 'PPE Categories',
      body: '<div id="ppe-categories-table" class="ref-table-wrap"><p class="ref-note">Loading PPE data...</p></div>'
    },

    loto: {
      title: 'LOTO Procedure',
      body: '<div id="loto-steps-container" class="loto-steps"><p class="ref-note">Loading LOTO data...</p></div>'
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
      title: 'Standards Overview — Workplace vs. NFPA 70E',

      body: '<div class="ref-table-wrap">' +
        '<p>The two standards used in ArcReady differ in scope and terminology.</p>' +
        '<table class="ref-table"><thead><tr><th>Topic</th><th>Workplace Standards</th><th>NFPA 70E 2024</th></tr></thead><tbody>' +
        '<tr><td><strong>PPE Term</strong></td><td>Hazard Risk Category (HRC)</td><td>Arc Flash PPE Category</td></tr>' +
        '<tr><td><strong>Pass Threshold</strong></td><td>100% (Safety); 85% (Theory)</td><td>100% (Safety); 85% (Theory)</td></tr>' +
        '<tr><td><strong>LOTO Name</strong></td><td>LOTOTO (Lockout/Tagout/Tryout)</td><td>LOTO (Lockout/Tagout)</td></tr>' +
        '<tr><td><strong>Energized Work Limit</strong></td><td>&gt; 40 cal/cm&sup2; prohibited</td><td>&gt; 40 cal/cm&sup2; prohibited (Art. 130)</td></tr>' +
        '<tr><td><strong>Glove Test Interval</strong></td><td>Every 6 months (ASTM D120)</td><td>Every 6 months (ASTM D120)</td></tr>' +
        '<tr><td><strong>Qualified Person</strong></td><td>Trained &amp; demonstrated competency per HECP</td><td>NFPA 70E Art. 100 definition</td></tr>' +
        '<tr><td><strong>Arc Flash Boundary</strong></td><td>Point where incident energy = 1.2 cal/cm&sup2;</td><td>Same — per IEEE 1584 study or PPE table</td></tr>' +

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
        sb.textContent = 'CERTIFIED ✓'; sb.style.background = '#2E7D32'; sb.style.color = '#fff';

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
        tb.textContent = 'CERTIFIED ✓'; tb.style.background = '#2E7D32'; tb.style.color = '#fff';
        if (tn) tn.style.background = '#2E7D32';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '✓';

        if (conn1) conn1.style.background = '#2E7D32';
      } else if (!safetyCert) {
        tb.textContent = 'Locked'; tb.style.background = '#f5f5f5'; tb.style.color = '#999';
        if (tl) tl.style.display = '';
      } else if (theoryHist.length > 0) {
        tb.textContent = 'In Progress'; tb.style.background = '#e6a800'; tb.style.color = '#fff';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '📖';
      } else {
        tb.textContent = 'Available'; tb.style.background = '#0056b3'; tb.style.color = '#fff';
        if (tl) tl.style.display = 'none';
        if (ti) ti.textContent = '📖';

        if (conn1) conn1.style.background = '#CC0000';
      }
    }

    // Complete badge
    var cb = document.getElementById('complete-cert-badge');
    var cn = document.getElementById('cert-step-num-3');
    var conn2 = document.getElementById('connector-2');
    if (cb) {
      if (theoryCert) {
        cb.textContent = 'COMPLETE! 🎉'; cb.style.background = '#2E7D32'; cb.style.color = '#fff';

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

  // Handle Deep-Linking and Navigation
  function handleHash() {
    var hash = window.location.hash.substring(1);
    var validTabs = ['home', 'safety', 'theory', 'lab', 'reference', 'progress'];
    if (validTabs.indexOf(hash) >= 0) {
      showTab(hash, true);
    } else if (!hash) {
      showTab('home', true);
    }
  }

  window.addEventListener('hashchange', handleHash);
  handleHash(); // Run on load

}());

// Dual-standard: re-render dynamic content on standard change
document.addEventListener('standardChanged', function () {
  if (window.ArcReady && window.ArcReady.renderAll) window.ArcReady.renderAll();
});
