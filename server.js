const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data', 'snippets.json');

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Read/write snippets
function readSnippets() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch { return []; }
}

function writeSnippets(snippets) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(snippets, null, 2));
}

// ==================== API ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// Get all snippets
app.get('/api/snippets', (req, res) => {
  const snippets = readSnippets();
  const { tag, lang, search } = req.query;
  let filtered = snippets;
  if (tag) filtered = filtered.filter(s => s.tags?.includes(tag));
  if (lang) filtered = filtered.filter(s => s.language === lang);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.tags?.some(t => t.toLowerCase().includes(q))
    );
  }
  res.json(filtered);
});

// Get single snippet
app.get('/api/snippets/:id', (req, res) => {
  const snippets = readSnippets();
  const snippet = snippets.find(s => s.id === req.params.id);
  if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
  res.json(snippet);
});

// Create snippet
app.post('/api/snippets', (req, res) => {
  const { title, code, language, tags, description } = req.body;
  if (!title || !code) return res.status(400).json({ error: 'Title and code required' });
  const snippet = {
    id: Date.now().toString(),
    title: title.trim(),
    code,
    language: language || 'javascript',
    tags: tags || [],
    description: description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    copies: 0
  };
  const snippets = readSnippets();
  snippets.push(snippet);
  writeSnippets(snippets);
  res.status(201).json(snippet);
});

// Update snippet
app.put('/api/snippets/:id', (req, res) => {
  const snippets = readSnippets();
  const idx = snippets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { title, code, language, tags, description } = req.body;
  if (title) snippets[idx].title = title.trim();
  if (code) snippets[idx].code = code;
  if (language) snippets[idx].language = language;
  if (tags) snippets[idx].tags = tags;
  if (description !== undefined) snippets[idx].description = description;
  snippets[idx].updatedAt = new Date().toISOString();
  writeSnippets(snippets);
  res.json(snippets[idx]);
});

// Delete snippet
app.delete('/api/snippets/:id', (req, res) => {
  let snippets = readSnippets();
  const before = snippets.length;
  snippets = snippets.filter(s => s.id !== req.params.id);
  if (snippets.length === before) return res.status(404).json({ error: 'Not found' });
  writeSnippets(snippets);
  res.json({ ok: true });
});

// Increment copy count
app.post('/api/snippets/:id/copy', (req, res) => {
  const snippets = readSnippets();
  const idx = snippets.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  snippets[idx].copies = (snippets[idx].copies || 0) + 1;
  writeSnippets(snippets);
  res.json({ copies: snippets[idx].copies });
});

// Get tags
app.get('/api/tags', (req, res) => {
  const snippets = readSnippets();
  const tags = {};
  snippets.forEach(s => {
    s.tags?.forEach(t => { tags[t] = (tags[t] || 0) + 1; });
  });
  res.json(tags);
});

// Get languages
app.get('/api/languages', (req, res) => {
  const snippets = readSnippets();
  const langs = {};
  snippets.forEach(s => {
    langs[s.language] = (langs[s.language] || 0) + 1;
  });
  res.json(langs);
});

// ==================== SPA Fallback ====================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== Start ====================
app.listen(PORT, () => {
  console.log(`✨ CodeSnippetVault avviato su porta ${PORT}`);
  console.log(`🌐 Apri http://localhost:${PORT} nel browser`);
});
</arg_value></tool_call>