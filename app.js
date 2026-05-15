/* ============================================
   TRELLO CLONE - app.js
   All state stored in LocalStorage
   ============================================ */

// ---- STATE ----
let state = {
  boardTitle: 'My Board',
  lists: [],
  nextListId: 1,
  nextCardId: 1
};

let dragCard = null;
let dragSourceListId = null;
let openCardId = null;
let openListId = null;

// ---- INIT ----
function init() {
  loadState();
  renderBoard();
  bindGlobalEvents();

  // Default demo data
  if (state.lists.length === 0) {
    addList('To Do');
    addList('In Progress');
    addList('Done');
    addCard(state.lists[0].id, 'Welcome to TrelloClone!');
    addCard(state.lists[0].id, 'Drag cards between columns');
    addCard(state.lists[0].id, 'Click a card to edit it');
    addCard(state.lists[1].id, 'Add labels, due dates & checklists');
    addCard(state.lists[2].id, 'App built by Claude PM 🤖');
    saveState();
    renderBoard();
  }
}

// ---- STORAGE ----
function saveState() {
  localStorage.setItem('trello-clone-state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('trello-clone-state');
  if (saved) {
    try { state = JSON.parse(saved); } catch(e) {}
  }
}

// ---- LIST CRUD ----
function addList(title) {
  const list = {
    id: state.nextListId++,
    title: title || 'New List',
    cards: []
  };
  state.lists.push(list);
  return list;
}

function deleteList(listId) {
  state.lists = state.lists.filter(l => l.id !== listId);
  saveState();
  renderBoard();
}

function getList(listId) {
  return state.lists.find(l => l.id === listId);
}

// ---- CARD CRUD ----
function addCard(listId, title) {
  const list = getList(listId);
  if (!list) return;
  const card = {
    id: state.nextCardId++,
    title: title || 'New Card',
    description: '',
    labels: [],
    dueDate: '',
    checklist: [],
    attachments: []
  };
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
  const board = document.getElementById('board');
  const panel = document.getElementById('add-list-panel');
  board.innerHTML = '';

  state.lists.forEach(list => {
    const el = createListEl(list);
    board.appendChild(el);
  });

  board.appendChild(panel);
  document.getElementById('board-title').textContent = state.boardTitle;
}

// ---- CREATE LIST ELEMENT ----
function createListEl(list) {
  const el = document.createElement('div');
  el.className = 'list';
  el.dataset.listId = list.id;

  el.innerHTML = `
    <div class="list-header">
      <div class="list-title" contenteditable="true" spellcheck="false">${escHtml(list.title)}</div>
      <button class="list-menu-btn" title="List options"><i class="fas fa-ellipsis-h"></i></button>
    </div>
    <div class="cards-container" id="cards-${list.id}"></div>
    <button class="add-card-btn"><i class="fas fa-plus"></i> Add a card</button>
  `;

  // Render cards
  const container = el.querySelector('.cards-container');
  list.cards.forEach(card => {
    container.appendChild(createCardEl(card, list.id));
  });

  // Title edit
  const titleEl = el.querySelector('.list-title');
  titleEl.addEventListener('blur', () => {
    list.title = titleEl.textContent.trim() || 'List';
    saveState();
  });
  titleEl.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); }
  });

  // Menu
  el.querySelector('.list-menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showListMenu(e, list.id);
  });

  // Add card
  el.querySelector('.add-card-btn').addEventListener('click', () => {
    showAddCardForm(list.id, el);
  });

  // Drag over
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.classList.add('drag-over');
    const afterEl = getDragAfterElement(container, e.clientY);
    if (!afterEl) {
      container.appendChild(createPlaceholder());
    } else {
      container.insertBefore(createPlaceholder(), afterEl);
    }
  });

  el.addEventListener('dragleave', (e) => {
    if (!el.contains(e.relatedTarget)) {
      el.classList.remove('drag-over');
      removePlaceholders();
    }
  });

  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    removePlaceholders();
    if (dragCard === null) return;

    const targetListId = parseInt(el.dataset.listId);
    const sourceList = getList(dragSourceListId);
    const targetList = getList(targetListId);
    if (!sourceList || !targetList) return;

    const cardIndex = sourceList.cards.findIndex(c => c.id === dragCard);
    const [card] = sourceList.cards.splice(cardIndex, 1);

    const afterEl = getDragAfterElement(container, e.clientY);
    if (!afterEl) {
      targetList.cards.push(card);
    } else {
      const afterId = parseInt(afterEl.dataset.cardId);
      const insertAt = targetList.cards.findIndex(c => c.id === afterId);
      targetList.cards.splice(insertAt, 0, card);
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

  // Labels
  const labelsHtml = card.labels.length
    ? `<div class="card-labels">${card.labels.map(c => `<span class="card-label" style="background:${c}"></span>`).join('')}</div>`
    : '';

  // Meta
  const today = new Date().toISOString().split('T')[0];
  let metaHtml = '';
  if (card.dueDate) {
    const overdue = card.dueDate < today;
    metaHtml += `<span class="card-meta-item ${overdue ? 'overdue' : ''}"><i class="fas fa-clock"></i> ${formatDate(card.dueDate)}</span>`;
  }
  const total = card.checklist.length;
  const done = card.checklist.filter(i => i.done).length;
  if (total > 0) {
    metaHtml += `<span class="card-meta-item ${done === total ? 'done-check' : ''}"><i class="fas fa-check-square"></i> ${done}/${total}</span>`;
  }
  if (card.attachments && card.attachments.length > 0) {
    metaHtml += `<span class="card-meta-item"><i class="fas fa-paperclip"></i> ${card.attachments.length}</span>`;
  }

  el.innerHTML = `
    ${labelsHtml}
    <div class="card-title">${escHtml(card.title)}</div>
    ${metaHtml ? `<div class="card-meta">${metaHtml}</div>` : ''}
  `;

  el.addEventListener('click', () => openCard(listId, card.id));

  el.addEventListener('dragstart', (e) => {
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
  const draggableEls = [...container.querySelectorAll('.card:not(.dragging):not(.placeholder)')];
  return draggableEls.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    }
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

function removePlaceholders() {
  document.querySelectorAll('.placeholder').forEach(p => p.remove());
}

// ---- ADD CARD FORM ----
function showAddCardForm(listId, listEl) {
  const existing = listEl.querySelector('.add-card-form');
  if (existing) { existing.remove(); return; }

  const btn = listEl.querySelector('.add-card-btn');
  const form = document.createElement('div');
  form.className = 'add-card-form';
  form.innerHTML = `
    <textarea placeholder="Enter a title for this card..." rows="3" autofocus></textarea>
    <div style="display:flex;gap:6px;">
      <button class="btn-primary btn-sm confirm-card">Add Card</button>
      <button class="btn-ghost cancel-card"><i class="fas fa-times"></i></button>
    </div>
  `;

  listEl.insertBefore(form, btn);
  const ta = form.querySelector('textarea');
  ta.focus();

  form.querySelector('.confirm-card').addEventListener('click', () => {
    const title = ta.value.trim();
    if (title) {
      addCard(listId, title);
      saveState();
      renderBoard();
    }
  });

  form.querySelector('.cancel-card').addEventListener('click', () => {
    form.remove();
  });

  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.querySelector('.confirm-card').click();
    }
    if (e.key === 'Escape') form.remove();
  });
}

// ---- LIST MENU ----
let activeMenu = null;
function showListMenu(e, listId) {
  if (activeMenu) { activeMenu.remove(); activeMenu = null; }

  const menu = document.createElement('div');
  menu.className = 'list-menu';
  menu.style.top = (e.target.getBoundingClientRect().bottom + window.scrollY + 4) + 'px';
  menu.style.left = (e.target.getBoundingClientRect().left + window.scrollX) + 'px';
  menu.style.position = 'absolute';

  menu.innerHTML = `
    <button class="danger" id="menu-delete-list"><i class="fas fa-trash"></i> Delete List</button>
  `;

  document.body.appendChild(menu);
  activeMenu = menu;

  menu.querySelector('#menu-delete-list').addEventListener('click', () => {
    if (confirm('Delete this list and all its cards?')) {
      deleteList(listId);
    }
    menu.remove(); activeMenu = null;
  });

  setTimeout(() => {
    document.addEventListener('click', () => { if(activeMenu){activeMenu.remove();activeMenu=null;} }, { once: true });
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
  gcsNote.textContent = window.GCS_CONFIG && window.GCS_CONFIG.enabled
    ? 'Connected to Google Cloud Storage'
    : 'GCS not configured — files saved locally only';

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

// ---- MODAL LABELS ----
function renderModalLabels(card) {
  const container = document.getElementById('modal-labels');
  container.innerHTML = card.labels.map(color =>
    `<span class="modal-label" style="background:${color}" data-color="${color}">
      <span class="remove-label" onclick="removeLabel('${color}')">✕</span>
    </span>`
  ).join('');
}

function removeLabel(color) {
  if (!openCardId || !openListId) return;
  const card = getCard(openListId, openCardId);
  card.labels = card.labels.filter(c => c !== color);
  saveState();
  renderModalLabels(card);
}

// ---- MODAL CHECKLIST ----
function renderChecklist(card) {
  const container = document.getElementById('checklist-items');
  const total = card.checklist.length;
  const done = card.checklist.filter(i => i.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  container.innerHTML = `
    ${total > 0 ? `
      <div class="checklist-progress">${pct}%</div>
      <div class="checklist-bar"><div class="checklist-bar-fill" style="width:${pct}%"></div></div>
    ` : ''}
    ${card.checklist.map((item, i) => `
      <div class="checklist-item">
        <input type="checkbox" id="ci-${i}" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem(${i})" />
        <label for="ci-${i}" class="${item.done ? 'done' : ''}">${escHtml(item.text)}</label>
        <button class="delete-item" onclick="deleteChecklistItem(${i})"><i class="fas fa-times"></i></button>
      </div>
    `).join('')}
  `;
}

function toggleChecklistItem(index) {
  const card = getCard(openListId, openCardId);
  card.checklist[index].done = !card.checklist[index].done;
  saveState();
  renderChecklist(card);
}

function deleteChecklistItem(index) {
  const card = getCard(openListId, openCardId);
  card.checklist.splice(index, 1);
  saveState();
  renderChecklist(card);
}

// ---- ATTACHMENTS ----
function renderAttachments(card) {
  const list = document.getElementById('attachments-list');
  list.innerHTML = (card.attachments || []).map((a, i) => `
    <div class="attachment-item">
      <i class="fas fa-file"></i>
      <a href="${a.url || '#'}" target="_blank">${escHtml(a.name)}</a>
      <button class="delete-attach" onclick="deleteAttachment(${i})"><i class="fas fa-trash"></i></button>
    </div>
  `).join('');
}

function deleteAttachment(index) {
  const card = getCard(openListId, openCardId);
  card.attachments.splice(index, 1);
  saveState();
  renderAttachments(card);
}

// ---- GLOBAL EVENTS ----
function bindGlobalEvents() {
  // Board title
  document.getElementById('board-title').addEventListener('blur', function() {
    state.boardTitle = this.textContent.trim() || 'My Board';
    saveState();
  });

  // Add list button
  document.getElementById('add-list-btn').addEventListener('click', () => {
    const panel = document.getElementById('add-list-panel');
    panel.classList.remove('hidden');
    document.getElementById('new-list-input').focus();
  });

  document.getElementById('confirm-add-list').addEventListener('click', () => {
    const title = document.getElementById('new-list-input').value.trim();
    if (title) {
      addList(title);
      saveState();
      renderBoard();
      document.getElementById('new-list-input').value = '';
      document.getElementById('add-list-panel').classList.add('hidden');
    }
  });

  document.getElementById('cancel-add-list').addEventListener('click', () => {
    document.getElementById('add-list-panel').classList.add('hidden');
    document.getElementById('new-list-input').value = '';
  });

  document.getElementById('new-list-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('confirm-add-list').click();
    if (e.key === 'Escape') document.getElementById('cancel-add-list').click();
  });

  // Modal close
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('card-modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('card-modal-overlay')) closeModal();
  });

  // Modal delete
  document.getElementById('modal-delete-card').addEventListener('click', () => {
    if (confirm('Delete this card?')) {
      deleteCard(openListId, openCardId);
    }
  });

  // Label picker
  document.querySelectorAll('.label-color').forEach(el => {
    el.addEventListener('click', () => {
      if (!openCardId || !openListId) return;
      const card = getCard(openListId, openCardId);
      const color = el.dataset.color;
      if (!card.labels.includes(color)) {
        card.labels.push(color);
        saveState();
        renderModalLabels(card);
      }
    });
  });

  // Checklist add
  document.getElementById('add-checklist-btn').addEventListener('click', () => {
    const input = document.getElementById('new-checklist-input');
    const text = input.value.trim();
    if (!text || !openCardId || !openListId) return;
    const card = getCard(openListId, openCardId);
    card.checklist.push({ text, done: false });
    saveState();
    renderChecklist(card);
    input.value = '';
    input.focus();
  });

  document.getElementById('new-checklist-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('add-checklist-btn').click();
  });

  // File attachment
  document.getElementById('attachment-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !openCardId || !openListId) return;
    const card = getCard(openListId, openCardId);

    if (window.GCS_CONFIG && window.GCS_CONFIG.enabled && window.GCS_CONFIG.apiKey) {
      // GCS upload (placeholder — owner provides API key)
      const url = await uploadToGCS(file);
      card.attachments.push({ name: file.name, url });
    } else {
      // Local only
      const url = URL.createObjectURL(file);
      card.attachments.push({ name: file.name, url });
    }
    saveState();
    renderAttachments(card);
    e.target.value = '';
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Save description on change
  document.getElementById('modal-description').addEventListener('input', () => {
    if (!openCardId || !openListId) return;
    const card = getCard(openListId, openCardId);
    if (card) card.description = document.getElementById('modal-description').value;
    saveState();
  });

  // Due date change
  document.getElementById('modal-due-date').addEventListener('change', () => {
    if (!openCardId || !openListId) return;
    const card = getCard(openListId, openCardId);
    if (card) {
      card.dueDate = document.getElementById('modal-due-date').value;
      saveState();
      renderBoard();
    }
  });

  // Modal title edit
  document.getElementById('modal-card-title').addEventListener('blur', () => {
    if (!openCardId || !openListId) return;
    const card = getCard(openListId, openCardId);
    if (card) {
      card.title = document.getElementById('modal-card-title').textContent.trim() || 'Card';
      saveState();
      renderBoard();
    }
  });
}

// ---- GCS UPLOAD (stub — owner provides apiKey) ----
async function uploadToGCS(file) {
  const cfg = window.GCS_CONFIG;
  const formData = new FormData();
  formData.append('file', file);
  // Actual GCS signed URL upload goes here once apiKey is set
  console.warn('GCS upload not configured. Add apiKey to window.GCS_CONFIG in index.html');
  return URL.createObjectURL(file);
}

// ---- HELPERS ----
function escHtml(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(str || ''));
  return d.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
}

// ---- START ----
document.addEventListener('DOMContentLoaded', init);
