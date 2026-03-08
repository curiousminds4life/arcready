
/* ================================================================
   ArcReady AI Assistant — ai-assistant.js
   Provides: Answer Explainer, Study Chat, Lab Hints, Weak Area Coach
   ================================================================ */
(function () {
  'use strict';

  window.ArcReady = window.ArcReady || {};

  /* -- Config & State ------------------------------------------ */
  var cfg = null;            // loaded from data/ai-config.json
  var chatHistory = [];      // [{role,content}] for study chat
  var chatTurns = 0;
  var labHintsUsed = 0;
  var labHintPenalty = 0;   // cumulative score penalty

  /* -- Utility: simple hash for cache key ----------------------- */
  function hashStr(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    }
    return 'ai_' + Math.abs(h).toString(36);
  }

  /* -- Session-storage cache ------------------------------------ */
  function getCached(key) {
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (Date.now() > obj.exp) { sessionStorage.removeItem(key); return null; }
      return obj.val;
    } catch (e) { return null; }
  }

  function setCached(key, val, ttlMs) {
    try {
      sessionStorage.setItem(key, JSON.stringify({ val: val, exp: Date.now() + (ttlMs || 3600000) }));
    } catch (e) {/* quota -- ignore */ }
  }

  /* -- Active standard helper ----------------------------------- */
  function getStandardCtx() {
    var id = localStorage.getItem('arcready_standard') || 'workplace';
    return id === 'nfpa' ? 'NFPA 70E 2024 national standard' : 'Workplace / SGOP safety standards';
  }

  /* -- Core API call -------------------------------------------- */
  function callAI(feature, messages, callback) {
    if (!cfg || !cfg.enabled) { callback(null, 'AI not configured'); return; }

    var model = (cfg.models || {})[feature] || 'meta-llama/llama-3.1-8b-instruct:free';
    var maxTokens = (cfg.limits || {})['max_tokens_' + feature] || 150;
    var sysPr = (cfg.system_prompts || {})[feature] || '';

    // Build full messages array with system prompt
    var fullMessages = [];
    if (sysPr) fullMessages.push({ role: 'system', content: sysPr });
    fullMessages = fullMessages.concat(messages);

    var body = JSON.stringify({
      model: model,
      max_tokens: maxTokens,
      messages: fullMessages
    });

    var cacheKey = hashStr(body);
    var cached = getCached(cacheKey);
    if (cached) { callback(cached, null); return; }

    var url, headers;

    if (cfg.dev_mode && cfg.dev_openrouter_key) {
      // Direct OpenRouter call (localhost dev only)
      url = 'https://openrouter.ai/api/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.dev_openrouter_key,
        'HTTP-Referer': 'https://arcready.net',
        'X-Title': 'ArcReady Training'
      };
    } else if (!cfg.dev_mode) {
      // Production: route through PHP proxy
      url = cfg.proxy_url || 'ai-proxy.php';
      headers = { 'Content-Type': 'application/json' };
    } else {
      // dev_mode true but no key set -- silently skip
      console.error('[ArcReady AI] dev_mode=true but no key set in ai-config.json'); callback(null, 'no_key');
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    Object.keys(headers).forEach(function (k) { xhr.setRequestHeader(k, headers[k]); });
    xhr.timeout = 20000;

    xhr.onload = function () {
      try {
        var data = JSON.parse(xhr.responseText);
        var text = data.choices && data.choices[0] && data.choices[0].message
          ? data.choices[0].message.content.trim()
          : null;
        if (text) {
          setCached(cacheKey, text);
          callback(text, null);
        } else {
          console.error('[ArcReady AI] Empty response. Status:', xhr.status, 'Data:', JSON.stringify(data).substring(0, 200)); callback(null, 'empty_response');
        }
      } catch (e) {
        console.error('[ArcReady AI] Parse error. Status:', xhr.status, 'Response:', xhr.responseText.substring(0, 200)); callback(null, 'parse_error');
      }
    };
    xhr.onerror = function () { console.error('[ArcReady AI] Network error calling', url); callback(null, 'network_error'); };
    xhr.ontimeout = function () { console.error('[ArcReady AI] Request timed out calling', url); callback(null, 'timeout'); };
    console.log('[ArcReady AI] Calling', url, 'model:', model); xhr.send(body);
  }

  /* ================================================================
     FEATURE 1: AI ANSWER EXPLAINER
     Called from test-engine.js after wrong answer reveal
     ================================================================ */
  function explainAnswer(questionText, correctAnswer, userAnswer, expElId) {
    var expEl = document.getElementById(expElId);
    if (!expEl) return;

    // Remove any existing explain wrapper
    var existing = expEl.querySelector('.ai-explain-wrapper');
    if (existing) existing.parentNode.removeChild(existing);

    // Create wrapper with button
    var wrapper = document.createElement('div');
    wrapper.className = 'ai-explain-wrapper';

    var btn = document.createElement('button');
    btn.className = 'btn-explain-ai';
    btn.innerHTML = '&#x1F916; Explain This';
    btn.setAttribute('aria-label', 'Get AI explanation for this answer');

    var panel = document.createElement('div');
    panel.className = 'ai-explain-panel';
    panel.style.display = 'none';

    wrapper.appendChild(btn);
    wrapper.appendChild(panel);
    expEl.appendChild(wrapper);

    btn.addEventListener('click', function () {
      if (panel.style.display !== 'none') {
        panel.style.display = 'none';
        btn.innerHTML = '&#x1F916; Explain This';
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '&#x1F916; <span class="ai-loading-dots"><span></span><span></span><span></span></span>';
      panel.style.display = 'block';
      panel.innerHTML = '<div class="ai-explain-header"><span class="ai-badge">AI</span> Loading explanation&hellip;</div>';

      var std = getStandardCtx();
      var prompt = 'Question: ' + questionText + '\n' +
        'Student answered: ' + userAnswer + '\n' +
        'Correct answer: ' + correctAnswer + '\n' +
        'Context: ' + std + '\n' +
        'Explain why the correct answer is right in 2-3 sentences.';

      callAI('explain', [{ role: 'user', content: prompt }], function (text, err) {
        btn.disabled = false;
        btn.innerHTML = '&#x1F916; Hide Explanation';
        if (text) {
          panel.innerHTML =
            '<div class="ai-explain-header"><span class="ai-badge">AI</span> Instructor Explanation</div>' +
            '<p>' + escHtml(text) + '</p>';
        } else {
          panel.innerHTML =
            '<div class="ai-explain-header"><span class="ai-badge">AI Error</span></div>' +
            '<p>We encountered an issue generating the explanation. Please check your config API keys.</p>';
        }
      });
    });
  }

  /* ================================================================
     FEATURE 2: FLOATING STUDY ASSISTANT
     Chat bubble UI management
     ================================================================ */
  function initChat() {
    var bubble = document.getElementById('ai-chat-bubble');
    var toggle = document.getElementById('ai-chat-toggle');
    var input = document.getElementById('ai-chat-input');
    var sendBtn = document.getElementById('ai-chat-send');
    var msgs = document.getElementById('ai-chat-messages');
    var limitB = document.getElementById('ai-chat-limit-banner');

    if (!bubble || !toggle) return;

    // Toggle open/close
    toggle.addEventListener('click', function () {
      bubble.classList.toggle('is-open');
      if (bubble.classList.contains('is-open') && msgs && msgs.children.length === 0) {
        addBotMsg('Hi! I\'m your ArcReady study assistant. Ask me anything about electrical safety, arc flash, LOTO, or circuit theory. \u26A1');
      }
      if (bubble.classList.contains('is-open') && input) {
        setTimeout(function () { input.focus(); }, 200);
      }
    });

    // Send on button click or Enter key
    if (sendBtn) {
      sendBtn.addEventListener('click', function () { sendChat(); });
    }
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
      });
    }

    function sendChat() {
      if (!input || !msgs) return;
      var text = input.value.trim();
      if (!text) return;

      if (chatTurns >= ((cfg && cfg.limits && cfg.limits.max_chat_turns) || 5)) {
        showLimitBanner();
        return;
      }

      input.value = '';
      addUserMsg(text);

      if (sendBtn) sendBtn.disabled = true;

      var loadingEl = addBotMsg('<span class="ai-loading-dots"><span></span><span></span><span></span></span>', true);

      var std = getStandardCtx();
      chatHistory.push({ role: 'user', content: text });

      // Build context-aware messages
      var contextMsg = 'Active training standard context: ' + std + '. ';
      var messages = [{ role: 'user', content: contextMsg + text }];
      // Include recent history (last 6 turns)
      if (chatHistory.length > 1) {
        messages = chatHistory.slice(-6).map(function (m) {
          return { role: m.role, content: m.role === 'user' && m === chatHistory[chatHistory.length - 1] ? contextMsg + m.content : m.content };
        });
      }

      callAI('chat', messages, function (reply, err) {
        if (sendBtn) sendBtn.disabled = false;
        if (loadingEl && loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);

        if (reply) {
          chatHistory.push({ role: 'assistant', content: reply });
          chatTurns++;
          addBotMsg(reply);
          if (chatTurns >= ((cfg && cfg.limits && cfg.limits.max_chat_turns) || 5)) {
            showLimitBanner();
          }
        } else {
          chatHistory.pop();
          addBotMsg('Sorry, I couldn\'t reach the AI service. Please try again. If this persists, use the Study Mode tabs instead.');
        }
        if (msgs) msgs.scrollTop = msgs.scrollHeight;
      });
    }

    function addUserMsg(text) {
      if (!msgs) return;
      var d = document.createElement('div');
      d.className = 'ai-msg ai-msg--user';
      d.textContent = text;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function addBotMsg(html, isTemp) {
      if (!msgs) return null;
      var d = document.createElement('div');
      d.className = 'ai-msg ai-msg--bot';
      d.innerHTML = html;
      if (isTemp) d.setAttribute('data-temp', '1');
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    }

    function showLimitBanner() {
      if (!limitB) return;
      limitB.style.display = 'block';
      limitB.innerHTML = '&#x1F4DA; You\'ve reached the chat limit for this session. Use the <strong>Study Mode</strong> tabs for in-depth content, or refresh to reset.';
      if (input) input.disabled = true;
      if (sendBtn) sendBtn.disabled = true;
    }
  }

  /* ================================================================
     FEATURE 3: LAB HINT SYSTEM
     Called from lab.js when challenge mode starts
     ================================================================ */
  function initLabHint() {
    var hintBtn = document.getElementById('ai-hint-btn');
    var hintPanel = document.getElementById('ai-hint-panel');
    if (!hintBtn || !hintPanel) return;

    labHintsUsed = 0;
    labHintPenalty = 0;
    updateHintBtn();

    hintBtn.onclick = function () {
      var maxHints = (cfg && cfg.limits && cfg.limits.max_lab_hints) || 3;
      if (labHintsUsed >= maxHints) return;

      var labState = window.ArcReady && window.ArcReady._labState ? window.ArcReady._labState() : null;
      if (!labState) { return; }

      hintBtn.disabled = true;
      hintPanel.style.display = 'block';
      hintPanel.innerHTML = '<div class="ai-hint-header">&#x1F4A1; Hint <span id="ai-hint-num">' + (labHintsUsed + 1) + '</span></div>' +
        '<p><span class="ai-loading-dots"><span></span><span></span><span></span></span></p>';

      var readings = labState.readings || [];
      var readingsText = readings.length > 0
        // BUG 4 FIX: lab.js stores readings as {red, black, value} not {a, b, v}
        ? readings.map(function (r) { return 'TP' + r.red + '-TP' + r.black + ': ' + r.value; }).join(', ')
        : 'No measurements taken yet';

      var prompt = 'Circuit: ' + (labState.circuit || 'unknown') +
        '. Fault injected (do NOT reveal): confidential.' +
        ' Probes used: ' + (labState.probes || 0) +
        '. Measurements so far: ' + readingsText +
        '. Give ONE progressive hint to help diagnose the fault without naming it.';

      callAI('hint', [{ role: 'user', content: prompt }], function (text, err) {
        hintBtn.disabled = false;
        labHintsUsed++;
        labHintPenalty += 10;
        updateHintBtn();

        if (text) {
          hintPanel.innerHTML = '<div class="ai-hint-header">&#x1F4A1; Hint ' + labHintsUsed + ' / ' + maxHints + ' <span style="font-weight:400;color:#E65100;margin-left:4px;">(-10 pts)</span></div>' +
            '<p>' + escHtml(text) + '</p>';
        } else {
          hintPanel.style.display = 'none';
        }

        // Expose penalty for challenge scoring
        if (window.ArcReady) window.ArcReady._hintPenalty = labHintPenalty;
      });
    };

    function updateHintBtn() {
      var maxHints = (cfg && cfg.limits && cfg.limits.max_lab_hints) || 3;
      var left = maxHints - labHintsUsed;
      if (left <= 0) {
        hintBtn.disabled = true;
        hintBtn.innerHTML = '&#x1F916; No Hints Left';
      } else {
        hintBtn.disabled = false;
        hintBtn.innerHTML = '&#x1F916; Get Hint <span class="ai-hint-counter">(' + left + ' left, -10 pts each)</span>';
      }
    }
  }

  /* ================================================================
     FEATURE 4: WEAK AREA COACH
     Called after exam completion with topic scores
     ================================================================ */
  function runWeakAreaCoach(topicScores, section) {
    var coachSection = document.getElementById('ai-coach-section');
    var coachLoading = document.getElementById('ai-coach-loading');
    var coachCard = document.getElementById('ai-coach-card');
    var coachRegen = document.getElementById('ai-coach-regenerate');
    if (!coachSection) return;

    // Build weak topic summary
    var topics = Object.keys(topicScores || {});
    if (topics.length === 0) return;

    var lines = topics.map(function (t) {
      var d = topicScores[t];
      var pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
      return t + ': ' + d.correct + '/' + d.total + ' (' + pct + '%)';
    });
    var sortedLines = lines.slice().sort(function (a, b) {
      var pA = parseInt(a.match(/\((\d+)%\)/)[1], 10);
      var pB = parseInt(b.match(/\((\d+)%\)/)[1], 10);
      return pA - pB;
    });

    var std = getStandardCtx();
    var prompt = 'Student completed the ' + (section || 'Safety') + ' exam under ' + std + '.\n' +
      'Topic scores (sorted weakest first):\n' + sortedLines.join('\n') + '\n' +
      'Write a personalized 3-5 point study plan focusing on the weakest areas. Use bullet points. Be specific and actionable.';

    coachSection.style.display = 'block';
    if (coachLoading) coachLoading.style.display = 'flex';
    if (coachCard) coachCard.style.display = 'none';
    if (coachRegen) coachRegen.style.display = 'none';

    callAI('coach', [{ role: 'user', content: prompt }], function (text, err) {
      if (coachLoading) coachLoading.style.display = 'none';
      if (!text) {
        coachSection.style.display = 'none';
        return;
      }
      if (coachCard) {
        var html = formatCoachText(text);
        coachCard.innerHTML = html;
        coachCard.style.display = 'block';
      }
      if (coachRegen) {
        coachRegen.style.display = 'inline-block';
        coachRegen.onclick = function () { runWeakAreaCoach(topicScores, section); };
      }
    });
  }

  function formatCoachText(text) {
    var lines = text.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var items = [];
    var intro = '';
    var inList = false;
    lines.forEach(function (line) {
      if (/^[-*\u2022]\s+/.test(line)) {
        items.push('<li>' + escHtml(line.replace(/^[-*\u2022]\s+/, '')) + '</li>');
        inList = true;
      } else {
        if (!inList) intro += '<p>' + escHtml(line) + '</p>';
      }
    });
    var out = intro;
    if (items.length > 0) out += '<ul>' + items.join('') + '</ul>';
    if (!out) out = '<p>' + escHtml(text) + '</p>';
    return out;
  }

  /* -- HTML escape ---------------------------------------------- */
  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /* ================================================================
     INIT -- loads config, wires up chat bubble
     ================================================================ */
  function init() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/ai-config.json', true);
    xhr.onload = function () {
      try {
        cfg = JSON.parse(xhr.responseText);
        console.log('[ArcReady AI] Config loaded. dev_mode:', cfg.dev_mode, 'key set:', !!cfg.dev_openrouter_key, 'enabled:', cfg.enabled);
      } catch (e) {
        cfg = { enabled: false };
      }
      if (cfg && cfg.enabled) {
        initChat();
      }
    };
    xhr.onerror = function () { console.error('[ArcReady AI] Failed to load ai-config.json'); cfg = { enabled: false }; };
    xhr.send();
  }

  /* -- Public API ----------------------------------------------- */
  ArcReady.AI = {
    init: init,
    explainAnswer: explainAnswer,
    initLabHint: initLabHint,
    runWeakAreaCoach: runWeakAreaCoach,
    // Exposed for lab.js to reset hint state when new challenge starts
    resetLabHints: function () {
      labHintsUsed = 0;
      labHintPenalty = 0;
      window.ArcReady._hintPenalty = 0;
      var hp = document.getElementById('ai-hint-panel');
      if (hp) hp.style.display = 'none';
      initLabHint();
    }
  };

  // Auto-init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
