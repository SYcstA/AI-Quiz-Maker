/**
 * Reusable UI Components
 */

import { safeQuerySelector } from '../utils/debounce.js';

/**
 * Loading spinner component
 */
export function createLoadingSpinner(options = {}) {
  const { size = 'md', message = 'Processing...' } = options;
  
  const container = document.createElement('div');
  container.className = `flex flex-col items-center justify-center ${size === 'lg' ? 'p-8' : 'p-4'}`;

  // Spinner icon
  const spinner = document.createElement('div');
  spinner.className = 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600';
  container.appendChild(spinner);

  // Message
  if (message) {
    const msg = document.createElement('p');
    msg.className = 'mt-4 text-gray-600 dark:text-gray-300';
    msg.textContent = message;
    container.appendChild(msg);
  }

  return container;
}

/**
 * Toast notification component
 */
export function showToast(message, type = 'info') {
  const types = {
    success: { bg: 'bg-green-500', text: 'text-white' },
    error: { bg: 'bg-red-500', text: 'text-white' },
    warning: { bg: 'bg-yellow-500', text: 'text-white' },
    info: { bg: 'bg-blue-500', text: 'text-white' },
  };

  const toast = document.createElement('div');
  toast.className = `${types[type]?.bg || types.info.bg} ${types[type]?.text || types.info.text} rounded-lg shadow-lg px-6 py-4 flex items-center justify-between transform transition-all duration-300 translate-y-[-150%]`;

  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  toast.appendChild(messageEl);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.className = 'ml-4 text-white hover:text-gray-200 font-bold text-xl';
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  // Add to DOM with animation
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('translate-y-0'), 10);

  return toast;
}

/**
 * Character counter component
 */
export function createCharacterCounter(max = 500) {
  const container = document.createElement('div');
  container.className = 'flex justify-between text-sm';

  const label = document.createElement('label');
  label.textContent = 'Study Material';
  
  const counter = document.createElement('span');
  counter.id = 'charCount';
  counter.className = 'text-red-600';
  counter.textContent = `0 / ${max}`;

  container.appendChild(label);
  container.appendChild(counter);

  return { element: container, update: (value) => {
    const remaining = max - value;
    counter.textContent = `${remaining} / ${max}`;
    if (remaining <= 50) {
      counter.className = 'text-red-600 font-bold';
    } else if (remaining <= 100) {
      counter.className = 'text-yellow-600';
    } else {
      counter.className = 'text-green-600';
    }
  }};
}

/**
 * Difficulty selector component
 */
export function createDifficultySelector(selected = 'medium') {
  const container = document.createElement('div');
  container.id = 'difficultyGroup';
  container.className = 'flex flex-wrap gap-2';

  const difficulties = [
    { id: 'easy', label: 'Easy', color: 'bg-gray-200 dark:bg-slate-700' },
    { id: 'medium', label: 'Normal', color: 'bg-blue-600 dark:bg-indigo-500' },
    { id: 'hard', label: 'Hard', color: 'bg-gray-200 dark:bg-slate-700' },
  ];

  difficulties.forEach(diff => {
    const btn = document.createElement('button');
    btn.id = `diff${diff.id.charAt(0).toUpperCase() + diff.id.slice(1)}`;
    btn.type = 'button';
    btn.className = `${diff.color} text-gray-800 dark:text-gray-100 text-sm rounded-full px-3 py-2 border border-gray-300 dark:border-gray-600 transition hover:opacity-90`;
    if (diff.id === selected) {
      btn.classList.add('ring-2', 'ring-blue-500');
    }
    btn.textContent = diff.label;
    container.appendChild(btn);
  });

  return { element: container, select: (id) => {
    document.querySelectorAll('#difficultyGroup button').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
    const selectedBtn = document.getElementById(`diff${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (selectedBtn) selectedBtn.classList.add('ring-2', 'ring-blue-500');
  }};
}

/**
 * File drop zone component
 */
export function createDropZone(maxSizeMB = 10, allowedTypes = ['pdf', 'docx']) {
  const container = document.createElement('div');
  container.id = 'dropZone';
  container.className = `drop-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition ${allowedTypes.includes('pdf') ? 'border-gray-300 dark:border-gray-600' : ''}`;

  const icon = document.createElement('i');
  icon.className = 'fas fa-cloud-upload-alt text-4xl text-gray-400 mb-3';
  container.appendChild(icon);

  const text = document.createElement('p');
  text.textContent = 'Drag a file here or <span class="text-blue-600 underline">choose file</span>';
  container.appendChild(text);

  // Hidden input
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'fileInput';
  input.accept = allowedTypes.map(t => `.${t}`).join(',');
  input.className = 'hidden';
  container.appendChild(input);

  // Info text
  const info = document.createElement('p');
  info.className = 'text-xs text-gray-500 mt-2';
  info.textContent = `PDF or DOCX • Max ${maxSizeMB}MB`;
  container.appendChild(info);

  return { element: container, input };
}

/**
 * Status area component
 */
export function createStatusArea() {
  const container = document.createElement('div');
  container.id = 'statusArea';
  container.className = 'p-4 rounded-lg text-center hidden';
  return { element: container };
}

/**
 * Theme toggle component
 */
export function createThemeToggle() {
  const btn = document.createElement('button');
  btn.id = 'themeToggle';
  btn.className = 'p-2 rounded-lg bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 dark:hover:bg-slate-600 transition';
  
  const icon = document.createElement('i');
  icon.className = 'fas fa-moon';
  btn.appendChild(icon);

  // Toggle functionality
  let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark);
  updateThemeIcon(isDark);

  btn.addEventListener('click', () => {
    isDark = !isDark;
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon(isDark);
  });

  return { element: btn };
}

function updateThemeIcon(isDark) {
  const icon = safeQuerySelector('#themeToggle i');
  if (icon) {
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
}

export default {
  createLoadingSpinner,
  showToast,
  createCharacterCounter,
  createDifficultySelector,
  createDropZone,
  createStatusArea,
  createThemeToggle,
  initializeComponents: () => {
    // Initialize all component event listeners here for centralized setup
    const difficultyGroup = document.getElementById('difficultyGroup');
    if (difficultyGroup) {
      document.querySelectorAll('#difficultyGroup button').forEach(button => {
        button.addEventListener('click', (e) => {
          const id = e.target.id.replace('diff', '').toLowerCase();
          // Re-select logic to ensure correct state management
          createDifficultySelector().select(id);
        });
      });
    }

    // Setup file drop zone listeners
    const dropZone = createDropZone();
    const input = dropZone.input;
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      document.getElementById('dropZone').addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults (e) { e.preventDefault(); e.stopPropagation(); }

    // Drag handlers
    ['dragenter', 'dragover'].forEach(eventName => {
      document.getElementById('dropZone').addEventListener(eventName, () => document.getElementById('dropZone').classList.add('border-blue-500'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
      document.getElementById('dropZone').addEventListener(eventName, () => document.getElementById('dropZone').classList.remove('border-blue-500'), false);
    });

    // Drop handler
    document.getElementById('dropZone').addEventListener('drop', handleDrop, false);
    input.addEventListener('change', handleFileSelect, false);
  }
}
