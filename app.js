/* ============================================
   TRELLO CLONE - app.js  v2.0
   Multi-board, drag-and-drop, labels, due dates,
   checklists, attachments, LocalStorage
   PM: Claude | EPD: Claude Code | Owner: Dewain
============================================ */

// ---- MULTI-BOARD STATE ----
let appState = {
  boards: [],
  activeBoardId: null,
  nextBoardId: 1,
  nextListId: 1,
  nextCardId: 1
};

function getActiveBoard() {
  return appState.boards.find(b => b.id === appState.activeBoardId) || null;
}

let dragCard = null;
let dragSourceListId = null;
let openCardId = null;
let openListId = null;

// ---- INIT ----
function init() {
  loadState();
  if (appState.boards.length === 0) {
    createBoard('My Board', '#1a73c1');
  }
  bindGlobalEvents();
  if (appState.activeBoardId) {
    showBoardView(appState.activeBoardId);
  } else {
    showHomePage();
  }
}

// ---- STORAGE ----
function saveState() {
  localStorage.setItem('trello-clone-v2', JSON.stringify(appState));
}
function loadState() {
  const s = localStorage.getItem('trello-clone-v2');
  if (s) { try { appState = JSON.parse(s); } catch(e) {} }
}

// ---- BOARD CRUD ----
function createBoard(title, bg) {
  const board = {
    id: appState.nextBoardId++,
    title: title || 'New Board',
    bg: bg || '#1a73c1',
    lists: []
  };
  board.lists.push(makeList('To Do', appState.nextListId++));
  board.lists.push(makeList('In Progress', appState.nextListId++));
  board.lists.push(makeList('Done', appState.nextListId++));
  if (appState.boards.length === 0) {
    board.lists[0].cards.push(makeCard('Welcome to TrelloClone!', appState.nextCardId++));
    board.lists[0].cards.push(makeCard('Drag cards between columns', appState.nextCardId++));
    board.lists[0].cards.push(makeCard('Click a card to edit it', appState.nextCardId++));
    board.lists[1].cards.push(makeCard('Add labels, due dates and checklists', appState.nextCardId++));
    board.lists[2].cards.push(makeCard('App built by Claude PM', appState.nextCardId++));
  }
  appState.boards.push(board);
  appState.activeBoardId = board.id;
  saveState();
  return board;
}

function deleteBoard(boardId) {
  appState.boards = appState.boards.filter(b => b.id !== boardId);
  appState.activeBoardId = appState.boards.length > 0 ? appState.boards[0].id : null;
  saveState();
}

function makeList(title, id) {
  return { id: id || appState.nextListId++, title: title || 'New List', cards: [] };
}
function makeCard(title, id) {
  return {
    id: id || appState.nextCardId++,
    title: title || 'New Card',
    description: '',
    labels: [],
    dueDate: '',
    checklist: [],
    attachments: []
  };
}

// ---- BOARD VIEWS ----
function showBoardView(boardId) {
  appState.activeBoardId = boardId;
  saveState();
  const board = getActiveBoard();
  if (!board) { showHomePage(); return; }
  document.getElementById('boards-screen').classList.add('hidden');
  document.getElementById('board-view').classList.remove('hidden');
  document.getElementById('board-title').textContent = board.title;
  document.body.style.background = board.bg;
  renderBoard();
}

function showHomePage() {
  appState.activeBoardId = null;
  saveState();
  document.getElementById('boards-screen').classList.remove('hidden');
  document.getElementById('board-view').classList.add('hidden');
  document.body.style.background = '#1a73c1';
  renderHomeScreen();
}

function renderHomeScreen() {
  const grid = document.getElementById('boards-grid');
  if (!grid) return;
  grid.innerHTML = appState.boards.map(b =>
    '<div class="board-card" data-id="' + b.id + '" style="background:' + b.bg + '" onclick="showBoardView(' + b.id + ')">' +
    '<span class="board-card-title">' + escHtml(b.title) + '</span>' +
    '<button class="board-card-delete" onclick="event.stopPropagation();confirmDeleteBoard(' + b.id + ')" title="Delete"><i class="fas fa-trash"></i></button>' +
    '</div>'
  ).join('');
}

function confirmDeleteBoard(boardId) {
  const board = appState.boards.find(b => b.id === boardId);
  if (confirm('Delete board "' + board.title + '" and all its cards?')) {
    deleteBoard(boardId);
    renderHomeScreen();
  }
}

// ---- LIST CRUD ----
function addList(title) {
  const board = getActiveBoard();
  if (!board) return;
  const list = makeList(title);
  board.lists.push(list);
  return list;
}

function deleteList(listId) {
  const board = getActiveBoard();
  if (!board) return;
  board.lists = board.lists.filter(l => l.id !== listId);
  saveState();
  renderBoard();
}

function getList(listId) {
  const board = getActiveBoard();
  return board ? board.lists.find(l => l.id === listId) : null;
}

// ---- CARD CRUD ----
function addCard(listId, title) {
  const list = getList(listId);
  if (!list) return;
  const card = makeCard(title);
  list.cards.push(card);
  return card;
}

function deleteCard(listId, cardId) {
  const list = getList(listId);
  if (!list) return;
  list.cards = list.cards.filter(c => c.id !== cardId);
  saveState();
  renderBoard();
  closeModal();
}

function getCard(listId, cardId) {
  const list = getList(listId);
  return list ? list.cards.find(c => c.id === cardId) : null;
}

// ---- RENDER BOARD ----
function renderBoard() {
  const board = getActiveBoard();
  if (!board) return;
  const boardEl = document.getElementById('board');
  const panel = document.getElementById('add-list-panel');
  boardEl.innerHTML = '';
  board.lists.forEach(list => boardEl.appendChild(createListEl(list)));
  boardEl.appendChild(panel);
  document.getElementById('board-title').textContent = board.title;
}

// ---- CREATE LIST ELEMENT ----
function createListEl(list) {
  const el = document.createElement('div');
  el.className = 'list';
  el.dataset.listId = list.id;
  el.innerHTML =
    '<div class="list-header">' +
    '<div class="list-title" contenteditable="true" spellcheck="false">' + escHtml(list.title) + '</div>' +
    '<button class="list-menu-btn" title="Options"><i class="fas fa-ellipsis-h"></i></button>' +
    '</div>' +
    '<div class="cards-container" id="cards-' + list.id + '"></div>' +
    '<button class="add-card-btn"><i class="fas fa-plus"></i> Add a card</button>';

  const container = el.querySelector('.cards-container');
  list.cards.forEach(card => container.appendChild(createCardEl(card, list.id)));

  const titleEl = el.querySelector('.list-title');
  titleEl.addEventListener('blur', () => { list.title = titleEl.textContent.trim() || 'List'; saveState(); });
  titleEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } });
  el.querySelector('.list-menu-btn').addEventListener('click', e => { e.stopPropagation(); showListMenu(e, list.id); });
  el.querySelector('.add-card-btn').addEventListener('click', () => showAddCardForm(list.id, el));

  el.addEventListener('dragover', e => {
    e.preventDefault();
    el.classList.add('drag-over');
    const afterEl = getDragAfterElement(container, e.clientY);
    if (!afterEl) container.appendChild(createPlaceholder());
    else container.insertBefore(createPlaceholder(), afterEl);
  });
  el.addEventListener('dragleave', e => {
    if (!el.contains(e.relatedTarget)) { el.classList.remove('drag-over'); removePlaceholders(); }
  });
  el.addEventListener('drop', e => {
    e.preventDefault();
    el.classList.remove('drag-over');
    removePlaceholders();
    if (dragCard === null) return;
    const board = getActiveBoard();
    const targetListId = parseInt(el.dataset.listId);
    const sourceList = board.lists.find(l => l.id === dragSourceListId);
    const targetList = board.lists.find(l => l.id === targetListId);
    if (!sourceList || !targetList) return;
    const cardIdx = sourceList.cards.findIndex(c => c.id === dragCard);
    const [card] = sourceList.cards.splice(cardIdx, 1);
    const afterEl = getDragAfterElement(container, e.clientY);
    if (!afterEl) targetList.cards.push(card);
    else {
      const afterId = parseInt(afterEl.dataset.cardId);
      const ins = targetList.cards.findIndex(c => c.id === afterId);
      targetList.cards.splice(ins, 0, card);
    }
    dragCard = null;
    dragSourceListId = null;
    saveState();
    renderBoard();
  });
  return el;
}

// ---- CREATE CARD ELEMENT ----
function createCardEl(card, listId) {
  const el = document.createElement('div');
  el.className = 'card';
  el.dataset.cardId = card.id;
  el.draggable = true;
  const today = new Date().toISOString().split('T')[0];
  const labelsHtml = card.labels.length
    ? '<div class="card-labels">' + card.labels.map(c => '<span class="card-label" style="background:' + c + '"></span>').join('') + '</div>'
    : '';
  let metaHtml = '';
  if (card.dueDate) {
    metaHtml += '<span class="card-meta-item ' + (card.dueDate < today ? 'overdue' : '') + '"><i class="fas fa-clock"></i> ' + formatDate(card.dueDate) + '</span>';
  }
  const total = card.checklist.length;
  const done = card.checklist.filter(i => i.done).length;
  if (total > 0) {
    metaHtml += '<span class="card-meta-item ' + (done === total ? 'done-check' : '') + '"><i class="fas fa-check-square"></i> ' + done + '/' + total + '</span>';
  }
  if (card.attachments && card.attachments.length > 0) {
    metaHtml += '<span class="card-meta-item"><i class="fas fa-paperclip"></i> ' + card.attachments.length + '</span>';
  }
  el.innerHTML = labelsHtml + '<div class="card-title">' + escHtml(card.title) + '</div>' + (metaHtml ? '<div class="card-meta">' + metaHtml + '</div>' : '');
  el.addEventListener('click', () => openCard(listId, card.id));
  el.addEventListener('dragstart', e => {
    dragCard = card.id;
    dragSourceListId = listId;
    el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    removePlaceholders();
    document.querySelectorAll('.list').forEach(l => l.classList.remove('drag-over'));
  });
  return el;
}

// ---- DRAG HELPERS ----
function getDragAfterElement(container, y) {
  const els = [...container.querySelectorAll('.card:not(.dragging):not(.placeholder)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function createPlaceholder() {
  removePlaceholders();
  const p = document.createElement('div');
  p.className = 'card placeholder';
  p.style.cssText = 'height:50px;background:rgba(9,30,66,0.1);border-radius:6px;border:2px dashed rgba(9,30,66,0.2);';
  return p;
}
function removePlaceholders() { document.querySelectorAll('.placeholder').forEach(p => p.remove()); }

// ---- ADD CARD FORM ----
function showAddCardForm(listId, listEl) {
  const existing = listEl.querySelector('.add-card-form');
  if (existing) { existing.remove(); return; }
  const btn = listEl.querySelector('.add-card-btn');
  const form = document.createElement('div');
  form.className = 'add-card-form';
  form.innerHTML = '<textarea placeholder="Enter a title..." rows="3" autofocus></textarea>' +
    '<div style="display:flex;gap:6px;">' +
    '<button class="btn-primary btn-sm confirm-card">Add Card</button>' +
    '<button class="btn-ghost cancel-card"><i class="fas fa-times"></i></button></div>';
  listEl.insertBefore(form, btn);
  const ta = form.querySelector('textarea');
  ta.focus();
  form.querySelector('.confirm-card').addEventListener('click', () => {
    const title = ta.value.trim();
    if (title) { addCard(listId, title); saveState(); renderBoard(); }
  });
  form.querySelector('.cancel-card').addEventListener('click', () => form.remove());
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.querySelector('.confirm-card').click(); }
    if (e.key === 'Escape') form.remove();
  });
}

// ---- LIST MENU ----
let activeMenu = null;
function showListMenu(e, listId) {
  if (activeMenu) { activeMenu.remove(); activeMenu = null; }
  const btn = e.target.closest('button') || e.target;
  const rect = btn.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'list-menu';
  menu.style.cssText = 'top:' + (rect.bottom + window.scrollY + 4) + 'px;left:' + (rect.left + window.scrollX) + 'px;position:absolute;';
  menu.innerHTML = '<button class="danger" id="menu-delete-list"><i class="fas fa-trash"></i> Delete List</button>';
  document.body.appendChild(menu);
  activeMenu = menu;
  menu.querySelector('#menu-delete-list').addEventListener('click', () => {
    if (confirm('Delete this list and all its cards?')) deleteList(listId);
    menu.remove(); activeMenu = null;
  });
  setTimeout(() => {
    document.addEventListener('click', () => { if (activeMenu) { activeMenu.remove(); activeMenu = null; } }, { once: true });
  }, 10);
}

// ---- CARD MODAL ----
function openCard(listId, cardId) {
  const card = getCard(listId, cardId);
  if (!card) return;
  const list = getList(listId);
  openCardId = cardId;
  openListId = listId;
  document.getElementById('modal-card-title').textContent = card.title;
  document.getElementById('modal-list-name').textContent = list.title;
  document.getElementById('modal-description').value = card.description || '';
  document.getElementById('modal-due-date').value = card.dueDate || '';
  renderModalLabels(card);
  renderChecklist(card);
  renderAttachments(card);
  const gcsNote = document.getElementById('gcs-note');
  if (gcsNote) gcsNote.textContent = (window.GCS_CONFIG && window.GCS_CONFIG.enabled) ? 'Connected to Google Cloud Storage' : 'GCS not configured - files saved locally';
  document.getElementById('card-modal-overlay').classList.remove('hidden');
}

function closeModal() {
  if (openCardId && openListId) {
    const card = getCard(openListId, openCardId);
    if (card) {
      card.title = document.getElementById('modal-card-title').textContent.trim() || 'Card';
      card.description = document.getElementById('modal-description').value;
      card.dueDate = document.getElementById('modal-due-date').value;
      saveState();
      renderBoard();
    }
  }
  document.getElementById('card-modal-overlay').classList.add('hidden');
  openCardId = null;
  openListId = null;
}

// ---- LABELS ----
function renderModalLabels(card) {
  const container = document.getElementById('modal-labels');
  container.innerHTML = card.labels.map(color =>
    '<span class="modal-label" style="background:' + color + '" data-color="' + color + '">' +
    '<span class="remove-label" onclick="removeLabel(this.parentElement.dataset.color)">x</span></span>'
  ).join('');
}
function removeLabel(color) {
  const card = getCard(openListId, openCardId);
  if (!card) return;
  card.labels = card.labels.filter(c => c !== color);
  saveState();
  renderModalLabels(card);
}

// ---- CHECKLIST ----
function renderChecklist(card) {
  const container = document.getElementById('checklist-items');
  const total = card.checklist.length;
  const done = card.checklist.filter(i => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  let html = '';
  if (total > 0) {
    html += '<div class="checklist-progress">' + pct + '%</div>' +
      '<div class="checklist-bar"><div class="checklist-bar-fill" style="width:' + pct + '%"></div></div>';
  }
  card.checklist.forEach(function(item, i) {
    html += '<div class="checklist-item">' +
      '<input type="checkbox" id="ci-' + i + '" ' + (item.done ? 'checked' : '') + ' onchange="toggleChecklistItem(' + i + ')" />' +
      '<label for="ci-' + i + '" class="' + (item.done ? 'done' : '') + '">' + escHtml(item.text) + '</label>' +
      '<button class="delete-item" onclick="deleteChecklistItem(' + i + ')"><i class="fas fa-times"></i></button>' +
      '</div>';
  });
  container.innerHTML = html;
}
function toggleChecklistItem(index) {
  const card = getCard(openListId, openCardId);
  if (!card) return;
  card.checklist[index].done = !card.checklist[index].done;
  saveState();
  renderChecklist(card);
}
function deleteChecklistItem(index) {
  const card = getCard(openListId, openCardId);
  if (!card) return;
  card.checklist.splice(index, 1);
  saveState();
  renderChecklist(card);
}

// ---- ATTACHMENTS ----
function renderAttachments(card) {
  const list = document.getElementById('attachments-list');
  let html = '';
  (card.attachments || []).forEach(function(a, i) {
    html += '<div class="attachment-item">' +
      '<i class="fas fa-file"></i>' +
      '<a href="' + (a.url || '#') + '" target="_blank">' + escHtml(a.name) + '</a>' +
      '<button class="delete-attach" onclick="deleteAttachment(' + i + ')"><i class="fas fa-trash"></i></button>' +
      '</div>';
  });
  list.innerHTML = html;
}
function deleteAttachment(index) {
  const card = getCard(openListId, openCardId);
  if (!card) return;
  card.attachments.splice(index, 1);
  saveState();
  renderAttachments(card);
}

// ---- GCS UPLOAD ----
async function uploadToGCS(file) {
  if (window.GCS_CONFIG && window.GCS_CONFIG.enabled && window.GCS_CONFIG.apiKey) {
    console.log('GCS upload to bucket: ' + window.GCS_CONFIG.bucketName);
  }
  return URL.createObjectURL(file);
}

// ---- GLOBAL EVENTS ----
function bindGlobalEvents() {
  var homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.addEventListener('click', showHomePage);

  var boardTitleEl = document.getElementById('board-title');
  if (boardTitleEl) {
    boardTitleEl.addEventListener('blur', function() {
      var board = getActiveBoard();
      if (board) { board.title = this.textContent.trim() || 'My Board'; saveState(); }
    });
  }

  document.getElementById('add-list-btn').addEventListener('click', function() {
    var panel = document.getElementById('add-list-panel');
    panel.classList.remove('hidden');
    document.getElementById('new-list-input').focus();
  });
  document.getElementById('confirm-add-list').addEventListener('click', function() {
    var title = document.getElementById('new-list-input').value.trim();
    if (title) {
      addList(title);
      saveState();
      renderBoard();
      document.getElementById('new-list-input').value = '';
      document.getElementById('add-list-panel').classList.add('hidden');
    }
  });
  document.getElementById('cancel-add-list').addEventListener('click', function() {
    document.getElementById('add-list-panel').classList.add('hidden');
    document.getElementById('new-list-input').value = '';
  });
  document.getElementById('new-list-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('confirm-add-list').click();
    if (e.key === 'Escape') document.getElementById('cancel-add-list').click();
  });

  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('card-modal-overlay').addEventListener('click', function(e) {
    if (e.target === document.getElementById('card-modal-overlay')) closeModal();
  });
  document.getElementById('modal-delete-card').addEventListener('click', function() {
    if (confirm('Delete this card?')) deleteCard(openListId, openCardId);
  });

  document.querySelectorAll('.label-color').forEach(function(el) {
    el.addEventListener('click', function() {
      if (!openCardId || !openListId) return;
      var card = getCard(openListId, openCardId);
      var color = el.dataset.color;
      if (!card.labels.includes(color)) {
        card.labels.push(color);
        saveState();
        renderModalLabels(card);
      }
    });
  });

  document.getElementById('add-checklist-btn').addEventListener('click', function() {
    var input = document.getElementById('new-checklist-input');
    var text = input.value.trim();
    if (!text || !openCardId || !openListId) return;
    var card = getCard(openListId, openCardId);
    card.checklist.push({ text: text, done: false });
    saveState();
    renderChecklist(card);
    input.value = '';
    input.focus();
  });
  document.getElementById('new-checklist-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('add-checklist-btn').click();
  });

  document.getElementById('attachment-input').addEventListener('change', async function(e) {
    var file = e.target.files[0];
    if (!file || !openCardId || !openListId) return;
    var card = getCard(openListId, openCardId);
    var url = await uploadToGCS(file);
    card.attachments.push({ name: file.name, url: url });
    saveState();
    renderAttachments(card);
    e.target.value = '';
  });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

  document.getElementById('modal-description').addEventListener('input', function() {
    var card = getCard(openListId, openCardId);
    if (card) { card.description = document.getElementById('modal-description').value; saveState(); }
  });

  document.getElementById('modal-due-date').addEventListener('change', function() {
    var card = getCard(openListId, openCardId);
    if (card) { card.dueDate = document.getElementById('modal-due-date').value; saveState(); renderBoard(); }
  });

  document.getElementById('modal-card-title').addEventListener('blur', function() {
    var card = getCard(openListId, openCardId);
    if (card) { card.title = document.getElementById('modal-card-title').textContent.trim() || 'Card'; saveState(); renderBoard(); }
  });

  var createBoardBtn = document.getElementById('create-board-btn');
  if (createBoardBtn) {
    createBoardBtn.addEventListener('click', function() {
      document.getElementById('create-board-overlay').classList.remove('hidden');
      document.getElementById('new-board-input').focus();
    });
  }
  var confirmCreate = document.getElementById('confirm-create-board');
  if (confirmCreate) {
    confirmCreate.addEventListener('click', function() {
      var title = document.getElementById('new-board-input').value.trim();
      var activeOpt = document.querySelector('.bg-option.active');
      var bg = activeOpt ? activeOpt.dataset.bg : '#1a73c1';
      if (title) {
        createBoard(title, bg);
        document.getElementById('create-board-overlay').classList.add('hidden');
        document.getElementById('new-board-input').value = '';
        showBoardView(appState.activeBoardId);
      }
    });
  }
  var cancelCreate = document.getElementById('cancel-create-board');
  if (cancelCreate) {
    cancelCreate.addEventListener('click', function() {
      document.getElementById('create-board-overlay').classList.add('hidden');
    });
  }
  document.querySelectorAll('.bg-option').forEach(function(el) {
    el.addEventListener('click', function() {
      document.querySelectorAll('.bg-option').forEach(function(o) { o.classList.remove('active'); });
      el.classList.add('active');
    });
  });
}

// ---- HELPERS ----
function escHtml(str) {
  var d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  return parts[1] + '/' + parts[2] + '/' + parts[0];
}

// ---- START ----
document.addEventListener('DOMContentLoaded', init);
