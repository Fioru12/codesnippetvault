// ==================== API ====================
const API = 'http://localhost:3002/api';

async function fetchAPI(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ==================== STATE ====================
let snippets = [];
let filteredSnippets = [];
let activeTag = null;
let activeLang = null;
let searchQuery = '';

// ==================== DOM ELEMENTS ====================
const snippetGrid = document.getElementById('snippetGrid');
const searchInput = document.getElementById('searchInput');
const addBtn = document.getElementById('addBtn');
const modalOverlay = document.getElementById('modalOverlay');
const snippetForm = document.getElementById('snippetForm');
const tagList = document.getElementById('tagList');
const langList = document.getElementById('langList');
const statsEl = document.getElementById('stats');

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
  loadSnippets();
  loadTags();
  loadLanguages();
  loadStats();
  setupEvents();
});

function setupEvents() {
  addBtn.addEventListener('click', () => openModal());
  document.getElementById('modalClose').addEventListener('click', () => closeModal());
  document.getElementById('cancelBtn').addEventListener('click', () => closeModal());
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  snippetForm.addEventListener('submit', handleFormSubmit);
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });
}

// ==================== MODAL ====================
function openModal(snippet = null) {
  modalOverlay.classList.add('active');
  document.getElementById('modalTitle').textContent = snippet ? 'Modifica Snippet' : 'Nuovo Snippet';
  document.getElementById('snippetId').value = snippet?.id || '';
  document.getElementById('title').value = snippet?.title || '';
  document.getElementById('language').value = snippet?.language || 'javascript';
  document.getElementById('code').value = snippet?.code || '';
  document.getElementById('tags').value = snippet?.tags?.join(', ') || '';
  document.getElementById('description').value = snippet?.description || '';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  snippetForm.reset();
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('snippetId').value;
  const data = {
    title: document.getElementById('title').value.trim(),
    code: document.getElementById('code').value,
    language: document.getElementById('language').value,
    tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean),
    description: document.getElementById('description').value.trim()
  };

  try {
    if (id) {
      await fetchAPI(`${API}/snippets/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    } else {
      await fetchAPI(`${API}/snippets`, { method: 'POST', body: JSON.stringify(data) });
    }
    closeModal();
    loadSnippets();
    loadTags();
    loadLanguages();
    loadStats();
  } catch (err) {
    console.error('Errore:', err);
  }
}

// ==================== LOAD ====================
async function loadSnippets() {
  try {
    snippets = await fetchAPI(`${API}/snippets`);
    applyFilters();
  } catch (err) {
    snippetGrid.innerHTML = '<div class="empty-state">Errore caricamento snippet</div>';
  }
}

function applyFilters() {
  let result = [...snippets];
  if (activeTag) result = result.filter(s => s.tags?.includes(activeTag));
  if (activeLang) result = result.filter(s => s.language === activeLang);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
  filteredSnippets = result;
  renderSnippets();
}

function renderSnippets() {
  if (filteredSnippets.length === 0) {
    snippetGrid.innerHTML = '<div class="empty-state">Nessuno snippet trovato. Creane uno!</div>';
    return;
  }
  snippetGrid.innerHTML = filteredSnippets.map(s => `
    <div class="snippet-card">
      <div class="snippet-header">
        <span class="snippet-title">${escapeHtml(s.title)}</span>
        <span class="snippet-lang">${s.language}</span>
      </div>
      <div class="snippet-code">
        <pre class="language-${s.language}"><code class="language-${s.language}">${escapeHtml(s.code)}</code></pre>
      </div>
      <div class="snippet-footer">
        <div class="snippet-tags">
          ${(s.tags || []).map(t => `<span class="snippet-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="snippet-actions">
          <button class="action-btn" onclick="copySnippet('${s.id}')">📋</button>
          <button class="action-btn" onclick="editSnippet('${s.id}')">✏️</button>
          <button class="action-btn" onclick="deleteSnippet('${s.id}')">🗑️</button>
        </div>
      </div>
    </div>
  `);
  if (typeof Prism !== 'undefined') Prism.highlightAll();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==================== ACTIONS ====================
async function copySnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) {
    navigator.clipboard.writeText(snippet.code);
    try { await fetchAPI(`${API}/snippets/${id}/copy`, { method: 'POST' }); } catch {}
    loadStats();
  }
}

async function editSnippet(id) {
  const snippet = snippets.find(s => s.id === id);
  if (snippet) openModal(snippet);
}

async function deleteSnippet(id) {
  if (!confirm('Eliminare questo snippet?')) return;
  try {
    await fetchAPI(`${API}/snippets/${id}`, { method: 'DELETE' });
    loadSnippets();
    loadTags();
    loadLanguages();
    loadStats();
  } catch (err) {
    console.error('Errore:', err);
  }
}

// ==================== TAGS & LANGUAGES ====================
async function loadTags() {
  try {
    const tags = await fetchAPI(`${API}/tags`);
    const tagEntries = Object.entries(tags).sort((a, b) => b[1] - a[1]);
    tagList.innerHTML = tagEntries.map(([tag, count]) =>
      `<span class="tag" onclick="filterByTag('${tag}')">${escapeHtml(tag)} (${count})</span>`
    ).join('');
  } catch { tagList.innerHTML = ''; }
}

async function loadLanguages() {
  try {
    const langs = await fetchAPI(`${API}/languages`);
    const langEntries = Object.entries(langs).sort((a, b) => b[1] - a[1]);
    langList.innerHTML = langEntries.map(([lang, count]) =>
      `<span class="tag" onclick="filterByLang('${lang}')">${escapeHtml(lang)} (${count})</span>`
    ).join('');
  } catch { langList.innerHTML = ''; }
}

async function loadStats() {
  try {
    const allSnippets = await fetchAPI(`${API}/snippets`);
    const total = allSnippets.length;
    const totalCopies = allSnippets.reduce((sum, s) => sum + (s.copies || 0), 0);
    const totalTags = new Set(allSnippets.flatMap(s => s.tags || [])).size;
    statsEl.innerHTML = `
      <div class="stat-item"><span>Totale snippet</span><span>${total}</span></div>
      <div class="stat-item"><span>Copie</span><span>${totalCopies}</span></div>
      <div class="stat-item"><span>Tag unici</span><span>${totalTags}</span></div>
    `;
  } catch { statsEl.innerHTML = ''; }
}

// ==================== FILTERS ====================
function filterByTag(tag) {
  activeTag = tag === activeTag ? null : tag;
  applyFilters();
}

function filterByLang(lang) {
  activeLang = lang === activeLang ? null : lang;
  applyFilters();
}