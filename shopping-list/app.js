const KEY = 'shoppingList';
const itemsEl = document.getElementById('items');
const addForm = document.getElementById('addForm');

function getItems() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}
function setItems(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function render() {
  const items = getItems();
  itemsEl.innerHTML = '';
  items.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'shop-item' + (item.checked ? ' checked' : '');
    row.innerHTML = `
      <input type="checkbox" data-i="${i}" ${item.checked ? 'checked' : ''}>
      <span>${escapeHtml(item.name)}</span>
      <button data-remove="${i}">×</button>
    `;
    itemsEl.appendChild(row);
  });
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('itemName');
  const name = input.value.trim();
  if (!name) return;
  const items = getItems();
  items.push({ name, checked: false });
  setItems(items);
  fireEvent('shopping_item_added', { item_count: items.length });
  render();
  input.value = '';
});

itemsEl.addEventListener('change', (e) => {
  if (e.target.type !== 'checkbox') return;
  const items = getItems();
  const i = parseInt(e.target.dataset.i, 10);
  items[i].checked = e.target.checked;
  setItems(items);
  fireEvent('shopping_item_checked', { checked: e.target.checked });
  render();
});

itemsEl.addEventListener('click', (e) => {
  if (!e.target.hasAttribute('data-remove')) return;
  const items = getItems();
  items.splice(parseInt(e.target.dataset.remove, 10), 1);
  setItems(items);
  fireEvent('shopping_item_removed', { item_count: items.length });
  render();
});

document.getElementById('clearBtn').addEventListener('click', () => {
  const items = getItems().filter(i => !i.checked);
  const clearedCount = getItems().length - items.length;
  setItems(items);
  fireEvent('shopping_list_cleared', { cleared_count: clearedCount });
  render();
});

render();
