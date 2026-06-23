// ── State ──
let batchSize = 25, rangeIdx = 0, shuffleQ = false, shuffleA = false, randomMode = false;
let quizQs = [], cur = 0, answered = false, okCount = 0, badCount = 0;
let history = [];
let currentSubject = 'triet_hoc';
let splitByChapter = false;
let currentChapter = null;

function currentQs() {
  return (SUBJECTS && SUBJECTS[currentSubject] && SUBJECTS[currentSubject].questions) || [];
}


// ── Utils ──
function $(id) { return document.getElementById(id); }
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getRanges(bs) {
  const qs = currentQs();
  if (qs.length === 0) return [];

  // Chapter mode: return one entry per chapter present in the pool
  if (splitByChapter) {
    const titles = (SUBJECTS[currentSubject] && SUBJECTS[currentSubject].chapters) || {};
    const order  = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];
    const seen   = new Set();
    const ranges = [];
    for (const ch of order) {
      const count = qs.filter(q => q.chapter === ch).length;
      if (count > 0) {
        ranges.push({
          start: 0, end: 0, key: ch,
          label: `${titles[ch] || ('Chương ' + ch.replace('ch',''))}  (${count} câu)`
        });
        seen.add(ch);
      }
    }
    // Any chapter ids not in the standard order
    for (const q of qs) {
      if (q.chapter && !seen.has(q.chapter)) {
        const count = qs.filter(x => x.chapter === q.chapter).length;
        ranges.push({ start: 0, end: 0, key: q.chapter, label: `${titles[q.chapter] || q.chapter}  (${count} câu)` });
      }
    }
    return ranges;
  }

  if (bs >= qs.length) return [{
    start: 0, end: qs.length,
    label: `Tất cả — Câu 1 → ${qs[qs.length - 1].num} (${qs.length} câu)`
  }];
  const r = [];
  for (let i = 0; i < qs.length; i += bs) {
    const end = Math.min(i + bs, qs.length);
    r.push({ start: i, end, label: `Câu ${qs[i].num} → ${qs[end - 1].num}  (${end - i} câu)` });
  }
  return r;
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  $('theme-toggle').style.display = id === 'home' ? '' : 'none';
  window.scrollTo(0, 0);
}

// ── Home: batch + range ──
function updateRangeVisibility() {
  if (splitByChapter) {
    $('range-row').style.display = 'block';
    return;
  }
  $('range-row').style.display = (randomMode || batchSize >= currentQs().length) ? 'none' : 'block';
}

function buildRanges() {
  const sel = $('range-sel');
  const ranges = getRanges(batchSize);
  sel.innerHTML = ranges.map((r, i) => `<option value="${i}">${r.label}</option>`).join('');
  rangeIdx = 0;
  updateRangeVisibility();
}

// ── Subjects ──
function initSubjects() {
  // Build subject dropdown in declared order
  const sel = $('subject-sel');
  const order = (typeof SUBJECT_ORDER !== 'undefined' && SUBJECT_ORDER.length)
    ? SUBJECT_ORDER
    : Object.keys(SUBJECTS);
  const def = (typeof DEFAULT_SUBJECT !== 'undefined') ? DEFAULT_SUBJECT : order[0];

  sel.innerHTML = order.map(k => {
    const s = SUBJECTS[k];
    const n = s && s.questions ? s.questions.length : 0;
    return `<option value="${k}">${s ? s.name : k}${n ? '' : ' (chưa có dữ liệu)'}</option>`;
  }).join('');

  // Default if available, else first that has data
  const hasData = order.filter(k => SUBJECTS[k] && SUBJECTS[k].questions.length > 0);
  currentSubject = SUBJECTS[def] && SUBJECTS[def].questions.length > 0
    ? def
    : (hasData[0] || order[0]);
  sel.value = currentSubject;

  updateSubjectUI();
}

function updateSubjectUI() {
  const qs = currentQs();
  $('brand-count').textContent = `${qs.length} CÂU`;

  // "Tất cả" button gets the current subject's total
  const allBtn = $('count-all');
  if (allBtn) allBtn.dataset.count = qs.length;

  // "Theo chương" button visibility (depends on subject chapters + mode)
  updateChapterBtnVisibility();

  // Empty-state banner
  const empty = $('empty-banner');
  const startBtn = $('btn-start');
  if (qs.length === 0) {
    empty.style.display = '';
    startBtn.disabled = true;
    startBtn.style.opacity = '0.4';
    startBtn.style.pointerEvents = 'none';
    $('range-row').style.display = 'none';
  } else {
    empty.style.display = 'none';
    startBtn.disabled = false;
    startBtn.style.opacity = '';
    startBtn.style.pointerEvents = '';
  }

  buildRanges();
}

$('subject-sel').addEventListener('change', e => {
  currentSubject = e.target.value;
  // Reset chapter mode when switching subjects
  splitByChapter = false;
  currentChapter = null;
  // Clamp batchSize to new subject size
  const qs = currentQs();
  if (batchSize > qs.length && qs.length > 0) {
    // Reset to first fixed option
    const firstFixed = document.querySelector('.count-btn:not(#count-all):not(#count-chapter)');
    if (firstFixed) {
      batchSize = parseInt(firstFixed.dataset.count);
      document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
      firstFixed.classList.add('active');
    }
  }
  updateSubjectUI();
});

initSubjects();

function updateChapterBtnVisibility() {
  const chapterBtn = $('count-chapter');
  if (!chapterBtn) return;
  // Show only when: not random mode AND subject has chapters
  const hasChapters = currentQs().some(q => q.chapter);
  chapterBtn.style.display = (!randomMode && hasChapters) ? '' : 'none';
  // If we just hid it while it was active, fall back to "25"
  if (chapterBtn.style.display === 'none' && splitByChapter) {
    splitByChapter = false;
    currentChapter = null;
    batchSize = 25;
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    const first = document.querySelector('.count-btn:not(#count-all):not(#count-chapter)');
    if (first) first.classList.add('active');
    buildRanges();
  }
}

document.querySelectorAll('.mode-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    randomMode = tab.dataset.mode === 'rand';
    if (randomMode) {
      shuffleQ = true; shuffleA = true;
      $('shuf-q').checked = true;
      $('shuf-a').checked = true;
      updateRangeVisibility();
    } else {
      shuffleQ = false; shuffleA = false;
      $('shuf-q').checked = false;
      $('shuf-a').checked = false;
      buildRanges();
    }
    updateChapterBtnVisibility();
  });
});

document.querySelectorAll('.count-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.count;
    if (v === 'chapter') {
      // Split-by-chapter mode: repopulate range-sel with chapters
      splitByChapter = true;
      currentChapter = null;
      buildRanges();
      updateRangeVisibility();
    } else {
      splitByChapter = false;
      currentChapter = null;
      batchSize = parseInt(v);
      if (randomMode) {
        updateRangeVisibility();
      } else {
        buildRanges();
      }
    }
  });
});

$('range-sel').addEventListener('change', e => {
  rangeIdx = parseInt(e.target.value);
  if (splitByChapter) {
    const ranges = getRanges(batchSize);
    currentChapter = ranges[rangeIdx] ? ranges[rangeIdx].key : null;
  }
});
$('shuf-q').addEventListener('change', e => { shuffleQ = e.target.checked; });
$('shuf-a').addEventListener('change', e => { shuffleA = e.target.checked; });

// ── Start ──
function startQuiz() {
  const qs = currentQs();
  if (qs.length === 0) return;
  let batch;
  let pool = qs;

  if (splitByChapter) {
    // Narrow pool to selected chapter
    rangeIdx = parseInt($('range-sel').value || 0);
    const ranges = getRanges(batchSize);
    const range = ranges[Math.min(rangeIdx, ranges.length - 1)];
    currentChapter = range ? range.key : null;
    pool = currentChapter ? qs.filter(q => q.chapter === currentChapter) : qs;
    if (randomMode) {
      batch = shuffle(pool).slice(0, batchSize);
    } else {
      // Whole chapter (no sub-range slicing for v1)
      batch = pool.slice();
      if (shuffleQ) batch = shuffle(batch);
    }
  } else if (randomMode) {
    batch = shuffle(qs).slice(0, batchSize);
  } else {
    rangeIdx = parseInt($('range-sel').value || 0);
    const ranges = getRanges(batchSize);
    const range = ranges[Math.min(rangeIdx, ranges.length - 1)];
    batch = qs.slice(range.start, range.end);
    if (shuffleQ) batch = shuffle(batch);
  }

  quizQs = batch.map(q => {
    let opts = [{ key: 'a', text: q.a }, { key: 'b', text: q.b }, { key: 'c', text: q.c }, { key: 'd', text: q.d }];
    if (shuffleA) opts = shuffle(opts);
    return { num: q.num, question: q.q, opts, ans: q.ans };
  });

  cur = 0; okCount = 0; badCount = 0; answered = false; history = [];
  showScreen('quiz');
  renderQ();
}

$('btn-start').addEventListener('click', startQuiz);
$('btn-back').addEventListener('click', () => showScreen('home'));
$('btn-home2').addEventListener('click', () => showScreen('home'));
$('btn-retry').addEventListener('click', startQuiz);

// ── Render question ──
function renderQ() {
  const q = quizQs[cur];
  const total = quizQs.length;
  const pos = cur + 1;

  $('qc-cur').textContent = pos;
  $('qc-tot').textContent = total;
  $('sc-ok').textContent = okCount;
  $('sc-bad').textContent = badCount;
  $('pbar').style.width = ((pos - 1) / total * 100) + '%';
  $('q-text').textContent = q.question;

  const posLabels = ['A', 'B', 'C', 'D'];
  const container = $('options');
  container.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.dataset.key = opt.key;
    btn.style.animationDelay = (i * 0.06) + 's';
    btn.innerHTML = `<span class="opt-key">${posLabels[i]}</span><span class="opt-text">${opt.text}</span>`;
    btn.addEventListener('click', () => answer(opt.key, q));
    container.appendChild(btn);
  });

  $('btn-next').className = 'next-btn';
  $('btn-next').textContent = 'Câu tiếp theo →';
  answered = false;
}

// ── Answer ──
function answer(selected, q) {
  if (answered) return;
  answered = true;

  const isOk = selected === q.ans;
  if (isOk) okCount++; else badCount++;
  $('sc-ok').textContent = okCount;
  $('sc-bad').textContent = badCount;

  const selectedOpt = q.opts.find(o => o.key === selected);
  const correctOpt = q.opts.find(o => o.key === q.ans);

  history.push({
    num: q.num,
    question: q.question,
    selectedKey: selected,
    selectedText: selectedOpt ? selectedOpt.text : '',
    correctKey: q.ans,
    correctText: correctOpt ? correctOpt.text : '',
    isOk
  });

  $('options').querySelectorAll('.opt-btn').forEach(btn => {
    btn.disabled = true;
    const keyEl = btn.querySelector('.opt-key');
    const key = btn.dataset.key;
    if (key === q.ans) {
      btn.classList.add('state-correct');
      keyEl.textContent = '✓';
    } else if (key === selected && !isOk) {
      btn.classList.add('state-wrong');
      keyEl.textContent = '✗';
    }
  });

  const nextBtn = $('btn-next');
  nextBtn.classList.add('show');
  if (cur === quizQs.length - 1) nextBtn.textContent = 'Xem kết quả →';
}

$('btn-next').addEventListener('click', () => {
  if (cur < quizQs.length - 1) {
    cur++;
    renderQ();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    showResult();
  }
});

// ── Result / Summary ──
let activeFilter = 'all';

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildReviewList(filter) {
  activeFilter = filter;
  document.querySelectorAll('.f-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === filter));

  const items = filter === 'all' ? history : filter === 'ok' ? history.filter(h => h.isOk) : history.filter(h => !h.isOk);
  const container = $('review-list');
  container.innerHTML = '';

  if (items.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px 0;font-size:14px">Không có câu nào</div>`;
    return;
  }

  items.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'rev-item ' + (item.isOk ? 'item-ok' : 'item-bad');
    div.style.animationDelay = (idx * 0.03) + 's';
    div.style.animation = 'fadeUp .25s ease both';

    let answersHtml = `
      <div class="rev-ans-row ${item.isOk ? 'row-ok' : 'row-bad'}">
        <span class="rev-text">${escHtml(item.selectedText)}</span>
        <span class="rev-icon">${item.isOk ? '✓' : '✗'}</span>
      </div>`;

    if (!item.isOk) {
      answersHtml += `
      <div class="rev-ans-row row-ok">
        <span class="rev-text">${escHtml(item.correctText)}</span>
        <span class="rev-icon">✓</span>
      </div>`;
    }

    div.innerHTML = `
      <div class="rev-top">
        <span class="rev-num">Câu ${item.num}</span>
        <span class="rev-status ${item.isOk ? 'sok' : 'sbad'}">${item.isOk ? '✓ Đúng' : '✗ Sai'}</span>
      </div>
      <div class="rev-q">${escHtml(item.question)}</div>
      <div class="rev-answers">${answersHtml}</div>`;

    container.appendChild(div);
  });
}

document.querySelectorAll('.f-tab').forEach(tab => {
  tab.addEventListener('click', () => buildReviewList(tab.dataset.filter));
});

// ── Theme ──
(function() {
  const html = document.documentElement;
  const saved = localStorage.getItem('theme');

  function applyTheme(theme) {
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
  }

  applyTheme(saved || 'dark');

  $('theme-toggle').addEventListener('click', () => {
    const isLight = html.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
})();

function showResult() {
  const total = quizQs.length;
  const pct = Math.round(okCount / total * 100);
  const emoji = pct >= 90 ? '🏆' : pct >= 75 ? '🎯' : pct >= 60 ? '📖' : pct >= 40 ? '💪' : '🔄';
  const title = pct >= 90 ? 'Xuất sắc!' : pct >= 75 ? 'Hoàn thành tốt!' : pct >= 60 ? 'Khá tốt!' : pct >= 40 ? 'Cần cố gắng thêm!' : 'Tiếp tục ôn luyện!';

  $('res-emoji').textContent = emoji;
  $('res-title').textContent = title;
  $('res-desc').textContent = `Hoàn thành ${total} câu · ${okCount} đúng, ${badCount} sai`;
  $('res-ok').textContent = okCount;
  $('res-bad').textContent = badCount;
  $('res-pct').textContent = pct + '%';

  const wrongCount = history.filter(h => !h.isOk).length;
  $('rh-counts').textContent = `${total} câu · ${wrongCount} câu sai`;

  buildReviewList('all');
  showScreen('result');
}
