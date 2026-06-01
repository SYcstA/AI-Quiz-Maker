const backendUrl = 'https://quiz.soosvaldo.my.id/api/generate-quiz.php';

// Named logout handler to prevent duplicate event listeners
let _logoutHandler = null;

const el = {
  generateBtn: document.getElementById('generateButton'),
  resetBtn: document.getElementById('resetButton'),
  resetBtn2: document.getElementById('resetButton2'),
  backBtn: document.getElementById('backButton'),
  regenerateBtn: document.getElementById('regenerateButton'),
  scoreArea: document.getElementById('scoreArea'),
  scoreValue: document.getElementById('scoreValue'),
  scoreTotal: document.getElementById('scoreTotal'),
  downloadResults: document.getElementById('downloadResults'),
  materi: document.getElementById('materi'),
  fileInput: document.getElementById('fileInput'),
  dropZone: document.getElementById('dropZone'),
  fileName: document.getElementById('fileName'),
  clearFileButton: document.getElementById('clearFileButton'),
  quizContainer: document.getElementById('quizContainer'),
  statusArea: document.getElementById('statusArea'),
  jumlahSoal: document.getElementById('jumlahSoal'),
  charCount: document.getElementById('charCount'),
  themeToggle: document.getElementById('themeToggle'),
  googleSignInBtn: document.getElementById('googleSignInBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  userEmail: document.getElementById('userEmail'),
  dragOverlay: document.getElementById('dragOverlay'),
  tabText: document.getElementById('tab-text'),
  tabFile: document.getElementById('tab-file'),
  contentText: document.getElementById('tab-content-text'),
  contentFile: document.getElementById('tab-content-file'),
  inputScreen: document.getElementById('inputScreen'),
  quizScreen: document.getElementById('quizScreen'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingBar: document.getElementById('loadingBar'),
  loadingPercent: document.getElementById('loadingPercent'),
  authOverlay: document.getElementById('authOverlay'),
  googleSignInBtnModal: document.getElementById('googleSignInBtnModal'),
  regenModal: document.getElementById('regenModal'),
  regenFocusAll: document.getElementById('regenFocusAll'),
  regenFocusImprovement: document.getElementById('regenFocusImprovement'),
  regenDiffEasy: document.getElementById('regenDiffEasy'),
  regenDiffMedium: document.getElementById('regenDiffMedium'),
  regenDiffHard: document.getElementById('regenDiffHard'),
  regenJumlahSoal: document.getElementById('regenJumlahSoal'),
  regenCancel: document.getElementById('regenCancel'),
  regenConfirm: document.getElementById('regenConfirm'),
  retryLoginButton: document.getElementById('retryLoginButton'),
  diffEasy: document.getElementById('diffEasy'),
  diffMedium: document.getElementById('diffMedium'),
  diffHard: document.getElementById('diffHard'),
  focusAll: document.getElementById('focusAll'),
  focusImprovement: document.getElementById('focusImprovement'),
};

let activeTab = 'text';
let currentQuiz = [];
let lastState = { type: 'text', materiText: '', jumlahSoal: 5, difficulty: 'medium' };
let selectedFile = null;
let authToken = localStorage.getItem('google_id_token') || null;
let authUser = JSON.parse(localStorage.getItem('google_user') || 'null');
const SESSION_MAX_AGE_MS = 1 * 60 * 60 * 1000;
let sessionTs = parseInt(localStorage.getItem('google_session_ts') || '0');
let difficulty = 'medium';
let focus = 'all';

// --- Frontend Rate Limit ---
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 3 * 60 * 1000;
function _rateKey() { return `rate_ts_${authUser?.sub || 'anon'}`; }
function canConsumeRateLimit() {
  const key = _rateKey();
  const now = Date.now();
  let arr = [];
  try { arr = JSON.parse(localStorage.getItem(key) || '[]'); } catch { arr = []; }
  arr = arr.filter(ts => (now - ts) < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) return false;
  arr.push(now);
  localStorage.setItem(key, JSON.stringify(arr));
  return true;
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupTabs();
  setupFileDrop();
  setupCharCounter();
  setupJumlahSoalLimit();
  setupDifficulty();
  setupRegenerateModal();
  setupAuth();
  setupAuthRetry();
  setupQuickButtons();
  setupHomeJumlahWarning();
  setupConfirmModal();
  setupTutorial();
  el.generateBtn.addEventListener('click', handleGenerateQuiz);
  el.resetBtn.addEventListener('click', () => showConfirm('Reset all data?', "Are you sure you want to reset? All your inserted material and uploaded files will be permanently deleted. If you just want to generate a different quiz with the same material, click 'Back' instead.", handleReset));
  if (el.downloadResults) el.downloadResults.addEventListener('click', downloadResults);
  if (el.backBtn) el.backBtn.addEventListener('click', () => showConfirm('Are you sure?', 'Do you want to go back to the main screen?', handleBack));
  if (el.regenerateBtn) el.regenerateBtn.addEventListener('click', openRegenModal);
  if (el.resetBtn2) el.resetBtn2.addEventListener('click', () => showConfirm('Reset all data?', "Are you sure you want to reset? All your inserted material and uploaded files will be permanently deleted.", handleReset));
  if (el.clearFileButton) el.clearFileButton.addEventListener('click', handleClearFile);
});

// --- THEME ---
function setupTheme() {
  const saved = localStorage.getItem('theme');
  const isDark = saved ? saved === 'dark' : false;
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeIcon(isDark);
  el.themeToggle.addEventListener('click', () => {
    const isDarkNow = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    updateThemeIcon(isDarkNow);
  });
}

function updateThemeIcon(isDark) {
  el.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// --- TABS (Card Style) ---
function setupTabs() {
  el.tabText.addEventListener('click', () => switchTab('text'));
  el.tabFile.addEventListener('click', () => switchTab('file'));
  switchTab(activeTab);
}

function switchTab(tab) {
  activeTab = tab;
  const activeCls = ['border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-blue-700', 'dark:text-blue-300'];
  const inactiveCls = ['border-gray-300', 'dark:border-gray-600', 'bg-white', 'dark:bg-slate-700', 'text-gray-600', 'dark:text-gray-300'];
  [el.tabText, el.tabFile].forEach(btn => {
    btn.classList.remove(...activeCls, ...inactiveCls);
    const isActive = btn.id === 'tab-text' ? tab === 'text' : tab === 'file';
    btn.classList.add('flex', 'flex-col', 'items-center', 'gap-2', 'p-4', 'rounded-xl', 'border-2', 'transition-all', 'duration-200', ...(isActive ? activeCls : inactiveCls));
  });
  el.contentText.classList.toggle('hidden', tab !== 'text');
  el.contentFile.classList.toggle('hidden', tab !== 'file');
}

// --- CHAR COUNTER ---
function setupCharCounter() {
  el.materi.addEventListener('input', updateCharCount);
}

function updateCharCount() {
  const len = el.materi.value.length;
  el.charCount.textContent = `${len} / 50+`;
  el.charCount.className = len >= 50 ? 'text-green-600' : 'text-red-600';
}

// --- JUMLAH SOAL LIMIT ---
function setupJumlahSoalLimit() {
  const clamp = () => {
    let val = parseInt(el.jumlahSoal.value || '0');
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 30) val = 30;
    el.jumlahSoal.value = val;
  };
  el.jumlahSoal.addEventListener('input', clamp);
  el.jumlahSoal.addEventListener('change', clamp);
}

// --- DIFFICULTY ---
function setupDifficulty() {
  const setActive = (level) => {
    difficulty = level;
    const activeCls = ['bg-blue-600','dark:bg-indigo-500','text-white'];
    const inactiveCls = ['bg-gray-200','dark:bg-slate-700','text-gray-800','dark:text-gray-100'];
    const btns = [el.diffEasy, el.diffMedium, el.diffHard];
    const lvls = ['easy','medium','hard'];
    btns.forEach((b, idx) => {
      if (!b) return;
      b.classList.remove(...activeCls, ...inactiveCls);
      const isActive = lvls[idx] === level;
      b.classList.add('px-3','py-2','rounded-full','border','border-gray-300','dark:border-gray-600', ...(isActive ? activeCls : inactiveCls));
    });
  };
  if (el.diffEasy) el.diffEasy.addEventListener('click', () => setActive('easy'));
  if (el.diffMedium) el.diffMedium.addEventListener('click', () => setActive('medium'));
  if (el.diffHard) el.diffHard.addEventListener('click', () => setActive('hard'));
  setActive('medium');
}

// --- FILE DROP ---
function setupFileDrop() {
  el.dropZone.className = 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition';
  ['dragenter', 'dragover'].forEach(type => el.dropZone.addEventListener(type, (e) => {
    e.preventDefault(); e.stopPropagation();
    try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch {}
    el.dropZone.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400');
  }));
  ['dragleave', 'drop'].forEach(type => el.dropZone.addEventListener(type, () => {
    el.dropZone.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400');
  }));
  const showOverlay = () => { if (el.dragOverlay) el.dragOverlay.classList.remove('hidden'); };
  const hideOverlay = () => { if (el.dragOverlay) el.dragOverlay.classList.add('hidden'); };
  document.addEventListener('dragover', (e) => { e.preventDefault(); }, { capture: true });
  window.addEventListener('dragover', (e) => { e.preventDefault(); }, { capture: true });
  window.addEventListener('dragenter', (e) => {
    try { if (Array.from(e.dataTransfer?.types || []).includes('Files')) showOverlay(); } catch { showOverlay(); }
  }, { capture: true });
  document.addEventListener('dragleave', () => hideOverlay(), { capture: true });
  window.addEventListener('dragend', () => hideOverlay(), { capture: true });
  document.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); hideOverlay(); if (e.dataTransfer?.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); }, { capture: true });
  el.dropZone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer?.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); });
  el.dropZone.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', () => { if (el.fileInput.files[0]) handleFileSelect(el.fileInput.files[0]); });
}

function handleFileSelect(file) {
  if (!/\.(pdf|docx)$/i.test(file.name)) return showStatus('Format not supported.', 'error');
  if (file.size > 10 * 1024 * 1024) return showStatus('File max 10MB.', 'error');
  selectedFile = file;
  el.fileName.textContent = `Selected: ${file.name}`;
  if (el.clearFileButton) el.clearFileButton.classList.remove('hidden');
}

// --- AUTH ---
function setupAuth() {
  const renderButtons = (clientId) => {
    if (window.google) {
      google.accounts.id.initialize({ client_id: clientId, callback: onGoogleSignIn, auto_select: false });
      if (el.googleSignInBtn) google.accounts.id.renderButton(el.googleSignInBtn, { theme: 'filled_blue', size: 'medium', shape: 'rectangular', text: 'signin_with' });
      if (el.googleSignInBtnModal) google.accounts.id.renderButton(el.googleSignInBtnModal, { theme: 'filled_blue', size: 'medium', shape: 'rectangular', text: 'signin_with' });
      try { google.accounts.id.prompt(); } catch {}
    }
    updateAuthUI();
  };
  const updateAuthUI = () => {
    const valid = isSessionValid();
    if (valid && authUser && el.logoutBtn) {
      updateAuthDisplay();
      el.logoutBtn.classList.remove('hidden');
      if (el.googleSignInBtn) el.googleSignInBtn.classList.add('hidden');
      if (_logoutHandler) el.logoutBtn.removeEventListener('click', _logoutHandler);
      _logoutHandler = handleLogout;
      el.logoutBtn.addEventListener('click', _logoutHandler);
      showAuthOverlay(false);
    } else {
      hideAuthDisplay();
      if (el.logoutBtn) el.logoutBtn.classList.add('hidden');
      if (el.googleSignInBtn) el.googleSignInBtn.classList.remove('hidden');
      showAuthOverlay(true);
      showStatus('Google sign-in is required to use the app.', 'warning');
    }
  };
  fetch('/api/config.php').then(r => r.json()).then(cfg => {
    const clientId = cfg.google_client_id;
    if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID') {
      return fetch('/config.ini').then(resp => resp.text()).then(txt => {
        const m = txt.match(/GOOGLE_CLIENT_ID\s*=\s*"([^"]+)"/);
        const fallbackId = m ? m[1] : null;
        if (fallbackId) { renderButtons(fallbackId); showAuthOverlay(false); showStatus('Loaded Google Client ID from local config.', 'success'); }
        else { showAuthOverlay(true); showStatus('Google Client ID missing.', 'error'); }
      }).catch(() => { showAuthOverlay(true); showStatus('Unable to read config.ini.', 'error'); });
    }
    renderButtons(clientId);
  }).catch(() => {
    fetch('/config.ini').then(resp => resp.text()).then(txt => {
      const m = txt.match(/GOOGLE_CLIENT_ID\s*=\s*"([^"]+)"/);
      const fallbackId = m ? m[1] : null;
      if (fallbackId) { renderButtons(fallbackId); showAuthOverlay(false); showStatus('Loaded Google Client ID from local config.', 'success'); }
      else { showAuthOverlay(true); showStatus('Failed to load Google Client ID.', 'error'); }
    }).catch(() => { showAuthOverlay(true); showStatus('Failed to load Google Client ID.', 'error'); });
  });
}

function onGoogleSignIn(response) {
  const idToken = response?.credential;
  if (!idToken) return;
  authToken = idToken;
  const parts = idToken.split('.');
  let user = null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    user = { email: payload.email, name: payload.name, sub: payload.sub, picture: payload.picture || null };
  } catch {}
  authUser = user || { name: 'User', picture: null };
  localStorage.setItem('google_id_token', authToken);
  localStorage.setItem('google_user', JSON.stringify(authUser));
  sessionTs = Date.now();
  localStorage.setItem('google_session_ts', String(sessionTs));
  updateAuthDisplay();
  showAuthOverlay(false);
  showStatus('Login successful!', 'success');
}

function handleLogout() {
  authToken = null; authUser = null;
  localStorage.removeItem('google_id_token'); localStorage.removeItem('google_user'); localStorage.removeItem('google_session_ts');
  sessionTs = 0;
  if (window.google && google.accounts?.id) google.accounts.id.disableAutoSelect();
  hideAuthDisplay();
  if (el.logoutBtn) el.logoutBtn.classList.add('hidden');
  showAuthOverlay(true);
  showStatus('You have logged out.', 'warning');
}

function isSessionValid() {
  return !!authToken && !!sessionTs && (Date.now() - sessionTs < SESSION_MAX_AGE_MS);
}

function showAuthOverlay(show) {
  if (!el.authOverlay) return;
  el.authOverlay.classList.toggle('hidden', !show);
  if (el.generateBtn) el.generateBtn.disabled = show;
  if (el.regenerateBtn) el.regenerateBtn.disabled = show;
}

// --- GENERATE QUIZ ---
async function handleGenerateQuiz() {
  let materi = '';
  const file = selectedFile || el.fileInput.files[0];
  const jumlahSoal = parseInt(el.jumlahSoal.value);
  if (!isSessionValid()) { showAuthOverlay(true); return showStatus('Please sign in.', 'error'); }
  if (jumlahSoal > 30) return showStatus('Max 30 questions.', 'error');
  if (activeTab === 'text') {
    materi = el.materi.value.trim();
    if (materi.length < 50) return showStatus('Minimum 50 characters.', 'error');
    if (containsAdultContent(materi)) return showStatus('18+ content not allowed.', 'error');
  } else if (!file) return showStatus('Please select a file.', 'error');
  disableBtn(true);
  if (el.loadingOverlay) showLoading(true);
  setLoadingProgress(activeTab === 'file' ? 15 : 10);
  showStatus(activeTab === 'file' ? 'Extracting...' : 'Generating quiz...', 'loading');
  showSkeleton();
  try {
    if (activeTab === 'file' && file) {
      setLoadingProgress(35);
      materi = await extractTextFromFile(file);
      if (materi.trim().length < 50) throw new Error('Text too short.');
      if (containsAdultContent(materi)) throw new Error('18+ content not allowed.');
    }
    if (!canConsumeRateLimit()) throw new Error('Too frequent: max 10 requests per 3 minutes.');
    setLoadingProgress(60);
    const res = await fetchWithBackoff(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ materi, jumlahSoal, difficulty })
    });
    setLoadingProgress(80);
    const data = await res.json();
    if (data?.error) { const detail = data.details ? ` (${data.details})` : ''; throw new Error(data.error + detail); }
    const questions = normalizeQuizResponse(data, jumlahSoal);
    currentQuiz = questions;
    lastState = { type: activeTab, materiText: materi, jumlahSoal, difficulty };
    displayQuiz(questions);
    if (el.downloadResults) el.downloadResults.classList.remove('hidden');
    if (questions.length < jumlahSoal) showStatus(`Quiz completed (${questions.length}/${jumlahSoal} questions).`, 'warning');
    else showStatus('Quiz ready!', 'success');
    setLoadingProgress(95);
    goToQuizScreen();
  } catch (err) { showStatus(`Error: ${err.message}`, 'error'); }
  finally { disableBtn(false); if (el.loadingOverlay) showLoading(false); }
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function displayQuiz(questions) {
  el.quizContainer.innerHTML = '';
  el.scoreValue.textContent = '0';
  el.scoreTotal.textContent = questions.length;
  el.scoreArea.classList.remove('hidden');
  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600';
    const opts = shuffleArray([...q.answerOptions]);
    div.innerHTML = [
      '<h3 class="text-lg font-semibold mb-4">', (i + 1), '. ', escapeHTML(q.question), '</h3>',
      '<div class="space-y-3" id="opts-', i, '">',
      opts.map(o => [
        '<button class="quiz-option w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition" data-correct="', o.isCorrect, '">',
        '<span>', escapeHTML(o.text), '</span>',
        '<div class="rationale hidden text-sm text-gray-600 dark:text-gray-300 mt-2">', escapeHTML(o.rationale), '</div>',
        '</button>'
      ].join('')).join(''),
      '</div>'
    ].join('');
    el.quizContainer.appendChild(div);
    document.querySelectorAll(`#opts-${i} .quiz-option`).forEach(btn => { btn.addEventListener('click', () => selectOption(btn, `#opts-${i}`)); });
  });
}

function selectOption(btn, containerId) {
  const container = document.querySelector(containerId);
  const isCorrect = btn.dataset.correct === 'true';
  let score = parseInt(el.scoreValue.textContent);
  const btns = container.querySelectorAll('.quiz-option');
  btns.forEach(b => {
    b.disabled = true;
    const rational = b.querySelector('.rationale');
    if (rational) rational.classList.remove('hidden');
    if (b.dataset.correct === 'true') b.classList.add('border-green-600','bg-green-50','dark:bg-green-900/30','text-green-700','dark:text-green-300');
    else b.classList.add('opacity-90');
  });
  if (!isCorrect) btn.classList.add('border-red-600','bg-red-50','dark:bg-red-900/30','text-red-700','dark:text-red-300');
  el.scoreValue.textContent = String(score + (isCorrect ? 1 : 0));
  if (parseInt(el.scoreValue.textContent) === parseInt(el.scoreTotal.textContent)) setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }), 500);
}

function downloadResults() {
  if (!currentQuiz.length) return;
  const text = currentQuiz.map((q, i) => {
    const correct = q.answerOptions.find(o => o.isCorrect);
    return `${i + 1}. ${q.question}\n   ${q.answerOptions.map(o => `${o.isCorrect ? '✓' : '○'} ${o.text}`).join('\n   ')}\n   ${correct ? 'Answer: ' + correct.text : ''}\n   Rationale: ${correct ? correct.rationale : ''}`;
  }).join('\n\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `quiz-results-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function showStatus(msg, type) {
  const area = el.statusArea;
  area.textContent = msg;
  area.className = 'p-4 rounded-lg text-center transition-all hidden';
  if (type === 'loading') area.className += ' bg-blue-100 text-blue-700';
  if (type === 'success') area.className += ' bg-green-100 text-green-700';
  if (type === 'error') area.className += ' bg-red-100 text-red-700';
  if (type === 'warning') area.className += ' bg-yellow-100 text-yellow-800';
  area.classList.remove('hidden');
  if (type !== 'loading') setTimeout(() => area.classList.add('hidden'), 5000);
}

function disableBtn(disabled) {
  el.generateBtn.disabled = disabled;
  el.generateBtn.innerHTML = disabled ? '<i class="fas fa-spinner fa-spin"></i> Processing...' : '<i class="fas fa-sparkles"></i> Generate Quiz';
}

let _loadingInterval = null;
let _loadingProgress = 0;

function setLoadingProgress(p) {
  _loadingProgress = Math.max(0, Math.min(100, Math.floor(p)));
  if (el.loadingBar) el.loadingBar.style.width = `${_loadingProgress}%`;
  if (el.loadingPercent) el.loadingPercent.textContent = `${_loadingProgress}%`;
}

function showLoading(show) {
  if (!el.loadingOverlay) return;
  el.loadingOverlay.classList.toggle('hidden', !show);
  if (show) {
    clearInterval(_loadingInterval);
    setLoadingProgress(_loadingProgress || 5);
    _loadingInterval = setInterval(() => {
      const target = 90;
      if (_loadingProgress < target) {
        const step = _loadingProgress < 40 ? 3 : _loadingProgress < 70 ? 2 : 1;
        setLoadingProgress(_loadingProgress + step);
      }
    }, 400);
  } else { clearInterval(_loadingInterval); setLoadingProgress(100); setTimeout(() => setLoadingProgress(0), 600); }
}

function showSkeleton() {
  el.quizContainer.innerHTML = '<div class="space-y-6">' + Array(3).fill(0).map(() => `
    <div class="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg animate-pulse">
      <div class="h-6 rounded bg-gray-300 dark:bg-gray-600 mb-4 w-3/4"></div>
      <div class="space-y-3">${Array(4).fill(0).map(() => '<div class="h-12 rounded bg-gray-200 dark:bg-gray-600"></div>').join('')}</div>
    </div>`).join('') + '</div>';
}

function handleReset() {
  el.materi.value = '';
  el.fileInput.value = '';
  selectedFile = null;
  el.fileName.textContent = '';
  if (el.clearFileButton) el.clearFileButton.classList.add('hidden');
  el.jumlahSoal.value = 5;
  el.quizContainer.innerHTML = '';
  el.scoreArea.classList.add('hidden');
  if (el.downloadResults) el.downloadResults.classList.add('hidden');
  el.statusArea.classList.add('hidden');
  currentQuiz = [];
  lastState = { type: 'text', materiText: '', jumlahSoal: 5, difficulty: 'medium' };
  el.charCount.textContent = '0 / 50+';
  el.charCount.className = 'text-red-600';
  goToInputScreen();
}

function handleClearFile() {
  selectedFile = null; el.fileInput.value = ''; el.fileName.textContent = ''; el.clearFileButton.classList.add('hidden');
}

function handleBack() {
  el.quizScreen.classList.add('hidden');
  el.inputScreen.classList.remove('hidden');
  // Update char counter to reflect preserved material
  if (el.materi && el.charCount) {
    const len = el.materi.value.length;
    el.charCount.textContent = `${len} / 50+`;
    el.charCount.className = len >= 50 ? 'text-green-600' : 'text-red-600';
  }
}

function goToQuizScreen() {
  el.inputScreen.classList.add('hidden');
  el.quizScreen.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToInputScreen() {
  el.quizScreen.classList.add('hidden');
  el.inputScreen.classList.remove('hidden');
  el.materi.value = '';
  el.charCount.textContent = '0 / 50+';
  el.charCount.className = 'text-red-600';
}

// --- UTILS ---
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

async function fetchWithBackoff(url, options, retries = 3) {
  try {
    const res = await fetch(url, options);
    if (res.status === 429 && retries > 0) { await new Promise(r => setTimeout(r, 1000 * (4 - retries))); return fetchWithBackoff(url, options, retries - 1); }
    return res;
  } catch (err) { if (retries > 0) return fetchWithBackoff(url, options, retries - 1); throw err; }
}

async function extractTextFromFile(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        if (file.name.endsWith('.pdf')) {
          const pdf = await pdfjsLib.getDocument({ data: reader.result }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const content = await page.getTextContent(); text += content.items.map(item => item.str).join(' ') + '\n'; }
          resolve(text);
        } else if (file.name.endsWith('.docx')) { const result = await mammoth.extractRawText({ arrayBuffer: reader.result }); resolve(result.value); }
      } catch (err) { reject(err); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function normalizeQuizResponse(data, targetCount) {
  if (Array.isArray(data?.questions)) return targetCount ? data.questions.slice(0, targetCount) : data.questions;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) { try { const obj = JSON.parse(text); if (Array.isArray(obj.questions)) return targetCount ? obj.questions.slice(0, targetCount) : obj.questions; } catch (e) {} }
  throw new Error('Invalid response format.');
}

// --- REGENERATE MODAL ---
function setupRegenerateModal() {
  if (!el.regenModal || !el.regenerateBtn) return;
  let modalFocus = 'all', modalDiff = 'medium';
  const setActive = (buttons, keys, current) => {
    const activeCls = ['bg-blue-600','dark:bg-indigo-500','text-white'];
    const inactiveCls = ['bg-gray-200','dark:bg-slate-700','text-gray-800','dark:text-gray-100'];
    buttons.forEach((b, idx) => {
      if (!b) return;
      b.classList.remove(...activeCls, ...inactiveCls);
      const isActive = keys[idx] === current;
      b.classList.add('px-3','py-2','rounded-full','border','border-gray-300','dark:border-gray-600', ...(isActive ? activeCls : inactiveCls));
    });
  };
  const focusButtons = [el.regenFocusAll, el.regenFocusImprovement];
  const focusKeys = ['all','improvement'];
  focusButtons.forEach((b, idx) => { if (!b) return; b.addEventListener('click', () => { modalFocus = focusKeys[idx]; setActive(focusButtons, focusKeys, modalFocus); }); });
  setActive(focusButtons, focusKeys, modalFocus);
  const diffButtons = [el.regenDiffEasy, el.regenDiffMedium, el.regenDiffHard];
  const diffKeys = ['easy','medium','hard'];
  diffButtons.forEach((b, idx) => { if (!b) return; b.addEventListener('click', () => { modalDiff = diffKeys[idx]; setActive(diffButtons, diffKeys, modalDiff); }); });
  setActive(diffButtons, diffKeys, modalDiff);
  const regenWarning = document.getElementById('regenWarning');
  const clampRegenCount = () => {
    if (!el.regenJumlahSoal) return;
    let val = parseInt(el.regenJumlahSoal.value || '0');
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 30) { val = 30; if (regenWarning) regenWarning.classList.remove('hidden'); setTimeout(() => { if (regenWarning) regenWarning.classList.add('hidden'); }, 3000); }
    else { if (regenWarning) regenWarning.classList.add('hidden'); }
    el.regenJumlahSoal.value = val;
  };
  if (el.regenJumlahSoal) { el.regenJumlahSoal.addEventListener('input', clampRegenCount); el.regenJumlahSoal.addEventListener('change', clampRegenCount); }
  document.querySelectorAll('.regen-quick-btn').forEach(btn => { btn.addEventListener('click', () => { const count = parseInt(btn.dataset.count); if (el.regenJumlahSoal) { el.regenJumlahSoal.value = count; if (regenWarning) regenWarning.classList.add('hidden'); } }); });
  if (el.regenCancel) el.regenCancel.addEventListener('click', closeRegenModal);
  if (el.regenConfirm) el.regenConfirm.addEventListener('click', () => { clampRegenCount(); const jumlahOpt = parseInt(el.regenJumlahSoal?.value || lastState.jumlahSoal || 5); closeRegenModal(); focus = modalFocus; lastState.difficulty = modalDiff; handleRegenerate({ focus: modalFocus, difficulty: modalDiff, jumlahSoal: jumlahOpt }); });
}

function openRegenModal(e) { if (e) { e.preventDefault(); e.stopImmediatePropagation(); } if (el.regenModal) el.regenModal.classList.remove('hidden'); }
function closeRegenModal() { if (el.regenModal) el.regenModal.classList.add('hidden'); }

async function handleRegenerate(opts = {}) {
  const optJumlah = parseInt(opts.jumlahSoal || lastState.jumlahSoal || 5);
  const optFocus = opts.focus || focus || 'all';
  const optDiff = opts.difficulty || lastState.difficulty || 'medium';
  if (!lastState.materiText || !optJumlah) return showStatus('No context to regenerate.', 'error');
  if (!isSessionValid()) { showAuthOverlay(true); return showStatus('Please sign in.', 'error'); }
  const jumlahSoal = Math.min(optJumlah, 30);
  if (optJumlah > 30) showStatus('Limited to max 30 questions.', 'warning');
  if (containsAdultContent(lastState.materiText)) return showStatus('18+ content not allowed.', 'error');
  disableBtn(true);
  if (el.loadingOverlay) showLoading(true);
  setLoadingProgress(15);
  showStatus('Regenerating quiz...', 'loading');
  showSkeleton();
  try {
    if (!canConsumeRateLimit()) throw new Error('Too frequent: max 10 requests per 3 minutes.');
    setLoadingProgress(60);
    const res = await fetchWithBackoff(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
      body: JSON.stringify({ materi: lastState.materiText, jumlahSoal, difficulty: optDiff, focus: optFocus })
    });
    setLoadingProgress(80);
    const data = await res.json();
    if (data?.error) throw new Error(data.error);
    const questions = normalizeQuizResponse(data, jumlahSoal);
    currentQuiz = questions;
    displayQuiz(questions);
    setLoadingProgress(95);
    if (questions.length < jumlahSoal) showStatus(`New quiz (${questions.length}/${jumlahSoal} questions).`, 'warning');
    else showStatus('New quiz ready!', 'success');
  } catch (err) { showStatus(`Error: ${err.message}`, 'error'); }
  finally { disableBtn(false); if (el.loadingOverlay) showLoading(false); }
}

// --- AUTH RETRY ---
function setupAuthRetry() {
  if (!el.retryLoginButton) return;
  el.retryLoginButton.addEventListener('click', () => {
    const src = 'https://accounts.google.com/gsi/client';
    const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.includes('accounts.google.com/gsi/client'));
    if (existing) existing.remove();
    const s = document.createElement('script'); s.src = src; s.async = true; s.defer = true;
    s.onload = () => { try { setupAuth(); } catch {} };
    s.onerror = () => showStatus('Failed to load Google Sign-In script.', 'error');
    document.head.appendChild(s);
    setTimeout(() => { try { setupAuth(); } catch {} }, 1000);
  });
}

// --- QUICK BUTTONS ---
function setupQuickButtons() {
  document.querySelectorAll('.quick-btn[data-target="jumlahSoal"]').forEach(btn => {
    btn.addEventListener('click', () => { if (el.jumlahSoal) { el.jumlahSoal.value = parseInt(btn.dataset.count); const hw = document.getElementById('homeWarning'); if (hw) hw.classList.add('hidden'); } });
  });
}

// --- HOME NUMBER WARNING ---
function setupHomeJumlahWarning() {
  const hw = document.getElementById('homeWarning');
  if (!el.jumlahSoal || !hw) return;
  const clamp = () => {
    let val = parseInt(el.jumlahSoal.value || '0');
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 30) { val = 30; hw.classList.remove('hidden'); setTimeout(() => hw.classList.add('hidden'), 3000); } else hw.classList.add('hidden');
    el.jumlahSoal.value = val;
  };
  el.jumlahSoal.addEventListener('input', clamp);
  el.jumlahSoal.addEventListener('change', clamp);
}

// --- CONFIRMATION MODAL ---
function setupConfirmModal() {
  // Modal is controlled by showConfirm
}

function showConfirm(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const titleEl = document.getElementById('confirmTitle');
  const msgEl = document.getElementById('confirmMessage');
  const cancelBtn = document.getElementById('confirmCancel');
  const okBtn = document.getElementById('confirmOk');
  if (!modal || !titleEl || !msgEl || !cancelBtn || !okBtn) return;
  titleEl.textContent = title;
  msgEl.textContent = message;
  modal.classList.remove('hidden');
  const content = document.getElementById('confirmModalContent');
  if (content) { content.classList.remove('scale-95'); content.classList.add('scale-100'); }
  const cleanup = () => {
    modal.classList.add('hidden');
    if (content) { content.classList.remove('scale-100'); content.classList.add('scale-95'); }
    cancelBtn.removeEventListener('click', onCancel);
    okBtn.removeEventListener('click', onOk);
    modal.removeEventListener('click', onBackdrop);
  };
  const onCancel = () => cleanup();
  const onOk = () => { cleanup(); if (typeof onConfirm === 'function') onConfirm(); };
  const onBackdrop = (e) => { if (e.target === modal) cleanup(); };
  cancelBtn.addEventListener('click', onCancel);
  okBtn.addEventListener('click', onOk);
  modal.addEventListener('click', onBackdrop);
}

// --- TUTORIAL ---
function setupTutorial() {
  const matches = document.cookie.match(/(?:^|;\s*)quiz_tutorial=([^;]*)/);
  if (matches && matches[1] === 'done') return;

  const overlay = document.getElementById('tutorialOverlay');
  const highlight = document.getElementById('tutorialHighlight');
  const tooltip = document.getElementById('tutorialTooltip');
  const textEl = document.getElementById('tutorialText');
  const counterEl = document.getElementById('tutorialCounter');
  const nextBtn = document.getElementById('tutorialNext');
  const skipBtn = document.getElementById('tutorialSkip');
  const arrow = document.getElementById('tutorialArrow');
  if (!overlay || !highlight || !tooltip || !textEl || !counterEl || !nextBtn || !skipBtn || !arrow) return;

  const homeSteps = [
    { target: '#materi', text: 'Paste or type your study material here. You need at least 50 characters.', pos: 'bottom' },
    { target: '#tab-file', text: 'You can also upload a PDF or DOCX file instead of typing.', pos: 'bottom' },
    { target: '#difficultyGroup', text: 'Choose the difficulty level for your quiz.', pos: 'bottom' },
    { target: '.quick-btn', text: 'Quick-select common amounts or type a custom number (max 30).', pos: 'bottom' },
    { target: '#generateButton', text: 'Click "Generate Quiz" to let AI create your quiz. It only takes a few seconds!', pos: 'top' },
  ];

  let currentStep = 0;

  function showStep(index) {
    const steps = homeSteps;
    if (index >= steps.length) {
      overlay.classList.add('hidden');
      highlight.classList.add('hidden');
      tooltip.classList.add('hidden');
      document.cookie = 'quiz_tutorial=done; max-age=' + (30 * 24 * 60 * 60) + '; path=/';
      return;
    }
    const step = steps[index];
    overlay.classList.remove('hidden');
    const targetEl = document.querySelector(step.target);
    if (!targetEl) { showStep(index + 1); return; }
    const rect = targetEl.getBoundingClientRect();
    highlight.classList.remove('hidden');
    highlight.style.left = (rect.left - 8) + 'px';
    highlight.style.top = (rect.top - 8) + 'px';
    highlight.style.width = (rect.width + 16) + 'px';
    highlight.style.height = (rect.height + 16) + 'px';
    textEl.textContent = step.text;
    counterEl.textContent = `${index + 1} / ${steps.length}`;
    tooltip.classList.remove('hidden');
    const tooltipWidth = 320;
    const tooltipHeight = tooltip.offsetHeight || 140;
    let left, top;
    if (step.pos === 'bottom') {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      top = rect.bottom + 16;
      arrow.className = 'absolute w-3 h-3 bg-white dark:bg-gray-800 rotate-45';
      arrow.style.left = (tooltipWidth / 2 - 6) + 'px';
      arrow.style.top = '-6px';
    } else {
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      top = rect.top - tooltipHeight - 16;
      arrow.className = 'absolute w-3 h-3 bg-white dark:bg-gray-800 rotate-45';
      arrow.style.left = (tooltipWidth / 2 - 6) + 'px';
      arrow.style.bottom = '-6px';
      arrow.style.top = 'auto';
    }
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  nextBtn.addEventListener('click', () => showStep(++currentStep));
  skipBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    highlight.classList.add('hidden');
    tooltip.classList.add('hidden');
    document.cookie = 'quiz_tutorial=done; max-age=' + (30 * 24 * 60 * 60) + '; path=/';
  });

  setTimeout(() => showStep(0), 1500);
}

// --- AUTH DISPLAY HELPERS ---
function updateAuthDisplay() {
  const profile = document.getElementById('userProfile');
  const avatar = document.getElementById('userAvatar');
  const fallback = document.getElementById('avatarFallback');
  const displayName = document.getElementById('userDisplayName');
  const emailDisplay = document.getElementById('userEmailDisplay');
  const googleBtn = document.getElementById('googleSignInBtn');
  if (!profile || !avatar || !fallback || !displayName || !emailDisplay) return;
  if (authUser) {
    profile.classList.remove('hidden');
    displayName.textContent = authUser.name || 'User';
    emailDisplay.textContent = authUser.email || '';
    if (authUser.picture) {
      avatar.src = authUser.picture;
      avatar.classList.remove('hidden');
      fallback.classList.add('hidden');
      avatar.onerror = () => {
        avatar.classList.add('hidden');
        fallback.classList.remove('hidden');
        fallback.textContent = (authUser.name || 'U').charAt(0).toUpperCase();
      };
    } else {
      avatar.classList.add('hidden');
      fallback.classList.remove('hidden');
      fallback.textContent = (authUser.name || 'U').charAt(0).toUpperCase();
    }
    if (googleBtn) googleBtn.classList.add('hidden');
  }
}

function hideAuthDisplay() {
  const profile = document.getElementById('userProfile');
  const googleBtn = document.getElementById('googleSignInBtn');
  if (profile) profile.classList.add('hidden');
  if (googleBtn) googleBtn.classList.remove('hidden');
}

// --- ADULT CONTENT DETECTION ---
function containsAdultContent(text) {
  if (!text) return false;
  const patterns = [/18\+/i, /\bporno\b/i, /\bporn\b/i, /\bseks\b/i, /\bseksual\b/i, /\bnude\b/i, /\bbugil\b/i, /\badult\b/i, /\bexplicit\b/i, /\berotik\b/i, /\bnsfw\b/i, /\bxxx\b/i, /\btelanjang\b/i];
  return patterns.some((re) => re.test(text));
}