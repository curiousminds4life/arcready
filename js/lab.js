/* lab.js -- ArcReady Virtual Troubleshooting Lab
 * Two-probe multimeter state machine + SVG circuit injection
 * Depends on: svg-circuits.js (ArcReady.SVGCircuits, ArcReady.CircuitData)
 */
(function () {
  'use strict';
  var ArcReady = window.ArcReady = window.ArcReady || {};

  // BUG 2 FIX: hoist these to module scope so loadCircuit() can reference them
  var voltSwitch = null;
  var motorSw = null;

  // -- State -------------------------------------------------------------------
  var state = {
    circuit: null,   // current circuit id
    fault: 'normal',
    probeRed: null,   // TP number (int)
    probeBlack: null,
    probeStep: 0,      // 0=none,1=red placed,2=both placed
    mode: 'guided',  // 'guided'|'challenge'
    challenge: {
      active: false,
      fault: null,
      probes: 0,
      maxProbes: 8,
      score: 0
    },
    readings: []      // history [{red,black,value}]
  };

  // -- Guided hints per fault per circuit -------------------------------------
  var HINTS = {
    'circuit-a': {
      normal: 'System normal. All three phases present throughout. Transformer secondary reads 120V and 24V.',
      'f1-blown': 'F1 fuse is blown. L1 phase is lost. Check TP1-TP4: expect 277V before fuse, 0V after. Motor cannot start.',
      'f2-blown': 'F2 fuse is blown. L2 phase is lost. Check TP2-TP5: expect voltage before fuse, 0V after fuse.',
      'f3-blown': 'F3 fuse is blown. L3 phase is lost. Check TP3-TP6: expect voltage before fuse, 0V after fuse.',
      'ms-open': 'Motor Starter (MS) contacts are open. Voltage present through fuses but 0V after MS contacts (TP7-TP10).',
      'ol-tripped': 'Overload relay tripped. Voltage present through MS contacts but 0V at motor terminals. OL heaters show continuity path broken.'
    },
    'circuit-b': {
      normal: 'All branches energized. Each test point should read 120V to neutral (TP7).',
      'sw-a-open': 'Switch A is open. TP2 will read 0V to neutral while all other branches remain 120V.',
      'sw-b-open': 'Switch B is open. TP3 will read 0V to neutral.',
      'sw-c-open': 'Switch C is open. TP5 will read 0V to neutral (capacitor branch).',
      'sw-d-open': 'Switch D is open. TP6 will read 0V to neutral (MS coil de-energized).'
    },
    'circuit-practice': {
      normal: 'System normal. 208V across any two phases, 120V phase-to-neutral, 24V transformer secondary.',
      'f1-blown': 'F1 blown: TP4 reads 0V to neutral. TP4-TP5 reads reduced (backfeed ~120V). Motor cannot run.',
      'f2-blown': 'F2 blown: TP5 reads 0V to neutral. L2 phase lost at that point.',
      'f3-blown': 'F3 blown: TP6 reads 0V to neutral. L3 phase lost.',
      'ms-open': 'MS contacts open. Full voltage across fuse outputs but 0V downstream of MS (TP7-TP10).',
      'ol-tripped': 'Overload tripped. Voltage through MS contacts but motor terminals isolated. Check TP8-TP10 vs TP7-TP10.'
    },
    'circuit-d': {
      normal: 'System normal. 24VDC across TP1-TP7. Sensors S1 and S2 are open; CR1 and PL1 are de-energized.',
      'ps-fail': 'Power Supply failure. 0V at output (TP1). Check input power or PSU fuse.',
      's1-stuck': 'Sensor 1 stuck closed. CR1 and PL1 are energized even without detection. Terminal TP2 reads 24V.',
      's2-open': 'Sensor 2 circuit open. Even if S2 detects, TP3 remains 0V. Check wiring or sensor contacts.',
      'lamp-blown': "Indicator Lamp PL1 is blown. CR1 contact (TP5-TP6) closes 24V correctly, but lamp doesn't light."
    }
  };

  // -- DOM refs ---------------------------------------------------------------
  function $id(id) { return document.getElementById(id); }

  // -- Init -------------------------------------------------------------------
  ArcReady.initLab = function () {
    // Circuit selector
    var circSelect = $id('circuit-select');
    if (circSelect) {
      circSelect.addEventListener('change', function () {
        loadCircuit(this.value);
      });
    }
    // Load first circuit on init
    if (circSelect && circSelect.value) {
      loadCircuit(circSelect.value);
    }

    // BUG 2 FIX: assign to module-scope vars so loadCircuit() can reach them
    voltSwitch = $id('voltage-switch');
    var voltContainer = $id('voltage-switch-container');
    if (voltSwitch) {
      voltSwitch.addEventListener('change', function () {
        state.voltageSwitch = this.value;

        // Update title to match voltage
        var titleEl = $id('circuit-title');
        if (titleEl && state.circuit === 'circuit-a') {
          titleEl.textContent = 'Circuit A - ' + this.value + ' 3-Phase Motor Control';
        }

        if (state.circuit !== 'circuit-a') {
          voltContainer.style.display = 'none';
          var localMotorSw = $id('motor-switch');
          var motorC = $id('motor-switch-container');
          if (localMotorSw) localMotorSw.value = 'closed';
          if (motorC) motorC.style.display = 'none';
        } else {
          voltContainer.style.display = 'flex';
        }
        // Recalculate readings if probes placed
        if (state.probeStep === 2) {
          var reading = getReading(state.fault, state.probeRed, state.probeBlack);
          displayReading(reading);
          triggerPulseAnimation();
        }
        renderTruthTable();
      });
    }

    // BUG 2 FIX: assign to module-scope var
    motorSw = $id('motor-switch');
    var motorContainer = $id('motor-switch-container');
    if (motorSw) {
      motorSw.addEventListener('change', function () {
        state.motorSwitch = this.value;
        if (state.circuit !== 'circuit-a') {
          motorContainer.style.display = 'none';
          if (voltSwitch) voltSwitch.value = '480V';
          if (voltContainer) voltContainer.style.display = 'none';
        } else {
          motorContainer.style.display = 'flex';
        }
        // Recalculate readings if probes placed
        if (state.probeStep === 2) {
          var reading = getReading(state.fault, state.probeRed, state.probeBlack);
          displayReading(reading);
          triggerPulseAnimation();
        }
        renderTruthTable();
      });
    }

    // Fault buttons (delegated on fault-controls container)
    var fc = $id('fault-controls');
    if (fc) {
      fc.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-fault]');
        if (!btn || state.challenge.active) return;
        setFault(btn.dataset.fault, true); // Keep probes on fault change
        fc.querySelectorAll('[data-fault]').forEach(function (b) { b.classList.toggle('active', b === btn); });
      });
    }

    // Mode buttons (id-based + data-lab-mode fallback)
    var btnGuided = $id('btn-mode-guided');
    var btnChallenge = $id('btn-mode-challenge');
    if (btnGuided) btnGuided.addEventListener('click', function () { setMode('guided'); });
    if (btnChallenge) btnChallenge.addEventListener('click', function () { setMode('challenge'); });
    // Also wire data-lab-mode buttons
    document.querySelectorAll('[data-lab-mode]').forEach(function (btn) {
      if (btn.id) return; // already handled by id
      btn.addEventListener('click', function () { setMode(btn.dataset.labMode); });
    });

    // Challenge submit
    var sub = $id('challenge-submit');
    if (sub) sub.addEventListener('click', submitChallenge);

    // Reset probe button
    var rst = $id('probe-reset');
    if (rst) rst.addEventListener('click', resetProbes);

    // Clear history
    var clrH = $id('clear-history');
    if (clrH) clrH.addEventListener('click', function () { state.readings = []; renderHistory(); });
  };

  // -- Load circuit -----------------------------------------------------------
  function loadCircuit(id) {
    if (!ArcReady.SVGCircuits || !ArcReady.SVGCircuits[id]) return;
    state.circuit = id;
    state.fault = 'normal';
    resetProbes();
    state.readings = [];

    // Show/hide switches based on circuit
    var voltC = $id('voltage-switch-container');
    var motorC = $id('motor-switch-container');
    if (id === 'circuit-a') {
      if (voltC) voltC.style.display = 'flex';
      if (motorC) motorC.style.display = 'flex';
    } else {
      if (voltC) voltC.style.display = 'none';
      if (motorC) motorC.style.display = 'none';
      // BUG 2 FIX: voltSwitch and motorSw are now accessible here (module scope)
      if (voltSwitch) voltSwitch.value = '480V';
      if (motorSw) motorSw.value = 'closed';
    }

    // Inject SVG
    var wrap = $id('circuit-svg-container');
    if (wrap) {
      wrap.innerHTML = ArcReady.SVGCircuits[id].svg;
      var svg = wrap.querySelector('svg');
      if (svg) { svg.style.width = '100%'; svg.style.maxWidth = '920px'; svg.style.height = 'auto'; }
      attachTestPointListeners(wrap);
    }

    // Update Title
    var titleEl = $id('circuit-title');
    if (titleEl) {
      if (id === 'circuit-a') {
        var v = $id('voltage-switch').value || '480V';
        titleEl.textContent = 'Circuit A - ' + v + ' 3-Phase Motor Control';
      } else if (ArcReady.CircuitData[id]) {
        titleEl.textContent = ArcReady.CircuitData[id].title;
      }
    }

    // Populate fault buttons
    renderFaultButtons(id);
    setFault('normal');
    renderHistory();
    renderTruthTable();

    if (state.mode === 'challenge') startChallenge();

    setInstruction('Circuit loaded. Click a test point to place the <span style="color:#CC0000;font-weight:bold">RED</span> probe.');
  }

  // -- Fault buttons ----------------------------------------------------------
  function renderFaultButtons(id) {
    var fc = $id('fault-controls');
    if (!fc) return;
    var faults = (ArcReady.CircuitData[id] || {}).faults || [];
    fc.innerHTML = faults.map(function (f) {
      return '<button class="fault-btn' + (f.id === 'normal' ? ' active' : '') + '" data-fault="' + f.id + '">' + f.label + '</button>';
    }).join('');
  }

  // -- Test point listeners ---------------------------------------------------
  function attachTestPointListeners(container) {
    var tps = container.querySelectorAll('.test-point');
    tps.forEach(function (el) {
      el.style.cursor = 'crosshair';
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        handleProbeClick(parseInt(el.dataset.tp, 10), el);
      });
      el.addEventListener('mouseenter', function () {
        if (!el.classList.contains('probe-red') && !el.classList.contains('probe-black')) {
          var origR = el.getAttribute('r');
          el.dataset.origR = origR;
          el.setAttribute('r', String(parseInt(origR || 10) + 3));
          el.style.filter = 'brightness(1.25)';
          showTooltip(el, 'TP' + el.dataset.tp);
        }
      });
      el.addEventListener('mouseleave', function () {
        if (el.dataset.origR) el.setAttribute('r', el.dataset.origR);
        el.style.filter = '';
        hideTooltip();
      });
    });
  }

  // -- Probe state machine ----------------------------------------------------
  function handleProbeClick(tpNum, el) {
    var container = $id('circuit-svg-container');
    if (!container) return;

    if (state.probeStep === 0) {
      // Place red probe
      state.probeRed = tpNum;
      state.probeBlack = null;
      state.probeStep = 1;
      clearProbeHighlights(container);
      el.classList.add('probe-red');
      el.setAttribute('fill', '#CC0000');
      el.setAttribute('stroke', '#900000');
      updateProbeDisplay();
      setInstruction('RED probe on <strong>TP' + tpNum + '</strong>. Now click a second test point for the <strong>BLACK</strong> probe.');

    } else if (state.probeStep === 1) {
      if (tpNum === state.probeRed) {
        // Same point -- reset
        resetProbes();
        setInstruction('Same point selected -- probes reset. Click a test point to place the <span style="color:#CC0000;font-weight:bold">RED</span> probe.');
        return;
      }
      // Place black probe
      state.probeBlack = tpNum;
      state.probeStep = 2;
      el.classList.add('probe-black');
      el.setAttribute('fill', '#222');
      el.setAttribute('stroke', '#000');
      if (state.challenge.active) {
        state.challenge.probes++;
        var pleft = $id('challenge-probes-left');
        if (pleft) pleft.textContent = state.challenge.probes;
      }
      updateProbeDisplay();
      var reading = getReading(state.fault, state.probeRed, state.probeBlack);
      displayReading(reading);
      state.readings.unshift({ red: state.probeRed, black: state.probeBlack, value: reading, fault: state.fault });
      renderHistory();
      var hint = (HINTS[state.circuit] || {})[state.fault] || '';
      setInstruction('<strong>Reading: ' + reading + '</strong> (TP' + state.probeRed + ' to TP' + state.probeBlack + '). '
        + (state.mode === 'guided' && hint ? '<br><span style="color:#555;font-size:12px;">' + hint + '</span>' : '')
        + '<br><em style="font-size:11px;color:#888;">Click any test point to start a new measurement.</em>');

    } else {
      // Reset and start new
      resetProbes();
      handleProbeClick(tpNum, el);
    }
  }

  function resetProbes() {
    state.probeRed = null;
    state.probeBlack = null;
    state.probeStep = 0;
    var container = $id('circuit-svg-container');
    if (container) clearProbeHighlights(container);
    updateProbeDisplay();
    displayReading('--- ');
  }

  function clearProbeHighlights(container) {
    container.querySelectorAll('.test-point').forEach(function (el) {
      el.classList.remove('probe-red', 'probe-black');
      el.setAttribute('fill', '#FFD700');
      el.setAttribute('stroke', '#333');
      el.setAttribute('stroke-width', '2');
    });
  }

  // -- Voltage lookup ---------------------------------------------------------
  function getReading(fault, a, b) {
    var data = ArcReady.CircuitData[state.circuit];
    if (!data) return '0.0V AC';
    var tbl = data.readings[fault] || data.readings['normal'] || {};
    var k1 = 'TP' + a + '-TP' + b;
    var k2 = 'TP' + b + '-TP' + a;
    var raw = tbl[k1] || tbl[k2] || '0.0V AC';

    // Circuit A Voltage Scaling
    if (state.circuit === 'circuit-a' && state.voltageSwitch === '208V') {
      var val = parseFloat(raw);
      if (val === 480) return '208.0V AC';
      if (val === 277) return '120.0V AC';
      if (val === 120) return '120.0V AC'; // control tap 1
      if (val === 24) return '24.0V AC';  // control tap 2
      // Scale others by ratio (208/480 approx 0.433)
      return (val * 0.4333).toFixed(1) + 'V AC';
    }
    return raw;
  }

  // -- Truth Table Rendering --------------------------------------------------
  function renderTruthTable() {
    var container = $id('truth-table-container');
    var status = $id('truth-table-status');
    if (!container) return;

    var data = ArcReady.CircuitData[state.circuit];
    if (!data) return;

    // Use a subset of important TPs for the reference table to keep it readable
    var pairs = [];
    if (state.circuit === 'circuit-a') {
      pairs = [
        [1, 2], [1, 3], [2, 3], // Mains
        [4, 10], [5, 10], [6, 10], // Pre-MS vs GND
        [4, 5], [4, 6], [5, 6], // Ph-Ph pre-MS
        [7, 10], [8, 10], [9, 10], // Post-MS vs GND
        [11, 12], [13, 12] // Control
      ];
    } else if (state.circuit === 'circuit-practice') {
      pairs = [
        [1, 2], [1, 3], [2, 3],
        [4, 10], [5, 10], [6, 10],
        [4, 5], [5, 6],
        [7, 10], [8, 10], [9, 10],
        [11, 12]
      ];
    } else {
      pairs = [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]];
    }

    var html = '<table style="width:100%; border-collapse: collapse; font-size: 12px; font-family: monospace;">'
      + '<thead style="background:#f0f0f0;">'
      + '<tr><th style="padding:6px; border:1px solid #eee; text-align:left;">Test Points</th>'
      + '<th style="padding:6px; border:1px solid #eee; text-align:right;">Expected Value</th></tr></thead><tbody>';

    pairs.forEach(function (p) {
      var val = getReading(state.fault, p[0], p[1]);
      var isZero = parseFloat(val) === 0;
      var style = isZero ? 'color:#888;' : 'font-weight:bold; color:#0056b3;';
      html += '<tr>'
        + '<td style="padding:6px; border:1px solid #eee; color:#555;">TP' + p[0] + ' \u2192 TP' + p[1] + '</td>'
        + '<td style="padding:6px; border:1px solid #eee; text-align:right; ' + style + '">' + val + '</td>'
        + '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
    if (status) status.textContent = 'Mode: ' + (state.voltageSwitch || 'Default');
  }

  // -- Pulse animation for voltage updates ------------------------------------
  function triggerPulseAnimation() {
    var disp = $id('multimeter-reading');
    if (disp) {
      disp.classList.remove('voltage-update-pulse');
      void disp.offsetWidth;
      disp.classList.add('voltage-update-pulse');
      setTimeout(function () {
        disp.classList.remove('voltage-update-pulse');
      }, 300);
    }
  }

  function displayReading(val) {
    var disp = $id('multimeter-reading');
    var unit = $id('multimeter-unit');
    if (disp) {
      var num = parseFloat(val) || 0;
      var ustr = val.replace(/[0-9.\s]/g, '').trim() || 'V AC';
      disp.textContent = num.toFixed(1);
      if (unit) unit.textContent = ustr;
      if (num === 0) disp.style.color = '#888';
      else if (num < 30) disp.style.color = '#2E7D32';
      else if (num < 240) disp.style.color = '#00FF41';
      else disp.style.color = '#FF6B00';
    }
  }

  function updateProbeDisplay() {
    var r = $id('probe-red-value');
    var b = $id('probe-black-value');
    if (r) r.textContent = state.probeRed ? 'TP' + state.probeRed : '\u2014';
    if (b) b.textContent = state.probeBlack ? 'TP' + state.probeBlack : '\u2014';
  }

  function setInstruction(html) {
    var el = $id('lab-instruction-text');
    if (el) el.innerHTML = html;
  }

  // BUG 10 FIX: convert ES6 default parameter to ES5-compatible pattern
  function setFault(faultId, keepProbes) {
    if (keepProbes === undefined) keepProbes = true;
    state.fault = faultId;
    if (!keepProbes) resetProbes();
    var fc = $id('fault-controls');
    if (fc) fc.querySelectorAll('[data-fault]').forEach(function (b) {
      b.classList.toggle('active', b.dataset.fault === faultId);
    });
    var faultLabel = getFaultLabel(faultId);
    var isNormal = faultId === 'normal';
    var faultBadge = $id('current-fault-badge');
    if (faultBadge) {
      faultBadge.textContent = isNormal ? 'Normal Operation' : '\u26a0\ufe0f FAULT: ' + faultLabel;
      faultBadge.style.color = isNormal ? '#2E7D32' : '#CC0000';
    }
    renderTruthTable();
    setInstruction('Fault set to <strong>' + faultLabel + '</strong>. Click a test point to begin probing.');
  }

  function getFaultLabel(id) {
    var data = ArcReady.CircuitData[state.circuit];
    if (!data) return id;
    var f = (data.faults || []).find(function (x) { return x.id === id; });
    return f ? f.label : id;
  }

  // -- History ----------------------------------------------------------------
  function renderHistory() {
    var hist = $id('reading-history');
    if (!hist) return;
    if (!state.readings.length) {
      hist.innerHTML = '<div style="color:#999;font-style:italic;font-size:12px;padding:8px;">No measurements yet</div>';
      return;
    }
    hist.innerHTML = state.readings.slice(0, 20).map(function (r, i) {
      var col = parseFloat(r.value) === 0 ? '#888' : (parseFloat(r.value) < 240 ? '#2E7D32' : '#FF6B00');
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 8px;'
        + (i % 2 === 0 ? 'background:#F9F9F9;' : '') + 'border-radius:3px;font-size:12px;">'
        + '<span style="color:#555;">TP' + r.red + '\u2192TP' + r.black + '</span>'
        + '<span style="font-family:monospace;font-weight:bold;color:' + col + ';">' + r.value + '</span>'
        + '</div>';
    }).join('');
  }

  // -- Challenge mode ---------------------------------------------------------
  function setMode(m) {
    state.mode = m;
    var fc = $id('fault-controls');
    var cd = $id('challenge-panel');
    var btnG = $id('btn-mode-guided');
    var btnC = $id('btn-mode-challenge');
    if (btnG) { btnG.classList.toggle('active', m === 'guided'); btnG.classList.toggle('lab-mode-btn--active', m === 'guided'); }
    if (btnC) { btnC.classList.toggle('active', m === 'challenge'); btnC.classList.toggle('lab-mode-btn--active', m === 'challenge'); }
    if (m === 'challenge') {
      if (fc) fc.style.opacity = '0.3';
      if (cd) cd.style.display = 'block';
      startChallenge();
    } else {
      if (fc) fc.style.opacity = '1';
      if (cd) cd.style.display = 'none';
      state.challenge.active = false;
      setFault('normal');
    }
  }

  function startChallenge() {
    var data = ArcReady.CircuitData[state.circuit];
    if (!data) return;
    var faults = data.faults.filter(function (f) { return f.id !== 'normal'; });
    var picked = faults[Math.floor(Math.random() * faults.length)];
    state.challenge = {
      active: true,
      fault: picked.id,
      probes: 0,
      maxProbes: 8,
      score: 0
    };
    state.fault = picked.id;
    resetProbes();
    state.readings = [];
    renderHistory();
    var sel = $id('challenge-fault-select');
    if (sel) {
      sel.innerHTML = '<option value="">-- Select your diagnosis --</option>'
        + data.faults.map(function (f) {
          return '<option value="' + f.id + '">' + f.label + '</option>';
        }).join('');
    }
    var badge = $id('challenge-probes-left');
    if (badge) badge.textContent = state.challenge.maxProbes;
    setInstruction('<strong>\uD83D\uDD34 Challenge Mode Active!</strong> A random fault has been injected. Use your multimeter to diagnose the problem. You have <strong>' + state.challenge.maxProbes + '</strong> probe touches. Then submit your diagnosis.');
    var fb = $id('current-fault-badge');
    if (fb) { fb.textContent = '\u2753 Unknown Fault'; fb.style.color = '#F57C00'; }
    // AI: inject hint UI into challenge panel
    (function () {
      var cp = document.getElementById('challenge-panel');
      if (!cp) return;
      var ob = document.getElementById('ai-hint-btn');
      var op = document.getElementById('ai-hint-panel');
      if (ob) ob.parentNode.removeChild(ob);
      if (op) op.parentNode.removeChild(op);
      var hintPanel = document.createElement('div');
      hintPanel.id = 'ai-hint-panel';
      var hintBtn = document.createElement('button');
      hintBtn.id = 'ai-hint-btn';
      hintBtn.className = 'btn btn-secondary';
      hintBtn.innerHTML = '&#x1F916; Get Hint <span class="ai-hint-counter">(3 left, -10 pts each)</span>';
      var submitBtn = document.getElementById('challenge-submit');
      if (submitBtn) {
        cp.insertBefore(hintPanel, submitBtn);
        cp.insertBefore(hintBtn, submitBtn);
      } else {
        cp.appendChild(hintPanel);
        cp.appendChild(hintBtn);
      }
      if (window.ArcReady && ArcReady.AI) {
        if (ArcReady.AI.resetLabHints) ArcReady.AI.resetLabHints();
        else if (ArcReady.AI.initLabHint) ArcReady.AI.initLabHint();
      }
    }());
  }

  function submitChallenge() {
    var sel = $id('challenge-fault-select');
    var res = $id('challenge-result');
    if (!sel || !res) return;
    var guess = sel.value;
    if (!guess) { res.innerHTML = '<span style="color:#F57C00;">Please select a diagnosis first.</span>'; return; }
    var correct = guess === state.challenge.fault;
    var probesUsed = state.challenge.probes;
    var maxP = state.challenge.maxProbes;
    var score = correct ? Math.max(0, Math.round(100 - (probesUsed / maxP) * 60)) : 0;
    res.innerHTML = correct
      ? '<span style="color:#2E7D32;font-weight:bold;">\u2713 CORRECT! ' + getFaultLabel(state.challenge.fault) + ' identified. Score: ' + score + '/100 (' + probesUsed + ' probes used)</span>'
      : '<span style="color:#CC0000;font-weight:bold;">\u2717 Incorrect. The fault was: ' + getFaultLabel(state.challenge.fault) + '</span>';
    try {
      var hist = JSON.parse(localStorage.getItem('arcready_lab_scores') || '[]');
      hist.unshift({ circuit: state.circuit, fault: state.challenge.fault, guess: guess, correct: correct, score: score, date: new Date().toISOString() });
      localStorage.setItem('arcready_lab_scores', JSON.stringify(hist.slice(0, 50)));
    } catch (e) { }
    var fb = $id('current-fault-badge');
    if (fb) { fb.textContent = 'Fault was: ' + getFaultLabel(state.challenge.fault); fb.style.color = '#CC0000'; }
    state.challenge.active = false;
    var fc = $id('fault-controls');
    if (fc) fc.style.opacity = '1';
    setTimeout(function () {
      var restart = $id('challenge-restart');
      if (restart) restart.style.display = 'inline-block';
    }, 400);
  }

  // -- Tooltip ----------------------------------------------------------------
  var _tt = null;
  function showTooltip(el, text) {
    hideTooltip();
    _tt = document.createElement('div');
    _tt.style.cssText = 'position:fixed;background:#1A1A1A;color:#FFD700;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:bold;pointer-events:none;z-index:9999;white-space:nowrap;';
    _tt.textContent = text;
    document.body.appendChild(_tt);
    var r = el.getBoundingClientRect();
    _tt.style.left = (r.left + r.width / 2 - _tt.offsetWidth / 2) + 'px';
    _tt.style.top = (r.top - 28) + 'px';
  }
  function hideTooltip() { if (_tt) { _tt.remove(); _tt = null; } }

  // -- Expose lab state for AI hint system ------------------------------------
  ArcReady._labState = function () {
    return {
      circuit: state.circuit,
      fault: state.fault,
      mode: state.mode,
      probes: state.challenge ? state.challenge.probes : 0,
      readings: state.readings || []
    };
  };

  // -- Auto-init when DOM ready -----------------------------------------------
  function domReady(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  domReady(function () {
    if ($id('circuit-select') || $id('circuit-svg-container')) {
      ArcReady.initLab();
    }
    var restart = $id('challenge-restart');
    if (restart) {
      restart.addEventListener('click', function () {
        this.style.display = 'none';
        var res = $id('challenge-result');
        if (res) res.innerHTML = '';
        startChallenge();
      });
    }
  });

}());
