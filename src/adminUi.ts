export const adminUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Saga Admin</title>
<link rel="icon" type="image/png" href="/favicon.png">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
  header { background: #111; color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 16px; position: sticky; top: 0; z-index: 10; }
  header h1 { font-size: 18px; font-weight: 600; }
  #tokenInput { flex: 1; max-width: 400px; padding: 8px 12px; border: none; border-radius: 6px; font-size: 14px; background: #222; color: #fff; }
  #tokenInput::placeholder { color: #888; }
  nav { background: #fff; border-bottom: 1px solid #ddd; padding: 0 24px; display: flex; gap: 0; overflow-x: auto; }
  nav button { padding: 12px 20px; border: none; background: none; cursor: pointer; font-size: 14px; color: #666; border-bottom: 2px solid transparent; white-space: nowrap; }
  nav button.active { color: #111; border-bottom-color: #111; font-weight: 600; }
  nav button:hover { color: #111; }
  main { max-width: 1000px; margin: 24px auto; padding: 0 24px; }
  .section { display: none; }
  .section.active { display: block; }
  .card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card h3 { margin-bottom: 12px; font-size: 16px; }
  .form-row { display: flex; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
  .form-row label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #555; flex: 1; min-width: 150px; }
  .form-row input, .form-row textarea, .form-row select { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
  .form-row textarea { resize: vertical; min-height: 60px; }
  button.btn { padding: 8px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500; }
  .btn-primary { background: #111; color: #fff; }
  .btn-primary:hover { background: #333; }
  .btn-danger { background: #dc3545; color: #fff; }
  .btn-danger:hover { background: #b02a37; }
  .btn-secondary { background: #e9ecef; color: #333; }
  .btn-secondary:hover { background: #dee2e6; }
  .btn-sm { padding: 4px 10px; font-size: 12px; }
  .result { margin-top: 10px; padding: 10px; border-radius: 6px; font-size: 13px; word-break: break-all; }
  .result.ok { background: #d4edda; color: #155724; }
  .result.err { background: #f8d7da; color: #721c24; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; }
  th { font-weight: 600; color: #555; background: #fafafa; }
  .actions { display: flex; gap: 6px; }
</style>
</head>
<body>

<header>
  <img src="/logo.png" alt="My Saga" style="height:36px;width:36px;">
  <h1>My Saga Admin</h1>
  <input type="password" id="tokenInput" placeholder="Enter superToken..." autocomplete="off">
  <button onclick="document.getElementById('clone-modal').style.display=document.getElementById('clone-modal').style.display==='flex'?'none':'flex'" style="margin-left:auto;padding:8px 14px;border:none;border-radius:6px;background:#333;color:#fff;cursor:pointer;font-size:13px;white-space:nowrap;">Clone DB</button>
</header>

<div id="clone-modal" style="display:none;position:fixed;top:60px;right:24px;z-index:20;background:#fff;border-radius:8px;padding:16px;box-shadow:0 4px 20px rgba(0,0,0,0.15);flex-direction:column;gap:10px;min-width:280px;">
  <h3 style="font-size:14px;margin:0;">Clone DB IP</h3>
  <input type="password" id="clone-token" placeholder="Enter clone token..." autocomplete="off" style="padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:14px;">
  <button class="btn btn-primary" onclick="fetchCloneIp()">Get IP</button>
  <div id="clone-result"></div>
</div>

<nav>
  <button class="active" data-tab="categories">Categories</button>
  <button data-tab="badges">Badges</button>
  <button data-tab="themes">Themes</button>
  <button data-tab="spaces">Spaces</button>
</nav>

<main>

<!-- CATEGORIES -->
<div class="section active" id="categories">
  <div class="card">
    <h3>Create Category</h3>
    <div class="form-row">
      <label>Category <input id="cat-create-category"></label>
      <label>Subcategory <input id="cat-create-subcategory"></label>
    </div>
    <button class="btn btn-primary" onclick="createCategory()">Create</button>
    <div id="cat-create-result"></div>
  </div>
  <div class="card">
    <h3>All Categories</h3>
    <button class="btn btn-secondary" onclick="loadCategories()">Refresh</button>
    <div style="overflow-x:auto; margin-top:12px;"><table><thead><tr><th>Category</th><th>Subcategory</th><th>Actions</th></tr></thead><tbody id="cat-table"></tbody></table></div>
  </div>
  <div class="card">
    <h3>Upload Category Icon</h3>
    <div class="form-row">
      <label>Category <select id="cat-icon-id"><option value="">— select —</option></select></label>
      <label>Icon <input type="file" id="cat-icon-file" accept="image/*"></label>
    </div>
    <button class="btn btn-primary" onclick="uploadCatIcon()">Upload</button>
    <div id="cat-icon-result"></div>
  </div>
</div>

<!-- BADGES -->
<div class="section" id="badges">
  <div style="display:flex;gap:0;border-bottom:1px solid #ddd;margin-bottom:16px;">
    <button class="btn" onclick="switchBadgeTab('manage')" id="badge-tab-manage" style="border-bottom:2px solid #111;font-weight:600;border-radius:0;padding:10px 20px;">Manage</button>
    <button class="btn" onclick="switchBadgeTab('roadmaps')" id="badge-tab-roadmaps" style="border-bottom:2px solid transparent;border-radius:0;padding:10px 20px;color:#666;">Roadmaps</button>
  </div>
  <div id="badge-manage">
    <div class="card">
      <h3>Create Badge</h3>
      <div class="form-row">
        <label>Title <input id="badge-create-title"></label>
        <label>Category <select id="badge-create-catid"><option value="">— select —</option></select></label>
        <label>League <input type="number" id="badge-create-league" min="1" max="100"></label>
      </div>
      <div class="form-row">
        <label>Description <textarea id="badge-create-desc"></textarea></label>
      </div>
      <button class="btn btn-primary" onclick="createBadge()">Create</button>
      <div id="badge-create-result"></div>
    </div>
    <div class="card">
      <h3>All Badges</h3>
      <button class="btn btn-secondary" onclick="loadBadges()">Refresh</button>
      <div style="overflow-x:auto; margin-top:12px;"><table><thead><tr><th>Title</th><th>Category</th><th>League</th><th>Actions</th></tr></thead><tbody id="badge-table"></tbody></table></div>
    </div>
    <div class="card">
      <h3>Upload Badge Icon</h3>
      <div class="form-row">
        <label>Badge <select id="badge-icon-id"><option value="">— select —</option></select></label>
        <label>Icon <input type="file" id="badge-icon-file" accept="image/*"></label>
      </div>
      <button class="btn btn-primary" onclick="uploadBadgeIcon()">Upload</button>
      <div id="badge-icon-result"></div>
    </div>
  </div>
  <div id="badge-roadmaps" style="display:none;">
    <div class="card">
      <h3>View Roadmaps</h3>
      <div class="form-row">
        <label>Badge <select id="roadmap-badge-id" onchange="loadRoadmapsForBadge()"><option value="">— select a badge —</option></select></label>
      </div>
      <div id="roadmap-list"></div>
    </div>
  </div>
</div>

<!-- THEMES -->
<div class="section" id="themes">
  <div class="card">
    <h3>Create Theme</h3>
    <div class="form-row">
      <label>Name <input id="theme-create-name" maxlength="20"></label>
      <label>Description <input id="theme-create-desc" maxlength="200"></label>
    </div>
    <button class="btn btn-primary" onclick="createTheme()">Create</button>
    <div id="theme-create-result"></div>
  </div>
  <div class="card">
    <h3>All Themes</h3>
    <button class="btn btn-secondary" onclick="loadThemes()">Refresh</button>
    <div style="overflow-x:auto; margin-top:12px;"><table><thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody id="theme-table"></tbody></table></div>
  </div>
  <div class="card">
    <h3>Upload Theme Icon</h3>
    <div class="form-row">
      <label>Theme <select id="theme-icon-id"><option value="">— select —</option></select></label>
      <label>Icon <input type="file" id="theme-icon-file" accept="image/*"></label>
    </div>
    <button class="btn btn-primary" onclick="uploadThemeIcon()">Upload</button>
    <div id="theme-icon-result"></div>
  </div>
</div>

<!-- SPACES -->
<div class="section" id="spaces">
  <div class="card">
    <h3>Create Space</h3>
    <div class="form-row">
      <label>Name <input id="space-create-name"></label>
      <label>Link <input id="space-create-link" placeholder="https://maps.google.com/..."></label>
    </div>
    <div class="form-row">
      <label>Latitude <input type="number" step="any" id="space-create-lat"></label>
      <label>Longitude <input type="number" step="any" id="space-create-long"></label>
    </div>
    <button class="btn btn-primary" onclick="createSpace()">Create</button>
    <div id="space-create-result"></div>
  </div>
  <div class="card">
    <h3>All Spaces</h3>
    <button class="btn btn-secondary" onclick="loadSpaces()">Refresh</button>
    <div style="overflow-x:auto; margin-top:12px;"><table><thead><tr><th>Name</th><th>Link</th><th>Lat</th><th>Long</th><th>Actions</th></tr></thead><tbody id="space-table"></tbody></table></div>
  </div>
</div>


</main>

<!-- EDIT MODAL -->
<div id="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:20; align-items:center; justify-content:center;">
  <div style="background:#fff; border-radius:10px; padding:24px; width:90%; max-width:500px; max-height:80vh; overflow-y:auto;">
    <h3 id="modal-title" style="margin-bottom:16px;">Edit</h3>
    <div id="modal-body"></div>
    <div style="display:flex; gap:10px; margin-top:16px;">
      <button class="btn btn-primary" id="modal-save">Save</button>
      <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    </div>
    <div id="modal-result"></div>
  </div>
</div>

<script>
var BASE = window.location.origin;
function token() { return document.getElementById('tokenInput').value; }

async function api(path, body) {
  var t = token();
  if (!t) { alert('Enter superToken first'); throw new Error('no token'); }
  var res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ superToken: t }, body || {}))
  });
  var data = await res.json();
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
  return data;
}

function show(el, msg, ok) {
  var d = typeof el === 'string' ? document.getElementById(el) : el;
  d.className = 'result ' + (ok ? 'ok' : 'err');
  d.textContent = typeof msg === 'string' ? msg : JSON.stringify(msg);
}

function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

// Tabs
document.querySelectorAll('nav button').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('nav button').forEach(function(b) { b.classList.remove('active'); });
    document.querySelectorAll('.section').forEach(function(s) { s.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Modal
function openModal(title, fields, onSave) {
  document.getElementById('modal-title').textContent = title;
  var body = document.getElementById('modal-body');
  body.innerHTML = fields.map(function(f) {
    return '<div class="form-row"><label>' + esc(f.label) + ' <input id="modal-' + f.key + '" value="' + esc(f.value == null ? '' : f.value) + '"></label></div>';
  }).join('');
  document.getElementById('modal-result').innerHTML = '';
  document.getElementById('modal-save').onclick = async function() {
    var vals = {};
    fields.forEach(function(f) {
      var v = document.getElementById('modal-' + f.key).value;
      vals[f.key] = f.type === 'number' ? (v ? Number(v) : null) : (v || null);
    });
    try {
      var r = await onSave(vals);
      show('modal-result', r.message || JSON.stringify(r), true);
      closeModal();
    } catch (e) { show('modal-result', e.message, false); }
  };
  document.getElementById('modal-overlay').style.display = 'flex';
}
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

// In-memory lists for dropdowns
var catList = [], badgeList = [], themeList = [], spaceList = [];

function fillSelect(selId, items, labelFn) {
  var sel = document.getElementById(selId);
  var cur = sel.value;
  sel.innerHTML = '<option value="">— select —</option>' +
    items.map(function(it) { return '<option value="' + it.id + '"' + (it.id == cur ? ' selected' : '') + '>' + esc(labelFn(it)) + '</option>'; }).join('');
}

// Categories
async function loadCategories() {
  try {
    var r = await api('/admin/categories');
    catList = r.categories;
    var tb = document.getElementById('cat-table');
    tb.innerHTML = catList.map(function(c) {
      return '<tr><td>' + esc(c.category) + '</td><td>' + esc(c.subcategory) + '</td><td class="actions">' +
        '<button class="btn btn-secondary btn-sm" onclick="editCategory(' + c.id + ',\\'' + esc(c.category).replace(/'/g,"\\\\'") + '\\',\\'' + esc(c.subcategory).replace(/'/g,"\\\\'") + '\\')">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="delCategory(' + c.id + ',\\'' + esc(c.category).replace(/'/g,"\\\\'") + '\\')">Delete</button></td></tr>';
    }).join('');
    fillSelect('cat-icon-id', catList, function(c) { return c.category + (c.subcategory ? ' — ' + c.subcategory : ''); });
    fillSelect('badge-create-catid', catList, function(c) { return c.category + (c.subcategory ? ' — ' + c.subcategory : ''); });
  } catch(e) { alert(e.message); }
}
async function createCategory() {
  try {
    var r = await api('/admin/create-category', {
      category: document.getElementById('cat-create-category').value,
      subCategory: document.getElementById('cat-create-subcategory').value || null
    });
    show('cat-create-result', r.message, true);
    loadCategories();
  } catch(e) { show('cat-create-result', e.message, false); }
}
function editCategory(id, cat, sub) {
  openModal('Edit Category', [
    { key: 'category', label: 'Category', value: cat },
    { key: 'subcategory', label: 'Subcategory', value: sub }
  ], function(vals) { return api('/admin/update-category', Object.assign({ id: id }, vals)).then(function(r) { loadCategories(); return r; }); });
}
async function delCategory(id, name) {
  if (!confirm('Delete "' + name + '"? This cascades to space relations and qualifications.')) return;
  try { await api('/admin/delete-category', { id: id }); loadCategories(); } catch(e) { alert(e.message); }
}
async function uploadCatIcon() {
  try {
    var id = Number(document.getElementById('cat-icon-id').value);
    if (!id) throw new Error('Select a category');
    var file = document.getElementById('cat-icon-file').files[0];
    if (!file) throw new Error('Pick a file');
    var b64 = await fileToBase64(file);
    var r = await api('/admin/upload-category-icon', { categoryId: id, icon: b64 });
    show('cat-icon-result', r.message, true);
  } catch(e) { show('cat-icon-result', e.message, false); }
}

// Badges
async function loadBadges() {
  try {
    var r = await api('/admin/badges');
    badgeList = r.badges;
    var catMap = {};
    catList.forEach(function(c) { catMap[c.id] = c.category + (c.subcategory ? ' — ' + c.subcategory : ''); });
    var tb = document.getElementById('badge-table');
    tb.innerHTML = badgeList.map(function(b) {
      return '<tr><td>' + esc(b.title) + '</td><td>' + esc(catMap[b.category_id] || '') + '</td><td>' + (b.league || '') + '</td><td class="actions">' +
        '<button class="btn btn-secondary btn-sm" onclick="editBadge(' + b.id + ',\\'' + esc(b.title).replace(/'/g,"\\\\'") + '\\',' + (b.category_id||'null') + ',' + (b.league||'null') + ',\\'' + esc(b.description||'').replace(/'/g,"\\\\'") + '\\')">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="delBadge(' + b.id + ',\\'' + esc(b.title).replace(/'/g,"\\\\'") + '\\')">Delete</button></td></tr>';
    }).join('');
    fillSelect('badge-icon-id', badgeList, function(b) { return b.title; });
  } catch(e) { alert(e.message); }
}
async function createBadge() {
  try {
    var r = await api('/admin/create-badge', {
      title: document.getElementById('badge-create-title').value,
      categoryId: Number(document.getElementById('badge-create-catid').value) || null,
      league: Number(document.getElementById('badge-create-league').value) || null,
      description: document.getElementById('badge-create-desc').value || null
    });
    show('badge-create-result', r.message, true);
    loadBadges();
  } catch(e) { show('badge-create-result', e.message, false); }
}
function editBadge(id, title, catId, league, desc) {
  openModal('Edit Badge', [
    { key: 'title', label: 'Title', value: title },
    { key: 'league', label: 'League', value: league, type: 'number' },
    { key: 'description', label: 'Description', value: desc }
  ], function(vals) { return api('/admin/update-badge', Object.assign({ id: id, categoryId: catId }, vals)).then(function(r) { loadBadges(); return r; }); });
}
async function delBadge(id, title) {
  if (!confirm('Delete badge "' + title + '"?')) return;
  try { await api('/admin/delete-badge', { id: id }); loadBadges(); } catch(e) { alert(e.message); }
}
function switchBadgeTab(tab) {
  document.getElementById('badge-manage').style.display = tab === 'manage' ? 'block' : 'none';
  document.getElementById('badge-roadmaps').style.display = tab === 'roadmaps' ? 'block' : 'none';
  document.getElementById('badge-tab-manage').style.borderBottomColor = tab === 'manage' ? '#111' : 'transparent';
  document.getElementById('badge-tab-manage').style.fontWeight = tab === 'manage' ? '600' : '400';
  document.getElementById('badge-tab-manage').style.color = tab === 'manage' ? '#111' : '#666';
  document.getElementById('badge-tab-roadmaps').style.borderBottomColor = tab === 'roadmaps' ? '#111' : 'transparent';
  document.getElementById('badge-tab-roadmaps').style.fontWeight = tab === 'roadmaps' ? '600' : '400';
  document.getElementById('badge-tab-roadmaps').style.color = tab === 'roadmaps' ? '#111' : '#666';
  if (tab === 'roadmaps') fillSelect('roadmap-badge-id', badgeList, function(b) { return b.title; });
}
async function loadRoadmapsForBadge() {
  var id = Number(document.getElementById('roadmap-badge-id').value);
  var el = document.getElementById('roadmap-list');
  if (!id) { el.innerHTML = ''; return; }
  try {
    var r = await api('/admin/badge-roadmaps', { badgeId: id });
    var roadmaps = r.roadmaps || [];
    if (roadmaps.length === 0) { el.innerHTML = '<p style="color:#666;font-size:13px;">No roadmaps generated yet.</p>'; return; }
    el.innerHTML = roadmaps.map(function(rm, i) {
      return '<div class="card" style="margin-top:10px;"><h3 style="font-size:13px;color:#888;">Roadmap ' + (i+1) + '</h3><pre style="white-space:pre-wrap;font-size:13px;margin-top:8px;">' + esc(rm) + '</pre></div>';
    }).join('');
  } catch(e) { el.innerHTML = '<p style="color:#dc3545;font-size:13px;">' + esc(e.message) + '</p>'; }
}

async function uploadBadgeIcon() {
  try {
    var id = Number(document.getElementById('badge-icon-id').value);
    if (!id) throw new Error('Select a badge');
    var file = document.getElementById('badge-icon-file').files[0];
    if (!file) throw new Error('Pick a file');
    var b64 = await fileToBase64(file);
    var r = await api('/admin/upload-badge-icon', { badgeId: id, icon: b64 });
    show('badge-icon-result', r.message, true);
  } catch(e) { show('badge-icon-result', e.message, false); }
}

// Themes
async function loadThemes() {
  try {
    var r = await api('/admin/themes');
    themeList = r.themes;
    var tb = document.getElementById('theme-table');
    tb.innerHTML = themeList.map(function(t) {
      return '<tr><td>' + esc(t.name) + '</td><td>' + esc(t.description) + '</td><td class="actions">' +
        '<button class="btn btn-secondary btn-sm" onclick="editTheme(' + t.id + ',\\'' + esc(t.name).replace(/'/g,"\\\\'") + '\\',\\'' + esc(t.description||'').replace(/'/g,"\\\\'") + '\\')">Edit</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="delTheme(' + t.id + ',\\'' + esc(t.name).replace(/'/g,"\\\\'") + '\\')">Delete</button></td></tr>';
    }).join('');
    fillSelect('theme-icon-id', themeList, function(t) { return t.name; });
  } catch(e) { alert(e.message); }
}
async function createTheme() {
  try {
    var r = await api('/admin/create-theme', {
      name: document.getElementById('theme-create-name').value,
      description: document.getElementById('theme-create-desc').value || null
    });
    show('theme-create-result', r.message, true);
    loadThemes();
  } catch(e) { show('theme-create-result', e.message, false); }
}
function editTheme(id, name, desc) {
  openModal('Edit Theme', [
    { key: 'name', label: 'Name', value: name },
    { key: 'description', label: 'Description', value: desc }
  ], function(vals) { return api('/admin/update-theme', Object.assign({ id: id }, vals)).then(function(r) { loadThemes(); return r; }); });
}
async function delTheme(id, name) {
  if (!confirm('Delete theme "' + name + '"?')) return;
  try { await api('/admin/delete-theme', { id: id }); loadThemes(); } catch(e) { alert(e.message); }
}
async function uploadThemeIcon() {
  try {
    var id = Number(document.getElementById('theme-icon-id').value);
    if (!id) throw new Error('Select a theme');
    var file = document.getElementById('theme-icon-file').files[0];
    if (!file) throw new Error('Pick a file');
    var b64 = await fileToBase64(file);
    var r = await api('/admin/upload-theme-icon', { themeId: id, icon: b64 });
    show('theme-icon-result', r.message, true);
  } catch(e) { show('theme-icon-result', e.message, false); }
}

// Spaces
async function loadSpaces() {
  try {
    var r = await api('/admin/spaces');
    spaceList = r.spaces;
    var tb = document.getElementById('space-table');
    tb.innerHTML = spaceList.map(function(s) {
      return '<tr><td>' + esc(s.name) + '</td><td>' + (s.link ? '<a href="' + esc(s.link) + '" target="_blank">link</a>' : '') + '</td><td>' + (s.lat || '') + '</td><td>' + (s.long || '') + '</td><td class="actions">' +
        '<button class="btn btn-secondary btn-sm" onclick="editSpace(' + s.id + ',\\'' + esc(s.name).replace(/'/g,"\\\\'") + '\\',\\'' + esc(s.link||'').replace(/'/g,"\\\\'") + '\\',' + (s.lat||'null') + ',' + (s.long||'null') + ')">Edit</button> ' +
        '<button class="btn btn-secondary btn-sm" onclick="manageSpaceCats(' + s.id + ',\\'' + esc(s.name).replace(/'/g,"\\\\'") + '\\')">Categories</button> ' +
        '<button class="btn btn-danger btn-sm" onclick="delSpace(' + s.id + ',\\'' + esc(s.name).replace(/'/g,"\\\\'") + '\\')">Delete</button></td></tr>';
    }).join('');
  } catch(e) { alert(e.message); }
}
async function createSpace() {
  try {
    var r = await api('/admin/create-space', {
      name: document.getElementById('space-create-name').value,
      link: document.getElementById('space-create-link').value || null,
      lat: Number(document.getElementById('space-create-lat').value) || null,
      long: Number(document.getElementById('space-create-long').value) || null
    });
    show('space-create-result', r.message, true);
    loadSpaces();
  } catch(e) { show('space-create-result', e.message, false); }
}
function editSpace(id, name, link, lat, lng) {
  openModal('Edit Space', [
    { key: 'name', label: 'Name', value: name },
    { key: 'link', label: 'Link', value: link },
    { key: 'lat', label: 'Latitude', value: lat, type: 'number' },
    { key: 'long', label: 'Longitude', value: lng, type: 'number' }
  ], function(vals) { return api('/admin/update-space', Object.assign({ id: id }, vals)).then(function(r) { loadSpaces(); return r; }); });
}
async function delSpace(id, name) {
  if (!confirm('Delete space "' + name + '"? This cascades to slots, props, and category relations.')) return;
  try { await api('/admin/delete-space', { id: id }); loadSpaces(); } catch(e) { alert(e.message); }
}
async function manageSpaceCats(spaceId, name) {
  try {
    var results = await Promise.all([api('/admin/categories'), api('/admin/get-space-categories', { spaceId: spaceId })]);
    var cats = results[0]; var assigned = results[1];
    var assignedIds = {};
    assigned.categories.forEach(function(c) { assignedIds[c.category_id] = true; });
    var body = document.getElementById('modal-body');
    document.getElementById('modal-title').textContent = 'Categories for: ' + name;
    body.innerHTML = '<div style="max-height:300px;overflow-y:auto;">' +
      cats.categories.map(function(c) {
        return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:14px;"><input type="checkbox" value="' + c.id + '"' + (assignedIds[c.id] ? ' checked' : '') + '> ' + esc(c.category) + ' - ' + esc(c.subcategory) + '</label>';
      }).join('') + '</div>';
    document.getElementById('modal-result').innerHTML = '';
    document.getElementById('modal-save').onclick = async function() {
      var ids = [];
      body.querySelectorAll('input[type=checkbox]:checked').forEach(function(cb) { ids.push(Number(cb.value)); });
      try {
        await api('/admin/set-space-categories', { spaceId: spaceId, categoryIds: ids });
        show('modal-result', 'Updated', true);
        closeModal();
      } catch(e) { show('modal-result', e.message, false); }
    };
    document.getElementById('modal-overlay').style.display = 'flex';
  } catch(e) { alert(e.message); }
}

// Clone DB
async function fetchCloneIp() {
  var t = document.getElementById('clone-token').value;
  if (!t) { show('clone-result', 'Enter the clone token first', false); return; }
  try {
    var res = await fetch(BASE + '/auth/clone-ip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: t })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status);
    show('clone-result', 'IP: ' + data.ip, true);
  } catch(e) { show('clone-result', e.message, false); }
}

// Helpers
function fileToBase64(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();
    reader.onload = function() { resolve(reader.result.split(',')[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
</script>
</body>
</html>`;
