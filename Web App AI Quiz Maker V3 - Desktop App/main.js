import { processDocument, formatFileSize } from './src/utils/document-processor.js';
import { generateQuiz as aiGenerateQuiz } from './src/ai/quiz-generator.js';
import { loadSettings, saveSettings, PROVIDER_DEFINITIONS, PROVIDER_MODEL_OPTIONS, getActiveProviderConfig, testProviderConnection } from './src/ai/settings-manager.js';

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
  clearAllFilesButton: document.getElementById('clearAllFilesButton'),
  fileCard: document.getElementById('fileCard'),
  quizContainer: document.getElementById('quizContainer'),
  statusArea: document.getElementById('statusArea'),
  jumlahSoal: document.getElementById('jumlahSoal'),
  charCount: document.getElementById('charCount'),
  themeToggle: document.getElementById('themeToggle'),
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
  regenModal: document.getElementById('regenModal'),
  regenFocusAll: document.getElementById('regenFocusAll'),
  regenFocusImprovement: document.getElementById('regenFocusImprovement'),
  regenDiffEasy: document.getElementById('regenDiffEasy'),
  regenDiffMedium: document.getElementById('regenDiffMedium'),
  regenDiffHard: document.getElementById('regenDiffHard'),
  regenJumlahSoal: document.getElementById('regenJumlahSoal'),
  regenCancel: document.getElementById('regenCancel'),
  regenConfirm: document.getElementById('regenConfirm'),
  diffEasy: document.getElementById('diffEasy'),
  diffMedium: document.getElementById('diffMedium'),
  diffHard: document.getElementById('diffHard'),
  focusAll: document.getElementById('focusAll'),
  focusImprovement: document.getElementById('focusImprovement'),
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  settingsClose: document.getElementById('settingsClose'),
  settingsCancel: document.getElementById('settingsCancel'),
  settingsSave: document.getElementById('settingsSave'),
  settingsProviderList: document.getElementById('settingsProviderList'),
  settingsConfigArea: document.getElementById('settingsConfigArea'),
  settingsKeyField: document.getElementById('settingsKeyField'),
  settingsKeyLabel: document.getElementById('settingsKeyLabel'),
  settingsApiKey: document.getElementById('settingsApiKey'),
  settingsToggleKeyVisibility: document.getElementById('settingsToggleKeyVisibility'),
  settingsModelField: document.getElementById('settingsModelField'),
  settingsModel: document.getElementById('settingsModel'),
  settingsCustomModel: document.getElementById('settingsCustomModel'),
  settingsEndpointField: document.getElementById('settingsEndpointField'),
  settingsEndpoint: document.getElementById('settingsEndpoint'),
  settingsTestConnection: document.getElementById('settingsTestConnection'),
  settingsTestResult: document.getElementById('settingsTestResult'),
  settingsLocalFetchModels: document.getElementById('settingsLocalFetchModels'),
  settingsLocalFetchMessage: document.getElementById('settingsLocalFetchMessage'),
};

let activeTab = 'text';
let currentQuiz = [];
let lastState = { type: 'text', materiText: '', jumlahSoal: 5, difficulty: 'medium' };
let selectedFile = null;
let difficulty = 'medium';
let focus = 'all';

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 3 * 60 * 1000;
function _rateKey() { return `rate_ts_anon`; }
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

function getMaxQuestions() {
  return 50; // Desktop mode: always 50 (no Default AI limit)
}

function updateQuestionLimit() {
  const max = getMaxQuestions();
  el.jumlahSoal.max = max;
  const maxLabel = document.getElementById('homeWarningMax');
  if (maxLabel) maxLabel.textContent = max;
  const regenMaxLabel = document.getElementById('regenWarningMax');
  if (regenMaxLabel) regenMaxLabel.textContent = max;
}

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  setupTabs();
  setupFileDrop();
  setupCharCounter();
  setupJumlahSoalLimit();
  setupDifficulty();
  setupSettingsUI();
  setupRegenerateModal();
  setupQuickButtons();
  setupHomeJumlahWarning();
  setupConfirmModal();
  setupExportModal();
  setupTutorial();
  setupReplayTutorial();
  updateQuestionLimit();
  el.generateBtn.addEventListener('click', handleGenerateQuiz);
  el.resetBtn.addEventListener('click', () => showConfirm('Reset all data?', "Are you sure you want to reset? All your inserted material and uploaded files will be permanently deleted. If you just want to generate a different quiz with the same material, click 'Back' instead.", handleReset));
  if (el.downloadResults) el.downloadResults.addEventListener('click', downloadResults);
  if (el.backBtn) el.backBtn.addEventListener('click', () => showConfirm('Are you sure?', 'Do you want to go back to the main screen?', handleBack));
  if (el.regenerateBtn) el.regenerateBtn.addEventListener('click', openRegenModal);
  if (el.resetBtn2) el.resetBtn2.addEventListener('click', () => showConfirm('Reset all data?', "Are you sure you want to reset? All your inserted material and uploaded files will be permanently deleted.", handleReset));
  if (el.clearFileButton) el.clearFileButton.addEventListener('click', handleClearFile);
  if (el.clearAllFilesButton) el.clearAllFilesButton.addEventListener('click', handleClearFile);
});

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

function setupCharCounter() {
  el.materi.addEventListener('input', updateCharCount);
}

function updateCharCount() {
  const len = el.materi.value.length;
  el.charCount.textContent = `${len} / 50+`;
  el.charCount.className = len >= 50 ? 'text-green-600' : 'text-red-600';
}

function setupJumlahSoalLimit() {
  const clamp = () => {
    const max = getMaxQuestions();
    let val = parseInt(el.jumlahSoal.value || '0');
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > max) val = max;
    el.jumlahSoal.value = val;
  };
  el.jumlahSoal.addEventListener('input', clamp);
  el.jumlahSoal.addEventListener('change', clamp);
}

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
      b.classList.add('px-2.5','py-1.5','rounded-full','border','border-gray-300','dark:border-gray-600', ...(isActive ? activeCls : inactiveCls));
    });
  };
  if (el.diffEasy) el.diffEasy.addEventListener('click', () => setActive('easy'));
  if (el.diffMedium) el.diffMedium.addEventListener('click', () => setActive('medium'));
  if (el.diffHard) el.diffHard.addEventListener('click', () => setActive('hard'));
  setActive('medium');
}

function setupFileDrop() {
  el.dropZone.className = 'border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-700 transition';
  ['dragenter', 'dragover'].forEach(type => el.dropZone.addEventListener(type, (e) => { e.preventDefault(); e.stopPropagation(); try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; } catch {} el.dropZone.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400'); }));
  ['dragleave', 'drop'].forEach(type => el.dropZone.addEventListener(type, () => { el.dropZone.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-400'); }));
  const showOverlay = () => { if (el.dragOverlay) el.dragOverlay.classList.remove('hidden'); };
  const hideOverlay = () => { if (el.dragOverlay) el.dragOverlay.classList.add('hidden'); };
  document.addEventListener('dragover', (e) => { e.preventDefault(); }, { capture: true });
  window.addEventListener('dragover', (e) => { e.preventDefault(); }, { capture: true });
  window.addEventListener('dragenter', (e) => { try { if (Array.from(e.dataTransfer?.types || []).includes('Files')) showOverlay(); } catch { showOverlay(); } }, { capture: true });
  document.addEventListener('dragleave', () => hideOverlay(), { capture: true });
  window.addEventListener('dragend', () => hideOverlay(), { capture: true });
  document.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); hideOverlay(); if (e.dataTransfer?.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); }, { capture: true });
  el.dropZone.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer?.files?.[0]) handleFileSelect(e.dataTransfer.files[0]); });
  el.dropZone.addEventListener('click', () => el.fileInput.click());
  el.fileInput.addEventListener('change', () => { if (el.fileInput.files[0]) handleFileSelect(el.fileInput.files[0]); });
}

async function handleFileSelect(file) {
  if (!/\.(pdf|docx)$/i.test(file.name)) return showStatus('Format not supported.', 'error');
  showStatus('Extracting text from file...', 'loading');
  el.fileName.textContent = `Processing: ${file.name}...`;
  const result = await processDocument(file);
  if (!result.success) { showStatus(result.error || 'Failed to process file.', 'error'); el.fileName.textContent = ''; return; }
  selectedFile = file;
  window._fileMarkdown = result.markdown;
  el.statusArea.classList.add('hidden');
  if (el.fileCard) el.fileCard.classList.remove('hidden');
  el.fileName.textContent = file.name + ' (' + formatFileSize(file.size) + ') — ' + result.length.toLocaleString() + ' chars';
  if (el.clearFileButton) el.clearFileButton.classList.remove('hidden');
  if (el.clearAllFilesButton) el.clearAllFilesButton.classList.remove('hidden');
  switchTab('file');
  showToast('📄 File ready: ' + file.name, 'success');
}

function setupSettingsUI() {
  let selectedProviderId = 'local';
  let isKeyVisible = false;
  el.settingsBtn.addEventListener('click', () => {
    const settings = loadSettings();
    selectedProviderId = settings.activeProvider || 'local';
    renderProviderCards(selectedProviderId);
    populateConfigFields(selectedProviderId, settings);
    el.settingsModal.classList.remove('hidden');
  });
  const closeSettings = () => { el.settingsModal.classList.add('hidden'); el.settingsTestResult.classList.add('hidden'); };
  el.settingsClose.addEventListener('click', closeSettings);
  el.settingsCancel.addEventListener('click', closeSettings);
  el.settingsToggleKeyVisibility.addEventListener('click', () => { isKeyVisible = !isKeyVisible; el.settingsApiKey.type = isKeyVisible ? 'text' : 'password'; el.settingsToggleKeyVisibility.innerHTML = isKeyVisible ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>'; });
  el.settingsTestConnection.addEventListener('click', async () => { const config = gatherConfig(selectedProviderId); el.settingsTestResult.className = 'mt-2 text-sm'; el.settingsTestResult.classList.remove('hidden'); el.settingsTestResult.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...'; const result = await testProviderConnection(selectedProviderId, config); el.settingsTestResult.innerHTML = result.success ? `<span class="text-green-600"><i class="fas fa-check-circle"></i> ${result.message}</span>` : `<span class="text-red-600"><i class="fas fa-exclamation-circle"></i> ${result.message}</span>`; });
  el.settingsSave.addEventListener('click', () => {
    const newSettings = { activeProvider: selectedProviderId, customProviders: loadSettings().customProviders || {}, localEndpoint: '', localModel: '', defaultModel: 'gemini-3-flash-preview' };
    const config = gatherConfig(selectedProviderId);
    if (selectedProviderId === 'local') { newSettings.localEndpoint = config.endpoint || ''; newSettings.localModel = config.model || ''; }
    else { newSettings.customProviders[selectedProviderId] = { apiKey: config.apiKey || '', model: config.model || '', endpoint: config.endpoint || '' }; }
    saveSettings(newSettings);
    closeSettings();
    showToast('AI provider settings saved!', 'success');
  });

  function renderProviderCards(activeProviderId) {
    el.settingsProviderList.innerHTML = '';
    PROVIDER_DEFINITIONS.forEach(p => {
      const card = document.createElement('div');
      card.className = `flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 ${p.id === activeProviderId ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`;
      card.innerHTML = `<i class="${p.icon} text-2xl ${p.id === activeProviderId ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}"></i><div class="flex-1"><div class="font-medium text-sm">${p.name}</div><div class="text-xs text-gray-500 dark:text-gray-400">${p.description}</div></div>${p.id === activeProviderId ? '<i class="fas fa-check-circle text-blue-600"></i>' : ''}`;
      card.addEventListener('click', () => { selectedProviderId = p.id; renderProviderCards(p.id); populateConfigFields(p.id, loadSettings()); el.settingsTestResult.classList.add('hidden'); el.settingsTestResult.innerHTML = ''; });
      el.settingsProviderList.appendChild(card);
    });
  }

  function populateConfigFields(providerId, settings) {
    const def = PROVIDER_DEFINITIONS.find(p => p.id === providerId);
    if (!def) return;
    el.settingsConfigArea.classList.remove('hidden');
    if (def.requiresKey) { el.settingsKeyField.classList.remove('hidden'); el.settingsKeyLabel.textContent = def.keyLabel || 'API Key'; el.settingsApiKey.placeholder = def.keyPlaceholder || 'Enter API key...'; const customData = (settings.customProviders && settings.customProviders[providerId]) || {}; el.settingsApiKey.value = customData.apiKey || ''; }
    else { el.settingsKeyField.classList.add('hidden'); el.settingsApiKey.value = ''; }
    if (providerId === 'local') {
      el.settingsModelField.classList.remove('hidden'); el.settingsModel.classList.add('hidden'); el.settingsCustomModel.classList.remove('hidden'); el.settingsCustomModel.placeholder = 'Enter model name'; el.settingsCustomModel.value = settings.localModel || '';
      const fetchBtn = el.settingsLocalFetchModels; const fetchMsg = el.settingsLocalFetchMessage;
      if (fetchBtn) fetchBtn.classList.remove('hidden'); if (fetchMsg) fetchMsg.classList.add('hidden');
      fetchBtn.onclick = null; fetchBtn.onclick = async () => {
        const endpoint = el.settingsEndpoint.value.trim() || 'http://localhost:1234/v1'; const baseEndpoint = endpoint.replace(/\/+$/, '');
        if (fetchMsg) { fetchMsg.className = 'text-xs mt-1'; fetchMsg.classList.remove('hidden'); fetchMsg.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching models...'; }
        try { const res = await fetch(`${baseEndpoint}/models`, { signal: AbortSignal.timeout(5000) }); if (!res.ok) throw new Error('HTTP ' + res.status); const data = await res.json(); let models = []; if (data?.data && Array.isArray(data.data)) models = data.data.map(m => m.id).filter(Boolean); else if (Array.isArray(data)) models = data.map(m => m.id || m).filter(Boolean); if (models.length === 0) throw new Error('No models found'); models = [...new Set(models)].sort(); el.settingsModel.classList.remove('hidden'); el.settingsCustomModel.classList.add('hidden'); el.settingsModel.innerHTML = '<option value="">Select a model...</option>'; models.forEach(m => { const opt = document.createElement('option'); opt.value = m; opt.textContent = m; el.settingsModel.appendChild(opt); }); const customOpt = document.createElement('option'); customOpt.value = '__custom__'; customOpt.textContent = 'Custom (Type your own)...'; el.settingsModel.insertBefore(customOpt, el.settingsModel.firstChild); if (fetchMsg) { fetchMsg.innerHTML = `<span class="text-green-600"><i class="fas fa-check"></i> ${models.length} model(s) detected</span>`; setTimeout(() => fetchMsg.classList.add('hidden'), 3000); } }
        catch (e) { el.settingsModel.classList.add('hidden'); el.settingsCustomModel.classList.remove('hidden'); if (fetchMsg) { fetchMsg.innerHTML = '<span class="text-yellow-600"><i class="fas fa-exclamation-triangle"></i> Could not auto-detect. Please enter manually or check server.</span>'; setTimeout(() => fetchMsg.classList.add('hidden'), 4000); } } };
    } else {
      el.settingsModelField.classList.remove('hidden'); el.settingsModel.classList.remove('hidden');
      const options = PROVIDER_MODEL_OPTIONS[def.modelOptions] || []; const currentModel = (settings.customProviders && settings.customProviders[providerId])?.model || def.defaultModel || '';
      el.settingsModel.innerHTML = '<option value="">Select a model...</option>'; let matchedPreset = false;
      options.forEach(opt => { const option = document.createElement('option'); option.value = opt.value; option.textContent = opt.label; if (opt.value === currentModel) { option.selected = true; matchedPreset = true; } el.settingsModel.appendChild(option); });
      const isCustom = currentModel && !matchedPreset;
      if (isCustom) { const customOption = Array.from(el.settingsModel.options).find(o => o.value === '__custom__'); if (customOption) customOption.selected = true; el.settingsCustomModel.classList.remove('hidden'); el.settingsCustomModel.value = currentModel; }
      else { el.settingsCustomModel.classList.add('hidden'); el.settingsCustomModel.value = ''; }
      el.settingsModel.onchange = () => { if (el.settingsModel.value === '__custom__') { el.settingsCustomModel.classList.remove('hidden'); el.settingsCustomModel.focus(); } else { el.settingsCustomModel.classList.add('hidden'); el.settingsCustomModel.value = ''; } };
    }
    if (def.requiresEndpoint) { el.settingsEndpointField.classList.remove('hidden'); el.settingsEndpoint.placeholder = def.defaultEndpoint || 'http://localhost:1234/v1'; el.settingsEndpoint.value = providerId === 'local' ? (settings.localEndpoint || def.defaultEndpoint || '') : ''; }
    else if (def.defaultEndpoint) { el.settingsEndpointField.classList.remove('hidden'); el.settingsEndpoint.placeholder = def.defaultEndpoint; const customData = (settings.customProviders && settings.customProviders[providerId]) || {}; el.settingsEndpoint.value = customData.endpoint || def.defaultEndpoint || ''; }
    else { el.settingsEndpointField.classList.add('hidden'); }
  }

  function gatherConfig(providerId) {
    const def = PROVIDER_DEFINITIONS.find(p => p.id === providerId);
    let model = '';
    if (providerId === 'local') { if (!el.settingsModel.classList.contains('hidden')) model = el.settingsModel.value === '__custom__' ? el.settingsCustomModel.value.trim() : el.settingsModel.value; else model = el.settingsCustomModel.value.trim(); }
    else if (el.settingsModel.value === '__custom__') { model = el.settingsCustomModel.value.trim(); }
    else { model = el.settingsModel.value; }
    const config = { apiKey: el.settingsApiKey.value.trim(), model, endpoint: el.settingsEndpoint.value.trim() };
    if (!config.endpoint) { if (def && def.defaultEndpoint) config.endpoint = def.defaultEndpoint; else if (providerId === 'gemini') config.endpoint = 'https://generativelanguage.googleapis.com/v1beta'; else if (providerId === 'anthropic') config.endpoint = 'https://api.anthropic.com/v1'; else if (providerId === 'openai') config.endpoint = 'https://api.openai.com/v1'; }
    return config;
  }
}

let _loadingInterval = null;
let _loadingProgress = 0;

function setLoadingProgress(p) { _loadingProgress = Math.max(0, Math.min(100, Math.floor(p))); if (el.loadingBar) el.loadingBar.style.width = `${_loadingProgress}%`; if (el.loadingPercent) el.loadingPercent.textContent = `${_loadingProgress}%`; }

function showLoading(show) { if (!el.loadingOverlay) return; el.loadingOverlay.classList.toggle('hidden', !show); if (show) { clearInterval(_loadingInterval); setLoadingProgress(_loadingProgress || 5); _loadingInterval = setInterval(() => { const target = 90; if (_loadingProgress < target) { const step = _loadingProgress < 40 ? 3 : _loadingProgress < 70 ? 2 : 1; setLoadingProgress(_loadingProgress + step); } }, 400); } else { clearInterval(_loadingInterval); setLoadingProgress(100); setTimeout(() => setLoadingProgress(0), 600); } }

function clearAllLoadingStates() { el.statusArea.classList.add('hidden'); if (el.loadingOverlay) showLoading(false); el.generateBtn.disabled = false; el.generateBtn.innerHTML = '<i class="fas fa-sparkles"></i> Generate'; }

async function handleGenerateQuiz() {
  let materi = ''; const file = selectedFile || el.fileInput.files[0]; const max = getMaxQuestions(); const jumlahSoal = parseInt(el.jumlahSoal.value);
  if (jumlahSoal > max) return showToast('Max ' + max + ' questions.', 'error');
  if (activeTab === 'text') { materi = el.materi.value.trim(); if (materi.length < 50) return showToast('Minimum 50 characters.', 'error'); if (containsAdultContent(materi)) return showToast('18+ content not allowed.', 'error'); }
  else if (!file) return showToast('Please select a file.', 'error');
  disableBtn(true); if (el.loadingOverlay) showLoading(true); setLoadingProgress(10); showStatus('Generating quiz...', 'loading'); showSkeleton();
  try {
    if (activeTab === 'file' && file) { setLoadingProgress(25); if (window._fileMarkdown) { materi = window._fileMarkdown.trim(); } else { const processed = await processDocument(file); if (!processed.success) throw new Error(processed.error || 'Failed to extract text.'); materi = processed.markdown; } if (!materi || materi.length < 50) throw new Error('Text too short.'); if (containsAdultContent(materi)) throw new Error('18+ content not allowed.'); }
    if (!canConsumeRateLimit()) throw new Error('Too frequent: max 10 requests per 3 minutes.'); setLoadingProgress(40);
    const result = await aiGenerateQuiz(materi, { difficulty, questionCount: jumlahSoal }); if (!result.success) throw new Error(result.error);
    setLoadingProgress(80); const questions = result.quiz.questions; currentQuiz = questions; lastState = { type: activeTab, materiText: materi, jumlahSoal, difficulty }; displayQuiz(questions);
    if (el.downloadResults) el.downloadResults.classList.remove('hidden'); if (questions.length < jumlahSoal) showToast(`Quiz completed (${questions.length}/${jumlahSoal} questions).`, 'warning'); else showToast('Quiz ready!', 'success');
    setLoadingProgress(95); goToQuizScreen();
  } catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  finally { clearAllLoadingStates(); }
}

function escapeHTML(s) { return String(s).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '&#039;'); }

function displayQuiz(questions) {
  el.quizContainer.innerHTML = ''; el.scoreValue.textContent = '0'; el.scoreTotal.textContent = questions.length; el.scoreArea.classList.remove('hidden');
  questions.forEach((q, i) => {
    const div = document.createElement('div'); div.className = 'bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-200 dark:border-gray-600'; const opts = shuffleArray([...q.answerOptions]);
    div.innerHTML = ['<h3 class="text-lg font-semibold mb-4">', (i + 1), '. ', escapeHTML(q.question), '</h3>', '<div class="space-y-3" id="opts-', i, '">', opts.map(o => ['<button class="quiz-option w-full text-left px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition" data-correct="', o.isCorrect, '"><span>', escapeHTML(o.text), '</span><div class="rationale hidden text-sm text-gray-600 dark:text-gray-300 mt-2">', escapeHTML(o.rationale), '</div></button>'].join('')).join(''), '</div>'].join('');
    el.quizContainer.appendChild(div); document.querySelectorAll(`#opts-${i} .quiz-option`).forEach(btn => { btn.addEventListener('click', () => selectOption(btn, `#opts-${i}`)); });
  });
}

function selectOption(btn, containerId) {
  const container = document.querySelector(containerId); const isCorrect = btn.dataset.correct === 'true'; let score = parseInt(el.scoreValue.textContent);
  container.querySelectorAll('.quiz-option').forEach(b => { b.disabled = true; const rational = b.querySelector('.rationale'); if (rational) rational.classList.remove('hidden'); if (b.dataset.correct === 'true') b.classList.add('border-green-600','bg-green-50','dark:bg-green-900/30','text-green-700','dark:text-green-300'); else b.classList.add('opacity-90'); });
  if (!isCorrect) btn.classList.add('border-red-600','bg-red-50','dark:bg-red-900/30','text-red-700','dark:text-red-300');
  el.scoreValue.textContent = String(score + (isCorrect ? 1 : 0)); if (parseInt(el.scoreValue.textContent) === parseInt(el.scoreTotal.textContent)) setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }), 500);
}

function downloadResults() { if (!currentQuiz.length) return; const modal = document.getElementById('exportModal'); if (modal) modal.classList.remove('hidden'); }

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer'); if (!container) return;
  const toast = document.createElement('div'); const colors = { success: 'bg-green-100 border-green-500 text-green-800', error: 'bg-red-100 border-red-500 text-red-800', warning: 'bg-yellow-100 border-yellow-500 text-yellow-800', info: 'bg-blue-100 border-blue-500 text-blue-800' };
  toast.className = (colors[type] || colors.info) + ' pointer-events-auto px-4 py-3 rounded-lg border-l-4 shadow-lg text-sm max-w-sm'; toast.innerHTML = msg; container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 4000);
}

function setupExportModal() {
  const modal = document.getElementById('exportModal'); if (!modal) return;
  document.getElementById('exportModalClose').addEventListener('click', () => modal.classList.add('hidden')); document.getElementById('exportModalCancel').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('exportSummary').addEventListener('click', () => {
    modal.classList.add('hidden'); if (!currentQuiz.length) return;
    const text = currentQuiz.map((q, i) => { const correct = q.answerOptions.find(o => o.isCorrect); return `${i + 1}. ${q.question}\n   ${q.answerOptions.map(o => `${o.isCorrect ? '✓' : '○'} ${o.text}`).join('\n   ')}\n   ${correct ? 'Answer: ' + correct.text : ''}\n   Rationale: ${correct ? correct.rationale : ''}`; }).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `quiz-summary-${new Date().toISOString().slice(0,10)}.txt`; a.click(); URL.revokeObjectURL(a.href); showToast('Summary downloaded!', 'success');
  });
  document.getElementById('exportSeparated').addEventListener('click', async () => {
    modal.classList.add('hidden'); if (!currentQuiz.length) return;
    try { const JSZip = window.JSZip; if (!JSZip) { showToast('ZIP library not loaded. Try Summary instead.', 'error'); return; } const zip = new JSZip(); const questionsText = currentQuiz.map((q, i) => `${i + 1}. ${q.question}\n${q.answerOptions.map(o => `  ${o.isCorrect ? '○' : '○'} ${o.text}`).join('\n')}`).join('\n\n'); const answersText = currentQuiz.map((q, i) => { const correct = q.answerOptions.find(o => o.isCorrect); return `${i + 1}. ${q.question}\n   Answer: ${correct ? correct.text : 'N/A'}\n   Rationale: ${correct ? correct.rationale : ''}`; }).join('\n\n'); zip.file('questions.txt', questionsText); zip.file('answer-key.txt', answersText); const blob = await zip.generateAsync({ type: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `quiz-separated-${new Date().toISOString().slice(0,10)}.zip`; a.click(); URL.revokeObjectURL(a.href); showToast('ZIP with separated files downloaded!', 'success'); }
    catch (e) { showToast('Failed to create ZIP: ' + e.message, 'error'); }
  });
}

function showStatus(msg, type) {
  const area = el.statusArea; area.textContent = msg; area.className = 'p-4 rounded-lg text-center transition-all';
  if (type === 'loading') area.className += ' bg-blue-100 text-blue-700'; else { area.className += ' bg-green-100 text-green-700'; }
  area.classList.remove('hidden');
  if (type !== 'loading') { setTimeout(() => { el.statusArea.classList.add('hidden'); el.statusArea.className = 'p-4 rounded-lg text-center transition-all hidden'; }, 5000); }
}

function disableBtn(disabled) { el.generateBtn.disabled = disabled; el.generateBtn.innerHTML = disabled ? '<i class="fas fa-spinner fa-spin"></i> Processing...' : '<i class="fas fa-sparkles"></i> Generate'; }

function showSkeleton() { el.quizContainer.innerHTML = '<div class="space-y-6">' + Array(3).fill(0).map(() => '<div class="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg animate-pulse"><div class="h-6 rounded bg-gray-300 dark:bg-gray-600 mb-4 w-3/4"></div><div class="space-y-3">' + Array(4).fill(0).map(() => '<div class="h-12 rounded bg-gray-200 dark:bg-gray-600"></div>').join('') + '</div></div>').join('') + '</div>'; }

function handleReset() { clearAllLoadingStates(); el.materi.value = ''; el.fileInput.value = ''; selectedFile = null; window._fileMarkdown = null; if (el.fileCard) el.fileCard.classList.add('hidden'); el.fileName.textContent = ''; if (el.clearFileButton) el.clearFileButton.classList.add('hidden'); if (el.clearAllFilesButton) el.clearAllFilesButton.classList.add('hidden'); el.jumlahSoal.value = 5; el.quizContainer.innerHTML = ''; el.scoreArea.classList.add('hidden'); if (el.downloadResults) el.downloadResults.classList.add('hidden'); el.statusArea.classList.add('hidden'); currentQuiz = []; lastState = { type: 'text', materiText: '', jumlahSoal: 5, difficulty: 'medium' }; el.charCount.textContent = '0 / 50+'; el.charCount.className = 'text-red-600'; goToInputScreen(); }

function handleClearFile() { selectedFile = null; el.fileInput.value = ''; window._fileMarkdown = null; if (el.fileCard) el.fileCard.classList.add('hidden'); el.fileName.textContent = ''; if (el.clearFileButton) el.clearFileButton.classList.add('hidden'); if (el.clearAllFilesButton) el.clearAllFilesButton.classList.add('hidden'); }

function handleBack() { el.quizScreen.classList.add('hidden'); el.inputScreen.classList.remove('hidden'); clearAllLoadingStates(); if (el.materi && el.charCount) { const len = el.materi.value.length; el.charCount.textContent = `${len} / 50+`; el.charCount.className = len >= 50 ? 'text-green-600' : 'text-red-600'; } }

function goToQuizScreen() { el.inputScreen.classList.add('hidden'); el.quizScreen.classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); }

function goToInputScreen() { el.quizScreen.classList.add('hidden'); el.inputScreen.classList.remove('hidden'); el.materi.value = ''; el.charCount.textContent = '0 / 50+'; el.charCount.className = 'text-red-600'; }

function shuffleArray(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

function setupRegenerateModal() {
  if (!el.regenModal || !el.regenerateBtn) return;
  let modalFocus = 'all', modalDiff = 'medium';
  const setActive = (buttons, keys, current) => { const activeCls = ['bg-blue-600','dark:bg-indigo-500','text-white']; const inactiveCls = ['bg-gray-200','dark:bg-slate-700','text-gray-800','dark:text-gray-100']; buttons.forEach((b, idx) => { if (!b) return; b.classList.remove(...activeCls, ...inactiveCls); const isActive = keys[idx] === current; b.classList.add('px-3','py-2','rounded-full','border','border-gray-300','dark:border-gray-600', ...(isActive ? activeCls : inactiveCls)); }); };
  const focusButtons = [el.regenFocusAll, el.regenFocusImprovement]; const focusKeys = ['all','improvement'];
  focusButtons.forEach((b, idx) => { if (!b) return; b.addEventListener('click', () => { modalFocus = focusKeys[idx]; setActive(focusButtons, focusKeys, modalFocus); }); }); setActive(focusButtons, focusKeys, modalFocus);
  const diffButtons = [el.regenDiffEasy, el.regenDiffMedium, el.regenDiffHard]; const diffKeys = ['easy','medium','hard'];
  diffButtons.forEach((b, idx) => { if (!b) return; b.addEventListener('click', () => { modalDiff = diffKeys[idx]; setActive(diffButtons, diffKeys, modalDiff); }); }); setActive(diffButtons, diffKeys, modalDiff);
  const regenWarning = document.getElementById('regenWarning');
  const clampRegenCount = () => {
    if (!el.regenJumlahSoal) return; const max = getMaxQuestions(); let val = parseInt(el.regenJumlahSoal.value || '0'); if (isNaN(val)) val = 1; if (val < 1) val = 1; if (val > max) { val = max; if (regenWarning) { regenWarning.classList.remove('hidden'); document.getElementById('regenWarningMax').textContent = max; setTimeout(() => { if (regenWarning) regenWarning.classList.add('hidden'); }, 3000); } } else { if (regenWarning) regenWarning.classList.add('hidden'); } el.regenJumlahSoal.value = val;
  };
  if (el.regenJumlahSoal) { el.regenJumlahSoal.addEventListener('input', clampRegenCount); el.regenJumlahSoal.addEventListener('change', clampRegenCount); }
  document.querySelectorAll('.regen-quick-btn').forEach(btn => { btn.addEventListener('click', () => { const count = parseInt(btn.dataset.count); if (el.regenJumlahSoal) { el.regenJumlahSoal.value = count; if (regenWarning) regenWarning.classList.add('hidden'); } }); });
  if (el.regenCancel) el.regenCancel.addEventListener('click', closeRegenModal);
  if (el.regenConfirm) el.regenConfirm.addEventListener('click', () => { clampRegenCount(); const jumlahOpt = parseInt(el.regenJumlahSoal?.value || lastState.jumlahSoal || 5); closeRegenModal(); focus = modalFocus; lastState.difficulty = modalDiff; handleRegenerate({ focus: modalFocus, difficulty: modalDiff, jumlahSoal: jumlahOpt }); });
}

function openRegenModal(e) { if (e) { e.preventDefault(); e.stopImmediatePropagation(); } if (el.regenModal) el.regenModal.classList.remove('hidden'); if (el.regenJumlahSoal) el.regenJumlahSoal.value = currentQuiz.length > 0 ? currentQuiz.length : (lastState.jumlahSoal || 5); }
function closeRegenModal() { if (el.regenModal) el.regenModal.classList.add('hidden'); }

async function handleRegenerate(opts = {}) {
  const optJumlah = parseInt(opts.jumlahSoal || lastState.jumlahSoal || 5); const optDiff = opts.difficulty || lastState.difficulty || 'medium'; const max = getMaxQuestions();
  if (!lastState.materiText || !optJumlah) return showToast('No context to regenerate.', 'error'); const jumlahSoal = Math.min(optJumlah, max); if (optJumlah > max) showToast('Limited to max ' + max + ' questions.', 'warning'); if (containsAdultContent(lastState.materiText)) return showToast('18+ content not allowed.', 'error');
  disableBtn(true); if (el.loadingOverlay) showLoading(true); setLoadingProgress(15); showStatus('Regenerating quiz...', 'loading'); showSkeleton();
  try { if (!canConsumeRateLimit()) throw new Error('Too frequent: max 10 requests per 3 minutes.'); setLoadingProgress(40); const result = await aiGenerateQuiz(lastState.materiText, { difficulty: optDiff, questionCount: jumlahSoal }); if (!result.success) throw new Error(result.error); setLoadingProgress(80); const questions = result.quiz.questions; currentQuiz = questions; displayQuiz(questions); setLoadingProgress(95); if (questions.length < jumlahSoal) showToast(`New quiz (${questions.length}/${jumlahSoal} questions).`, 'warning'); else showToast('New quiz ready!', 'success'); }
  catch (err) { showToast(`Error: ${err.message}`, 'error'); }
  finally { clearAllLoadingStates(); }
}

function setupQuickButtons() { document.querySelectorAll('.quick-btn[data-target="jumlahSoal"]').forEach(btn => { btn.addEventListener('click', () => { if (el.jumlahSoal) { el.jumlahSoal.value = parseInt(btn.dataset.count); updateQuestionLimit(); const hw = document.getElementById('homeWarning'); if (hw) hw.classList.add('hidden'); } }); }); }

function setupHomeJumlahWarning() {
  const hw = document.getElementById('homeWarning'); if (!el.jumlahSoal || !hw) return;
  const clamp = () => { const max = getMaxQuestions(); let val = parseInt(el.jumlahSoal.value || '0'); if (isNaN(val)) val = 1; if (val < 1) val = 1; if (val > max) { val = max; hw.classList.remove('hidden'); setTimeout(() => hw.classList.add('hidden'), 3000); } else hw.classList.add('hidden'); el.jumlahSoal.value = val; };
  el.jumlahSoal.addEventListener('input', clamp); el.jumlahSoal.addEventListener('change', clamp);
}

function setupConfirmModal() {}

function showConfirm(title, message, onConfirm) {
  const modal = document.getElementById('confirmModal'); const titleEl = document.getElementById('confirmTitle'); const msgEl = document.getElementById('confirmMessage'); const cancelBtn = document.getElementById('confirmCancel'); const okBtn = document.getElementById('confirmOk');
  if (!modal || !titleEl || !msgEl || !cancelBtn || !okBtn) return;
  titleEl.textContent = title; msgEl.textContent = message; modal.classList.remove('hidden'); const content = document.getElementById('confirmModalContent');
  if (content) { content.classList.remove('scale-95'); content.classList.add('scale-100'); }
  const cleanup = () => { modal.classList.add('hidden'); if (content) { content.classList.remove('scale-100'); content.classList.add('scale-95'); } cancelBtn.removeEventListener('click', onCancel); okBtn.removeEventListener('click', onOk); modal.removeEventListener('click', onBackdrop); };
  const onCancel = () => cleanup(); const onOk = () => { cleanup(); if (typeof onConfirm === 'function') onConfirm(); }; const onBackdrop = (e) => { if (e.target === modal) cleanup(); };
  cancelBtn.addEventListener('click', onCancel); okBtn.addEventListener('click', onOk); modal.addEventListener('click', onBackdrop);
}

// --- TUTORIAL ---
function setupTutorial() {
  const matches = document.cookie.match(/(?:^|;\s*)quiz_tutorial=([^;]*)/);
  if (matches && matches[1] === 'done' && !window._tutorialReplay) return;
  const overlay = document.getElementById('tutorialOverlay'); const highlight = document.getElementById('tutorialHighlight'); const tooltip = document.getElementById('tutorialTooltip'); const textEl = document.getElementById('tutorialText'); const counterEl = document.getElementById('tutorialCounter'); const nextBtn = document.getElementById('tutorialNext'); const skipBtn = document.getElementById('tutorialSkip'); const arrow = document.getElementById('tutorialArrow');
  if (!overlay || !highlight || !tooltip || !textEl || !counterEl || !nextBtn || !skipBtn || !arrow) return;
  const homeSteps = [
    { target: '#materi', text: 'Paste or type your study material here. You need at least 50 characters.', pos: 'bottom' },
    { target: '#tab-file', text: 'You can also upload a PDF or DOCX file instead of typing.', pos: 'bottom' },
    { target: '#difficultyGroup', text: 'Choose the difficulty level for your quiz.', pos: 'bottom' },
    { target: '.quick-btn', text: 'Quick-select common amounts or type a custom number (max 50).', pos: 'bottom' },
    { target: '#generateButton', text: 'Click "Generate" to let AI create your quiz. It only takes a few seconds!', pos: 'top' },
  ];
  let currentStep = 0;
  function showStep(index) {
    const steps = homeSteps;
    if (index >= steps.length) { overlay.classList.add('hidden'); highlight.classList.add('hidden'); tooltip.classList.add('hidden'); document.cookie = 'quiz_tutorial=done; max-age=' + (30 * 24 * 60 * 60) + '; path=/'; window._tutorialReplay = false; return; }
    const step = steps[index]; overlay.classList.remove('hidden'); const targetEl = document.querySelector(step.target); if (!targetEl) { showStep(index + 1); return; }
    const rect = targetEl.getBoundingClientRect(); highlight.classList.remove('hidden'); highlight.style.left = (rect.left - 8) + 'px'; highlight.style.top = (rect.top - 8) + 'px'; highlight.style.width = (rect.width + 16) + 'px'; highlight.style.height = (rect.height + 16) + 'px'; textEl.textContent = step.text; counterEl.textContent = `${index + 1} / ${steps.length}`; tooltip.classList.remove('hidden');
    const tooltipWidth = 320; const tooltipHeight = tooltip.offsetHeight || 140; let left, top;
    if (step.pos === 'bottom') { left = rect.left + rect.width / 2 - tooltipWidth / 2; top = rect.bottom + 16; arrow.className = 'absolute w-3 h-3 bg-white dark:bg-gray-800 rotate-45'; arrow.style.left = (tooltipWidth / 2 - 6) + 'px'; arrow.style.top = '-6px'; }
    else { left = rect.left + rect.width / 2 - tooltipWidth / 2; top = rect.top - tooltipHeight - 16; arrow.className = 'absolute w-3 h-3 bg-white dark:bg-gray-800 rotate-45'; arrow.style.left = (tooltipWidth / 2 - 6) + 'px'; arrow.style.bottom = '-6px'; arrow.style.top = 'auto'; }
    if (left < 10) left = 10; if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10; tooltip.style.left = left + 'px'; tooltip.style.top = top + 'px';
  }
  window._tutorialShowStep = showStep; nextBtn.addEventListener('click', () => showStep(++currentStep));
  skipBtn.addEventListener('click', () => { overlay.classList.add('hidden'); highlight.classList.add('hidden'); tooltip.classList.add('hidden'); document.cookie = 'quiz_tutorial=done; max-age=' + (30 * 24 * 60 * 60) + '; path=/'; window._tutorialReplay = false; });
  setTimeout(() => showStep(0), 1500);
}

function setupReplayTutorial() {
  const btn = document.getElementById('replayTutorialBtn'); if (!btn) return;
  btn.addEventListener('click', () => { document.cookie = 'quiz_tutorial=; max-age=0; path=/'; window._tutorialReplay = true; const overlay = document.getElementById('tutorialOverlay'); const highlight = document.getElementById('tutorialHighlight'); const tooltip = document.getElementById('tutorialTooltip'); if (overlay) overlay.classList.add('hidden'); if (highlight) highlight.classList.add('hidden'); if (tooltip) tooltip.classList.add('hidden'); setupTutorial(); });
}

function containsAdultContent(text) {
  if (!text) return false;
  const patterns = [/18\+/i, /\bporno\b/i, /\bporn\b/i, /\bseks\b/i, /\bseksual\b/i, /\bnude\b/i, /\bbugil\b/i, /\badult\b/i, /\bexplicit\b/i, /\berotik\b/i, /\bnsfw\b/i, /\bxxx\b/i, /\btelanjang\b/i];
  return patterns.some((re) => re.test(text));
}