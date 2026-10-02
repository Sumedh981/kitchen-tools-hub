let ingredients = [];
let hasStarted = false;

const lineItemsEl = document.getElementById('lineItems');
const addForm = document.getElementById('addForm');
const scaleBtn = document.getElementById('scaleBtn');
const scaledResultEl = document.getElementById('scaledResult');

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderList() {
  lineItemsEl.innerHTML = '';
  ingredients.forEach((ing, i) => {
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `
      <span>${escapeHtml(ing.name)}</span>
      <span class="list-item__leader"></span>
      <span>${ing.qty}${escapeHtml(ing.unit)}</span>
      <button class="list-item__remove" data-i="${i}">×</button>
    `;
    lineItemsEl.appendChild(row);
  });
  scaledResultEl.hidden = true;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('ingName').value.trim();
  const qty = parseFloat(document.getElementById('ingQty').value);
  const unit = document.getElementById('ingUnit').value.trim();
  if (!name || isNaN(qty) || !unit) return;

  ingredients.push({ name, qty, unit });
  if (!hasStarted) { hasStarted = true; fireEvent('recipe_calc_start'); }
  fireEvent('ingredient_added', { ingredient_count: ingredients.length });

  renderList();
  addForm.reset();
});

lineItemsEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('list-item__remove')) return;
  ingredients.splice(parseInt(e.target.dataset.i, 10), 1);
  renderList();
});

scaleBtn.addEventListener('click', () => {
  if (ingredients.length === 0) return;
  const base = Math.max(1, Number(document.getElementById('baseServings').value) || 1);
  const target = Math.max(1, Number(document.getElementById('targetServings').value) || 1);
  const ratio = target / base;

  scaledResultEl.innerHTML = ingredients.map(ing => `
    <div class="result__row"><span>${escapeHtml(ing.name)}</span><span>${(ing.qty * ratio).toFixed(2)}${escapeHtml(ing.unit)}</span></div>
  `).join('');
  scaledResultEl.hidden = false;

  fireEvent('recipe_scaled', {
    ingredient_count: ingredients.length,
    base_servings: base,
    target_servings: target,
    ratio: Number(ratio.toFixed(2))
  });
});

// ---------- Cooking time estimate ----------
// Rough minutes-per-kg + base minutes, illustrative only.
const COOK_RATES = {
  'roast-chicken': { perKg: 40, base: 20 },
  'roast-beef': { perKg: 25, base: 20 },
  'baked-potato': { perKg: 60, base: 10 },
  'whole-fish': { perKg: 20, base: 10 }
};

document.getElementById('timeBtn').addEventListener('click', () => {
  const type = document.getElementById('foodType').value;
  const weight = parseFloat(document.getElementById('weightKg').value) || 0;
  const rate = COOK_RATES[type];
  const minutes = Math.round(rate.base + rate.perKg * weight);
  document.getElementById('timeResult').textContent = `Approx. ${minutes} minutes`;
  fireEvent('cook_time_estimated', { food_type: type, weight_kg: weight, minutes });
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hasStarted && scaledResultEl.hidden) {
    fireEvent('recipe_calc_abandoned', { ingredient_count: ingredients.length });
  }
});
