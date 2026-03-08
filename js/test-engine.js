
/**
 * ArcReady -- test-engine.js
 * Complete exam engine: Study, Practice, and Certify modes
 * Supports Fisher-Yates shuffle, 45-min countdown timer,
 * checkpoint model for Safety certify, topic scoring, localStorage persistence
 */
(function () {
  'use strict';

  /* ================================================================
     STATE
     ================================================================ */
  var TE = window.ArcReady = window.ArcReady || {};
  TE.TestEngine = TE.TestEngine || {};

  var banks = { safety: [], theory: [] };
  var loaded = false;

  // Per-exam session state keyed by "section-mode"
  var sessions = {};

  /* ================================================================
     DATA LOADING
     ================================================================ */
  function loadBanks() {
    return Promise.all([
      fetch('data/questions-safety.json?v=1.1').then(function (r) { if (!r.ok) throw new Error('Safety bank'); return r.json(); }),
      fetch('data/questions-theory.json?v=1.1').then(function (r) { if (!r.ok) throw new Error('Theory bank'); return r.json(); })
    ]).then(function (results) {
      banks.safety = results[0];
      banks.theory = results[1];
      loaded = true;
      onBanksLoaded();
    }).catch(function (err) {
      showToast('Error loading question banks: ' + err.message, 'error');
      console.error('Bank load error:', err);
    });
  }

  function onBanksLoaded() {
    updateHomeProgressBar();
    TE.Progress.render();
    checkTheoryGate();
    populateTopicDropdowns();
  }

  function populateTopicDropdowns() {
    ['safety', 'theory'].forEach(function (section) {
      if (!banks[section] || banks[section].length === 0) return;
      var dropdown = el(section + '-study-topic');
      if (!dropdown) return;

      var topicSet = {};
      banks[section].forEach(function (q) {
        if (q.topic) topicSet[q.topic] = true;
      });

      var uniqueTopics = Object.keys(topicSet).sort();
      var html = '<option value="all">All Topics</option>';
      uniqueTopics.forEach(function (topic) {
        html += '<option value="' + escHtml(topic) + '">' + escHtml(topic) + '</option>';
      });

      dropdown.innerHTML = html;
    });
  }

  /* ================================================================
     FISHER-YATES SHUFFLE
     ================================================================ */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function drawQuestions(section, n) {
    var bank = banks[section];
    if (!bank || bank.length === 0) return [];
    var shuffled = shuffle(bank);
    return shuffled.slice(0, n);
  }

  /* ================================================================
     SESSION HELPERS
     ================================================================ */
  function makeSession(section, mode, questions) {
    return {
      section: section,
      mode: mode,
      questions: questions,
      answers: {},       // { idx: 'A'|'B'|'C'|'D' }
      flags: {},       // { idx: true }
      current: 0,
      started: Date.now(),
      timer: null,
      elapsed: 0,
      // Study mode specific
      studyPool: [],
      studyIdx: 0,
      studyAnswered: false,
      // Checkpoint (safety certify)
      checkpoints: [],
      cpCurrent: 0,
      cpQIdx: 0,
      cpNeedsRetry: false
    };
  }

  function key(section, mode) { return section + '-' + mode; }

  /* ================================================================
     MEDIA HELPER
     ================================================================ */
  function renderMediaContent(q, i) {
    var wrap = el(i.imgWrap);
    if (!wrap) return;

    if (q.svgId && window.ArcReady && window.ArcReady.SVGCircuits && window.ArcReady.SVGCircuits[q.svgId]) {
      wrap.style.display = '';
      wrap.style.height = 'auto';
      wrap.style.maxHeight = 'none';
      wrap.style.overflow = 'hidden';

      var rawSvg = window.ArcReady.SVGCircuits[q.svgId].svg;

      // Dynamically highlight test points mentioned in the question or options
      var textToScan = q.question || '';
      if (q.options) {
        Object.values(q.options).forEach(function (optText) {
          textToScan += ' ' + optText;
        });
      }

      // Match occurrences of "TPX"
      var tpRegex = /TP(\d+)/gi;
      var match;
      var tpsToActivate = [];
      while ((match = tpRegex.exec(textToScan)) !== null) {
        tpsToActivate.push(match[1]);
      }

      // Match occurrences of conversational "test point X" or "test points X and Y"
      var conversationalRegex = /test point[s]?\s+(\d+)(?:\s+(?:and|or|to|-)\s+(\d+))?/gi;
      while ((match = conversationalRegex.exec(textToScan)) !== null) {
        if (match[1]) tpsToActivate.push(match[1]);
        if (match[2]) tpsToActivate.push(match[2]);
      }

      // Inject the active class directly into the raw SVG string
      tpsToActivate.forEach(function (tpId) {
        var targetString = 'data-tp="' + tpId + '"';
        var replacementString = 'class="test-point tp-active" data-tp="' + tpId + '"';
        var stripRegex = new RegExp('class="test-point"\\s+data-tp="' + tpId + '"', 'g');
        rawSvg = rawSvg.replace(stripRegex, targetString);
        rawSvg = rawSvg.replace(targetString, replacementString);
      });

      wrap.innerHTML = rawSvg;

      var svgEl = wrap.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.maxHeight = '550px';
        svgEl.style.height = 'auto';
        svgEl.style.width = 'auto';
        svgEl.style.borderRadius = '8px';
      }
    } else if (q.image) {
      wrap.style.display = '';
      wrap.innerHTML = '<img id="' + i.img + '" src="' + q.image + '" alt="Context" style="max-width:100%; height:auto;" />';
    } else {
      wrap.style.display = 'none';
      wrap.innerHTML = '';
    }
  }

  /* ================================================================
     IDs HELPERS
     ================================================================ */
  function ids(section, mode) {
    var p = section + '-' + mode;
    return {
      counter: p + '-counter',
      timer: p + '-timer',
      progress: p + '-progress',
      question: p + '-question',
      options: p + '-options',
      explanation: p + '-explanation',
      imgWrap: p + '-img-wrap',
      img: p + '-img',
      topicBadge: p + '-topic-badge',
      next: p + '-next',
      prev: p + '-prev',
      flag: p + '-flag',
      submit: p + '-submit',
      startScreen: section + '-' + mode + '-start-screen',
      examArea: section + '-' + mode + '-exam',
      results: section + '-' + mode + '-results'
    };
  }

  function el(id) { return document.getElementById(id); }
  function setHTML(id, html) { var e = el(id); if (e) e.innerHTML = html; }
  function setText(id, txt) { var e = el(id); if (e) e.textContent = txt; }
  function show(id) { var e = el(id); if (e) e.style.display = ''; }
  function hide(id) { var e = el(id); if (e) e.style.display = 'none'; }
  function showBlock(id) { var e = el(id); if (e) e.style.display = 'block'; }

  /* ================================================================
     STUDY MODE
     ================================================================ */
  function startStudy(section) {
    if (!loaded) { showToast('Loading question banks...', 'info'); return; }
    var topicFilter = el(section + '-study-topic');
    var filterVal = topicFilter ? topicFilter.value : 'all';
    var pool = banks[section].filter(function (q) {
      return filterVal === 'all' || q.topic === filterVal;
    });
    if (pool.length === 0) { showToast('No questions match that filter.', 'info'); return; }

    var sess = makeSession(section, 'study', []);
    sess.studyPool = shuffle(pool);
    sess.studyIdx = 0;
    sess.studyAnswered = false;
    sessions[key(section, 'study')] = sess;

    var studyArea = el(section + '-study-area');
    if (studyArea) studyArea.style.display = 'block';
    renderStudyQuestion(section);
  }

  function renderStudyQuestion(section) {
    var sess = sessions[key(section, 'study')];
    if (!sess) return;
    var pool = sess.studyPool;
    var idx = sess.studyIdx % pool.length;
    var q = pool[idx];
    var i = ids(section, 'study');

    sess.studyAnswered = false;
    setText(i.counter, 'Question ' + (idx + 1) + ' of ' + pool.length);
    setText(i.topicBadge, q.topic);
    // BUG 1 FIX: use dual-standard helpers so NFPA mode shows correct text
    var qText = window._getQuestionText ? window._getQuestionText(q) : q.question;
    var qOpts = window._getQuestionOptions ? window._getQuestionOptions(q) : (q.options || {});
    setText(i.question, qText);

    // Image / SVG
    renderMediaContent(q, i);

    // Options
    var optHTML = '';
    ['A', 'B', 'C', 'D'].forEach(function (letter) {
      optHTML += '<div class="answer-option" data-option="' + letter + '" ' +
        'data-section="' + section + '" data-mode="study">' +
        '<span class="answer-letter">' + letter + '</span>' +
        '<span class="answer-text">' + escHtml(qOpts[letter] || '') + '</span></div>';
    });
    setHTML(i.options, optHTML);

    // Hide explanation & next
    var expEl = el(i.explanation);
    if (expEl) { expEl.style.display = 'none'; expEl.innerHTML = ''; }
    var nextBtn = el(i.next);
    if (nextBtn) nextBtn.style.display = 'none';
  }

  function handleStudyAnswer(section, chosen) {
    var sess = sessions[key(section, 'study')];
    if (!sess || sess.studyAnswered) return;
    sess.studyAnswered = true;

    var pool = sess.studyPool;
    var idx = sess.studyIdx % pool.length;
    var q = pool[idx];
    // BUG 1 FIX: resolve correct answer and explanation via dual-standard helpers
    var correctAnswer = window._getCorrectAnswer ? window._getCorrectAnswer(q) : q.answer;
    var qOpts = window._getQuestionOptions ? window._getQuestionOptions(q) : (q.options || {});
    var qExpl = window._getExplanation ? window._getExplanation(q) : q.explanation;
    var correct = (chosen === correctAnswer);
    var i = ids(section, 'study');

    // Highlight options
    var optEls = el(i.options).querySelectorAll('.answer-option');
    optEls.forEach(function (opt) {
      var letter = opt.getAttribute('data-option');
      opt.classList.remove('selected', 'correct', 'incorrect');
      if (letter === chosen && !correct) opt.classList.add('incorrect');
      if (letter === correctAnswer) opt.classList.add('correct');
      if (letter === chosen && correct) opt.classList.add('correct');
      opt.style.pointerEvents = 'none';
    });

    // Explanation
    var expEl = el(i.explanation);
    if (expEl) {
      expEl.style.display = 'block';
      expEl.innerHTML =
        '<div class="explanation-inner ' + (correct ? 'explanation--correct' : 'explanation--incorrect') + '">' +
        '<strong>' + (correct ? '&#x2705; Correct!' : '&#x274C; Incorrect') + '</strong>' +
        (correct ? '' : ' The correct answer is <strong>' + correctAnswer + ': ' + escHtml(qOpts[correctAnswer] || '') + '</strong>') +
        '<p>' + escHtml(qExpl) + '</p></div>';
      // AI: explain button for wrong answers
      if (!correct && window.ArcReady && ArcReady.AI) {
        ArcReady.AI.explainAnswer(
          window._getQuestionText ? window._getQuestionText(q) : q.question,
          correctAnswer + ': ' + (qOpts[correctAnswer] || ''),
          chosen + ': ' + (qOpts[chosen] || chosen),
          i.explanation
        );
      }
    }

    // Show next
    var nextBtn = el(i.next);
    if (nextBtn) nextBtn.style.display = 'inline-block';
  }

  function advanceStudy(section) {
    var sess = sessions[key(section, 'study')];
    if (!sess) return;
    sess.studyIdx++;
    if (sess.studyIdx >= sess.studyPool.length) {
      sess.studyPool = shuffle(sess.studyPool); // re-shuffle for next round
      sess.studyIdx = 0;
      showToast('Round complete! Starting a new shuffled round.', 'info');
    }
    renderStudyQuestion(section);
  }

  /* ================================================================
     PRACTICE EXAM MODE
     ================================================================ */
  function startPractice(section) {
    if (!loaded) { showToast('Loading question banks...', 'info'); return; }
    var questions = drawQuestions(section, 60);
    var sess = makeSession(section, 'practice', questions);
    sessions[key(section, 'practice')] = sess;

    hide(section + '-practice-start-screen');
    show(section + '-practice-exam');

    renderExamQuestion(section, 'practice', 0);
    startTimer(section, 'practice', 45 * 60);
  }

  /* ================================================================
     CERTIFY EXAM MODE
     ================================================================ */
  function startCertify(section) {
    if (!loaded) { showToast('Loading question banks...', 'info'); return; }

    // Theory gate
    if (section === 'theory' && localStorage.getItem('arcready_safety_certified') !== 'true') {
      showToast('Complete Safety Certification first!', 'error');
      return;
    }

    var questions = drawQuestions(section, 60);
    var sess = makeSession(section, 'certify', questions);

    // Safety: build checkpoint blocks
    if (section === 'safety') {
      sess.checkpoints = buildCheckpoints(questions);
      sess.cpCurrent = 0;
      sess.cpQIdx = 0;
    }

    sessions[key(section, 'certify')] = sess;

    hide(section + '-certify-start-screen');
    show(section + '-certify-exam');

    if (section === 'safety') {
      renderCheckpointBar(section);
      renderCertifyCheckpointQuestion(section);
    } else {
      renderExamQuestion(section, 'certify', 0);
    }
    startTimer(section, 'certify', 45 * 60);
  }

  // Group certify questions by topic for safety checkpoint model
  function buildCheckpoints(questions) {
    var topicMap = {};
    var topicOrder = [];
    questions.forEach(function (q, idx) {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = [];
        topicOrder.push(q.topic);
      }
      topicMap[q.topic].push({ q: q, origIdx: idx });
    });
    return topicOrder.map(function (topic) {
      return { topic: topic, items: topicMap[topic], correct: 0, attempts: 0, done: false };
    });
  }

  function renderCheckpointBar(section) {
    var sess = sessions[key(section, 'certify')];
    if (!sess || !sess.checkpoints) return;
    var barEl = el(section + '-checkpoint-bar');
    if (!barEl) return;
    var html = sess.checkpoints.map(function (cp, i) {
      var cls = 'cp-node';
      if (i < sess.cpCurrent) cls += ' cp-node--done';
      else if (i === sess.cpCurrent) cls += ' cp-node--active';
      return '<div class="' + cls + '" title="' + escHtml(cp.topic) + '">' +
        '<span class="cp-node-num">' + (i + 1) + '</span>' +
        '<span class="cp-node-label">' + escHtml(shortTopic(cp.topic)) + '</span></div>';
    }).join('<div class="cp-connector"></div>');
    barEl.innerHTML = html;
  }

  function shortTopic(t) {
    var map = {
      'Arc Flash Fundamentals': 'Arc Flash',
      'Approach Boundaries': 'Boundaries',
      'Arc Flash Label Reading': 'Labels',
      'PPE & HRC Categories': 'PPE/HRC',
      'Lockout/Tagout (LOTOTO)': 'LOTOTO',
      'Energized Work Permits': 'EWP',
      'Qualified Person Rules': 'QP Rules',
      'PPE Inspection & Testing': 'PPE Inspect',
      'PPE Purchasing Standards': 'PPE Specs',
      'Safety Scenarios': 'Scenarios'
    };
    return map[t] || t.substring(0, 10);
  }

  function renderCertifyCheckpointQuestion(section) {
    var sess = sessions[key(section, 'certify')];
    var cp = sess.checkpoints[sess.cpCurrent];
    var item = cp.items[sess.cpQIdx];
    var q = item.q;
    var i = ids(section, 'certify');

    var totalQ = 0;
    sess.checkpoints.forEach(function (c, ci) { if (ci < sess.cpCurrent) totalQ += c.items.length; });
    totalQ += sess.cpQIdx + 1;

    var totalAll = sess.questions.length;
    setText(i.counter, 'Q ' + totalQ + ' of ' + totalAll +
      '  |  Block ' + (sess.cpCurrent + 1) + ' of ' + sess.checkpoints.length +
      '  \u2014  ' + cp.topic);

    setText(i.topicBadge, cp.topic);
    // BUG 1 FIX: use dual-standard helpers for certify-checkpoint render
    var qText = window._getQuestionText ? window._getQuestionText(q) : q.question;
    var qOpts = window._getQuestionOptions ? window._getQuestionOptions(q) : (q.options || {});
    setText(i.question, qText);

    renderMediaContent(q, i);

    var optHTML = '';
    ['A', 'B', 'C', 'D'].forEach(function (letter) {
      optHTML += '<div class="answer-option" data-option="' + letter + '" ' +
        'data-section="' + section + '" data-mode="certify-cp">' +
        '<span class="answer-letter">' + letter + '</span>' +
        '<span class="answer-text">' + escHtml(qOpts[letter] || '') + '</span></div>';
    });
    setHTML(i.options, optHTML);

    // Hide explanation, reset next button
    var expEl = el(i.explanation);
    if (expEl) { expEl.style.display = 'none'; expEl.innerHTML = ''; }

    var nextBtn = el(i.next);
    if (nextBtn) {
      nextBtn.textContent = 'Confirm Answer \u2192';
      nextBtn.disabled = true;
      nextBtn.classList.remove('btn-ready');
    }
    sess.cpNeedsRetry = false;

    // Update progress fill
    var pct = (totalQ / totalAll) * 100;
    var progEl = el(i.progress);
    if (progEl) progEl.style.width = pct + '%';
  }

  function handleCertifyCheckpointAnswer(section, chosen) {
    var sess = sessions[key(section, 'certify')];
    if (!sess) return;
    var cp = sess.checkpoints[sess.cpCurrent];
    var item = cp.items[sess.cpQIdx];
    var q = item.q;
    // BUG 1 FIX: use dual-standard helpers
    var correctAnswer = window._getCorrectAnswer ? window._getCorrectAnswer(q) : q.answer;
    var qOpts = window._getQuestionOptions ? window._getQuestionOptions(q) : (q.options || {});
    var qExpl = window._getExplanation ? window._getExplanation(q) : q.explanation;
    var correct = (chosen === correctAnswer);
    var i = ids(section, 'certify');

    cp.attempts++;
    if (correct) cp.correct++;
    if (!sess.answers[item.origIdx]) {
      sess.answers[item.origIdx] = chosen; // first attempt
    }

    // Highlight options
    var optEls = el(i.options).querySelectorAll('.answer-option');
    optEls.forEach(function (opt) {
      var letter = opt.getAttribute('data-option');
      opt.classList.remove('selected', 'correct', 'incorrect');
      if (letter === chosen && !correct) opt.classList.add('incorrect');
      if (letter === correctAnswer) opt.classList.add('correct');
      if (letter === chosen && correct) opt.classList.add('correct');
      opt.style.pointerEvents = 'none';
    });

    var expEl = el(i.explanation);
    if (expEl) {
      expEl.style.display = 'block';
      if (correct) {
        expEl.innerHTML = '<div class="explanation-inner explanation--correct"><strong>&#x2705; Correct!</strong>' +
          '<p>' + escHtml(qExpl) + '</p></div>';
      } else {
        expEl.innerHTML = '<div class="explanation-inner explanation--incorrect"><strong>&#x274C; Incorrect.</strong>' +
          ' Correct answer: <strong>' + chosen + ' &#x2192; ' + correctAnswer + ': ' + escHtml(qOpts[correctAnswer] || '') + '</strong>' +
          '<p>' + escHtml(qExpl) + '</p>' +
          '<p class="retry-notice">&#x26A0; Review the explanation above, then select the correct answer to continue.</p></div>';
        // AI: explain button for wrong answers
        if (window.ArcReady && ArcReady.AI) {
          ArcReady.AI.explainAnswer(
            window._getQuestionText ? window._getQuestionText(q) : q.question,
            correctAnswer + ': ' + (qOpts[correctAnswer] || ''),
            chosen + ': ' + (qOpts[chosen] || chosen),
            i.explanation
          );
        }
        // Re-enable the correct option only so they can retry
        optEls.forEach(function (opt) {
          if (opt.getAttribute('data-option') === correctAnswer) {
            opt.style.pointerEvents = '';
          }
        });
        sess.cpNeedsRetry = true;
      }
    }

    var nextBtn = el(i.next);
    if (nextBtn && correct) {
      nextBtn.textContent = sess.cpQIdx + 1 < cp.items.length ? 'Next Question \u2192' :
        sess.cpCurrent + 1 < sess.checkpoints.length ? 'Next Topic Block \u2192' : 'Submit Exam';
      nextBtn.disabled = false;
      nextBtn.classList.add('btn-ready');
    }
  }

  function advanceCertifyCheckpoint(section) {
    var sess = sessions[key(section, 'certify')];
    if (!sess) return;
    var cp = sess.checkpoints[sess.cpCurrent];

    sess.cpQIdx++;
    if (sess.cpQIdx < cp.items.length) {
      renderCertifyCheckpointQuestion(section);
    } else {
      // Block done
      cp.done = true;
      sess.cpCurrent++;
      if (sess.cpCurrent < sess.checkpoints.length) {
        sess.cpQIdx = 0;
        renderCheckpointBar(section);
        renderCertifyCheckpointQuestion(section);
        showToast('Block complete! Moving to: ' + sess.checkpoints[sess.cpCurrent].topic, 'info');
      } else {
        // All checkpoints done -- submit
        stopTimer(section, 'certify');
        renderCheckpointBar(section);
        scoreAndShowResults(section, 'certify');
      }
    }
  }

  /* ================================================================
     PRACTICE/CERTIFY QUESTION RENDER
     ================================================================ */
  function renderExamQuestion(section, mode, idx) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    sess.current = idx;
    var q = sess.questions[idx];
    var i = ids(section, mode);
    var total = sess.questions.length;

    setText(i.counter, 'Question ' + (idx + 1) + ' of ' + total);
    setText(i.topicBadge, q.topic);
    // BUG 1 FIX: use dual-standard helpers for practice/certify render
    var qText = window._getQuestionText ? window._getQuestionText(q) : q.question;
    var qOpts = window._getQuestionOptions ? window._getQuestionOptions(q) : (q.options || {});
    setText(i.question, qText);

    renderMediaContent(q, i);

    var selected = sess.answers[idx];
    var flagged = sess.flags[idx];
    var optHTML = '';
    ['A', 'B', 'C', 'D'].forEach(function (letter) {
      var sel = (letter === selected) ? ' selected' : '';
      optHTML += '<div class="answer-option' + sel + '" data-option="' + letter + '" ' +
        'data-section="' + section + '" data-mode="' + mode + '">' +
        '<span class="answer-letter">' + letter + '</span>' +
        '<span class="answer-text">' + escHtml(qOpts[letter] || '') + '</span></div>';
    });
    setHTML(i.options, optHTML);

    // Flag button state
    var flagBtn = el(i.flag);
    if (flagBtn) flagBtn.classList.toggle('flag-btn--active', !!flagged);

    // Progress fill
    var answered = Object.keys(sess.answers).length;
    var progEl = el(i.progress);
    if (progEl) progEl.style.width = ((answered / total) * 100) + '%';
  }

  function handleExamAnswer(section, mode, chosen) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    sess.answers[sess.current] = chosen;
    renderExamQuestion(section, mode, sess.current);
  }

  /* ================================================================
     TIMER
     ================================================================ */
  function startTimer(section, mode, seconds) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    var remaining = seconds;
    var i = ids(section, mode);
    var timerEl = el(i.timer);

    updateTimerDisplay(timerEl, remaining);
    sess.timer = setInterval(function () {
      remaining--;
      if (remaining <= 0) {
        stopTimer(section, mode);
        showToast('Time is up! Submitting exam.', 'error');
        if (mode === 'practice') { submitPractice(section); }
        else if (mode === 'certify' && section !== 'safety') { submitCertify(section); }
        // BUG 3 FIX: safety certify uses checkpoint mode -- also needs to submit on timeout
        else if (mode === 'certify' && section === 'safety') {
          hide(section + '-certify-exam');
          scoreAndShowResults(section, 'certify');
        }
        return;
      }
      updateTimerDisplay(timerEl, remaining);
      if (remaining <= 300 && timerEl) timerEl.classList.add('timer--warning');
    }, 1000);
  }

  function stopTimer(section, mode) {
    var sess = sessions[key(section, mode)];
    if (sess && sess.timer) { clearInterval(sess.timer); sess.timer = null; }
  }

  function updateTimerDisplay(el, secs) {
    if (!el) return;
    var m = Math.floor(secs / 60);
    var s = secs % 60;
    el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  /* ================================================================
     SUBMIT & SCORING
     ================================================================ */
  function submitPractice(section) {
    stopTimer(section, 'practice');
    hide(section + '-practice-exam');
    scoreAndShowResults(section, 'practice');
  }

  function submitCertify(section) {
    stopTimer(section, 'certify');
    hide(section + '-certify-exam');
    scoreAndShowResults(section, 'certify');
  }

  function scoreAndShowResults(section, mode) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    var questions = sess.questions;
    var answers = sess.answers;

    var total = questions.length;
    var correct = 0;
    var topicMap = {}; // { topic: { correct: n, total: n } }

    questions.forEach(function (q, idx) {
      if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0, wrong: [] };
      topicMap[q.topic].total++;
      var chosen = answers[idx];
      // BUG 1 FIX: use dual-standard correct answer
      var correctAnswer = window._getCorrectAnswer ? window._getCorrectAnswer(q) : q.answer;
      if (chosen === correctAnswer) {
        correct++;
        topicMap[q.topic].correct++;
      } else {
        topicMap[q.topic].wrong.push({ q: q, chosen: chosen });
      }
    });

    var pct = Math.round((correct / total) * 100);
    // BUG 12 FIX: pass threshold is dynamic based on actual drawn question count, not hardcoded 60
    var passThresh = section === 'safety' ? total : Math.ceil(total * 0.85);
    var pass = section === 'safety' ? (correct === total) : (correct >= passThresh);

    // Save attempt if certify
    if (mode === 'certify') {
      saveAttempt(section, pct, correct, total, pass, topicMap);
      if (pass) {
        localStorage.setItem('arcready_' + section + '_certified', 'true');
        updateHomeProgressBar();
        checkTheoryGate();
        TE.Progress.render();
      }
    }

    // Build results HTML
    var html = buildResultsHTML(section, mode, correct, total, pct, pass, passThresh, topicMap, questions, answers);

    var resultsEl = el(section + '-' + mode + '-results');
    if (resultsEl) {
      resultsEl.innerHTML = html;
      resultsEl.style.display = 'block';
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // AI: trigger weak area coach after certify exam
      if (mode === 'certify' && window.ArcReady && ArcReady.AI) {
        (function () {
          var scores = {};
          Object.keys(topicMap).forEach(function (t) {
            scores[t] = { correct: topicMap[t].correct, total: topicMap[t].total };
          });
          ArcReady.AI.runWeakAreaCoach(scores, section.charAt(0).toUpperCase() + section.slice(1));
        }());
      }
    }

    // Wire retry/review buttons
    var retryBtn = el('results-retake-' + section + '-' + mode);
    if (retryBtn) retryBtn.addEventListener('click', function () {
      resultsEl.style.display = 'none';
      resultsEl.innerHTML = '';
      var startScreen = el(section + '-' + mode + '-start-screen');
      if (startScreen) startScreen.style.display = '';
    });
  }

  function buildResultsHTML(section, mode, correct, total, pct, pass, passThresh, topicMap, questions, answers) {
    var passClass = pass ? 'results--pass' : 'results--fail';
    var passLabel = pass ? '&#x2705; PASS' : '&#x274C; FAIL';
    var passMsg = pass ?
      (mode === 'certify' ? '&#x1F389; Congratulations! You have earned your ' + (section.charAt(0).toUpperCase() + section.slice(1)) + ' Certification!' :
        'Great work! You are ready for the certification exam.') :
      'Keep studying! Review the topics below and try again.';

    var topicRows = '';
    Object.keys(topicMap).sort().forEach(function (topic) {
      var t = topicMap[topic];
      var tPct = Math.round((t.correct / t.total) * 100);
      var icon = tPct === 100 ? '&#x2705;' : tPct >= 80 ? '&#x26A0;&#xFE0F;' : '&#x274C;';
      topicRows += '<tr class="' + (tPct < 80 ? 'topic-row--weak' : '') + '">' +
        '<td>' + escHtml(topic) + '</td>' +
        '<td>' + t.correct + '/' + t.total + '</td>' +
        '<td>' + tPct + '%</td>' +
        '<td>' + icon + '</td></tr>';
    });

    var missedHTML = '';
    if (!pass || mode === 'practice') {
      var missed = [];
      questions.forEach(function (q, idx) {
        // BUG E FIX: use dual-standard correct answer helper
        var correctAns = window._getCorrectAnswer ? window._getCorrectAnswer(q) : q.answer;
        if (answers[idx] !== correctAns) missed.push({ q: q, chosen: answers[idx], correctAns: correctAns });
      });
      if (missed.length > 0) {
        missedHTML = '<div class="results-missed"><h4>Missed Questions (' + missed.length + ')</h4>';
        missed.forEach(function (m, n) {
          var chosen = m.chosen || 'Not answered';
          // BUG E FIX: use dual-standard options helper
          var opts = window._getQuestionOptions ? window._getQuestionOptions(m.q) : (m.q.options || {});
          var expl = window._getExplanation ? window._getExplanation(m.q) : (m.q.explanation || '');
          var qText = window._getQuestionText ? window._getQuestionText(m.q) : (m.q.question || '');
          missedHTML += '<div class="missed-item">' +
            '<div class="missed-q"><strong>' + (n + 1) + '.</strong> ' + escHtml(qText) + '</div>' +
            '<div class="missed-your">Your answer: <span class="answer-wrong">' + escHtml(chosen !== 'Not answered' ? chosen + ': ' + (opts[chosen] || '') : 'Not answered') + '</span></div>' +
            '<div class="missed-correct">Correct: <span class="answer-right">' + m.correctAns + ': ' + escHtml(opts[m.correctAns] || '') + '</span></div>' +
            '<div class="missed-exp">' + escHtml(expl) + '</div></div>';
        });
        missedHTML += '</div>';
      }
    }

    return '<div class="results-panel-inner ' + passClass + '">' +
      '<div class="results-header">' +
      '<h3 class="results-title">Exam Results</h3>' +
      '<div class="results-score">' + correct + '/' + total + ' &mdash; ' + pct + '% &nbsp; ' + passLabel + '</div>' +
      '<p class="results-msg">' + passMsg + '</p>' +
      '</div>' +
      '<div class="results-body">' +
      '<table class="results-topic-table"><thead><tr><th>Topic</th><th>Score</th><th>%</th><th></th></tr></thead>' +
      '<tbody>' + topicRows + '</tbody></table>' +
      '</div>' +
      missedHTML +
      '<div class="results-actions">' +
      '<button class="btn btn-secondary" id="results-retake-' + section + '-' + mode + '">&#x1F504; Retake Exam</button>' +
      (mode === 'certify' && pass ? '<button class="btn btn-primary" onclick="window.ArcReady.showTab(\'progress\')">View Progress &#x1F4CA;</button>' : '') +
      '</div></div>';
  }

  /* ================================================================
     SAVE ATTEMPT
     ================================================================ */
  function saveAttempt(section, pct, correct, total, pass, topicMap) {
    var histKey = 'arcready_' + section + '_history';
    var history = [];
    try { history = JSON.parse(localStorage.getItem(histKey) || '[]'); } catch (e) { }
    var topicBreakdown = {};
    Object.keys(topicMap).forEach(function (t) {
      topicBreakdown[t] = { correct: topicMap[t].correct, total: topicMap[t].total };
    });
    history.push({
      date: new Date().toISOString(),
      score: correct,
      total: total,
      pct: pct,
      passed: pass,
      topicBreakdown: topicBreakdown
    });
    localStorage.setItem(histKey, JSON.stringify(history));

    // Update best score
    var bestKey = 'arcready_' + section + '_best';
    var curBest = parseInt(localStorage.getItem(bestKey) || '0', 10);
    if (pct > curBest) localStorage.setItem(bestKey, String(pct));

    // Notify Home dashboard
    updateHomeProgressBar();
    document.dispatchEvent(new CustomEvent('certificationUpdated'));

  }

  /* ================================================================
     HOME PROGRESS BAR
     ================================================================ */
  function updateHomeProgressBar() {
    var safetyCert = localStorage.getItem('arcready_safety_certified') === 'true';
    var theoryCert = localStorage.getItem('arcready_theory_certified') === 'true';
    var bothCert = safetyCert && theoryCert;

    // Step 1 - Safety
    var sNum = el('cert-step-num-1');
    var sBadge = el('safety-cert-badge');
    var sStep = el('cert-step-safety');
    if (safetyCert) {
      if (sNum) sNum.textContent = '\u2713';
      if (sBadge) { sBadge.textContent = 'Certified \u2705'; sBadge.className = 'status-badge status-pass'; }
      if (sStep) sStep.classList.add('cert-step--done');
    } else {
      if (sNum) sNum.textContent = '1';
      if (sBadge) { sBadge.textContent = 'Not Started'; sBadge.className = 'status-badge status-pending'; }
    }

    // Step 2 - Theory
    var tNum = el('cert-step-num-2');
    var tBadge = el('theory-cert-badge');
    var tStep = el('cert-step-theory');
    if (theoryCert) {
      if (tNum) tNum.textContent = '\u2713';
      if (tBadge) { tBadge.textContent = 'Certified \u2705'; tBadge.className = 'status-badge status-pass'; }
      if (tStep) tStep.classList.add('cert-step--done');
    } else if (safetyCert) {
      if (tBadge) { tBadge.textContent = 'Unlocked'; tBadge.className = 'status-badge status-pending'; }
    }

    // Connectors
    var c1 = el('connector-1');
    var c2 = el('connector-2');
    if (c1) c1.classList.toggle('cert-path-connector--done', safetyCert);
    if (c2) c2.classList.toggle('cert-path-connector--done', theoryCert);

    // Step 3 - Complete
    var cNum = el('cert-step-num-3');
    var cBadge = el('complete-cert-badge');
    var cStep = el('cert-step-complete');
    if (bothCert) {
      if (cNum) cNum.textContent = '\u2B50';
      if (cBadge) { cBadge.textContent = 'Complete!'; cBadge.className = 'status-badge status-pass'; }
      if (cStep) cStep.classList.add('cert-step--done');
    }

    // Theory home lock
    var lockMsg = el('theory-home-lock');
    if (lockMsg) lockMsg.style.display = safetyCert ? 'none' : '';
    var theoryIcon = el('theory-card-icon');
    if (theoryIcon) theoryIcon.textContent = safetyCert ? '\uD83D\uDCD6' : '\uD83D\uDD12';
  }

  /* ================================================================
     THEORY GATE
     ================================================================ */
  function checkTheoryGate() {
    var certified = localStorage.getItem('arcready_safety_certified') === 'true';
    var lockOverlay = el('theory-lock-overlay');
    var certifyStart = el('theory-certify-start-screen');
    if (lockOverlay) lockOverlay.style.display = certified ? 'none' : '';  // hide overlay when certified
    // BUG 6 FIX: was inverted -- certify start screen should show when certified, hide when NOT
    if (certifyStart) certifyStart.style.display = certified ? '' : 'none';
  }

  /* ================================================================
     TOAST
     ================================================================ */
  function showToast(msg, type) {
    var t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast toast--' + (type || 'info');
    t.style.display = 'block';
    clearTimeout(t._timeout);
    t._timeout = setTimeout(function () { t.style.display = 'none'; }, 3500);
  }

  /* ================================================================
     UTILITY
     ================================================================ */
  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ================================================================
     EVENT WIRING -- answer clicks (delegated)
     ================================================================ */
  document.addEventListener('click', function (e) {
    var opt = e.target.closest('.answer-option');
    if (!opt) return;
    var section = opt.getAttribute('data-section');
    var mode = opt.getAttribute('data-mode');
    var chosen = opt.getAttribute('data-option');
    if (!section || !mode || !chosen) return;

    if (mode === 'study') {
      handleStudyAnswer(section, chosen);
    } else if (mode === 'certify-cp') {
      var sess = sessions[key(section, 'certify')];
      if (sess && sess.cpNeedsRetry) {
        advanceCertifyCheckpoint(section);
      } else if (sess && !sess.cpNeedsRetry) {
        handleCertifyCheckpointAnswer(section, chosen);
      }
    } else if (mode === 'practice' || mode === 'certify') {
      handleExamAnswer(section, mode, chosen);
    }
  });

  /* ================================================================
     BUTTON EVENT WIRING
     ================================================================ */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[id]');
    if (!btn) return;
    var id = btn.id;

    // Study start
    if (id === 'safety-study-start') { startStudy('safety'); return; }
    if (id === 'theory-study-start') { startStudy('theory'); return; }

    // Study next
    if (id === 'safety-study-next') { advanceStudy('safety'); return; }
    if (id === 'theory-study-next') { advanceStudy('theory'); return; }

    // Practice begin
    if (id === 'safety-practice-begin') { startPractice('safety'); return; }
    if (id === 'theory-practice-begin') { startPractice('theory'); return; }

    // Certify begin
    if (id === 'safety-certify-begin') { startCertify('safety'); return; }
    if (id === 'theory-certify-begin') { startCertify('theory'); return; }

    // Practice nav
    if (id === 'safety-practice-next') { navExam('safety', 'practice', 'next'); return; }
    if (id === 'safety-practice-prev') { navExam('safety', 'practice', 'prev'); return; }
    if (id === 'theory-practice-next') { navExam('theory', 'practice', 'next'); return; }
    if (id === 'theory-practice-prev') { navExam('theory', 'practice', 'prev'); return; }

    // Theory certify nav
    if (id === 'theory-certify-next') { navExam('theory', 'certify', 'next'); return; }
    if (id === 'theory-certify-prev') { navExam('theory', 'certify', 'prev'); return; }

    // Safety certify checkpoint next
    if (id === 'safety-certify-next') {
      var sess = sessions['safety-certify'];
      if (sess && sess.checkpoints && !sess.cpNeedsRetry) advanceCertifyCheckpoint('safety');
      return;
    }

    // Flags
    if (id === 'safety-practice-flag') { toggleFlag('safety', 'practice'); return; }
    if (id === 'theory-practice-flag') { toggleFlag('theory', 'practice'); return; }

    // Submit
    if (id === 'safety-practice-submit') { if (confirmSubmit()) submitPractice('safety'); return; }
    if (id === 'theory-practice-submit') { if (confirmSubmit()) submitPractice('theory'); return; }
    if (id === 'theory-certify-submit') { if (confirmSubmit()) submitCertify('theory'); return; }

    // Reset progress
    if (id === 'reset-progress-btn') {
      if (confirm('Reset ALL progress? This cannot be undone.')) {
        ['safety', 'theory'].forEach(function (s) {
          localStorage.removeItem('arcready_' + s + '_certified');
          localStorage.removeItem('arcready_' + s + '_history');
          localStorage.removeItem('arcready_' + s + '_best');
        });
        updateHomeProgressBar();
        checkTheoryGate();
        TE.Progress.render();
        showToast('Progress reset.', 'info');
      }
      return;
    }
  });

  function navExam(section, mode, dir) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    var next = sess.current + (dir === 'next' ? 1 : -1);
    next = Math.max(0, Math.min(sess.questions.length - 1, next));
    renderExamQuestion(section, mode, next);
  }

  function toggleFlag(section, mode) {
    var sess = sessions[key(section, mode)];
    if (!sess) return;
    var idx = sess.current;
    sess.flags[idx] = !sess.flags[idx];
    var flagBtn = el(section + '-' + mode + '-flag');
    if (flagBtn) flagBtn.classList.toggle('flag-btn--active', sess.flags[idx]);
    showToast(sess.flags[idx] ? 'Question flagged for review.' : 'Flag removed.', 'info');
  }

  function confirmSubmit() {
    return confirm('Submit exam now? You cannot change answers after submitting.');
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  TE.TestEngine = {
    load: loadBanks,
    banks: banks,
    toast: showToast,
    updateHome: updateHomeProgressBar,
    startStudy: startStudy,
    startPractice: startPractice,
    startCertify: startCertify
  };

  // Auto-load on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBanks);
  } else {
    loadBanks();
  }

}());

// -- Dual-standard helpers (standards.js integration) ------------------
(function () {
  function _std() { return (window.ArcReady && window.ArcReady.getStandardId) ? window.ArcReady.getStandardId() : (localStorage.getItem('arcready_standard') || 'workplace'); }
  window._getStandardId = _std;
  window._getQuestionText = function (q) { var s = _std(); return (s === 'nfpa' && q.text_nfpa) ? q.text_nfpa : (q.question || q.text || ''); };
  window._getQuestionOptions = function (q) { var s = _std(); return (s === 'nfpa' && q.options_nfpa) ? q.options_nfpa : (q.options || {}); };
  window._getCorrectAnswer = function (q) { var s = _std(); return (s === 'nfpa' && q.answer_nfpa) ? q.answer_nfpa : (q.answer || q.correct || ''); };
  window._getExplanation = function (q) { var s = _std(); return (s === 'nfpa' && q.explanation_nfpa) ? q.explanation_nfpa : (q.explanation || ''); };
  window._filterQuestionsByStandard = function (all) {
    var s = _std();
    return all.filter(function (q) { if (!q.standard || q.standard === 'both') return true; return q.standard === s; });
  };
  // BUG 1 FIX: TestEngine is a plain object, not a class -- prototype extension was wrong.
  // The helpers are exposed on window and called directly inside the render functions above.
})();
