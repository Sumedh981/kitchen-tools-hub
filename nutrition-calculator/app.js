let ingredients = [];
let hasStarted = false;
let hasCalculated = false;

const lineItemsEl = document.getElementById('lineItems');
const addForm = document.getElementById('addForm');
const resultEl = document.getElementById('result');

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
      <span>${ing.grams}g</span>
      <button class="list-item__remove" data-i="${i}">×</button>
    `;
    lineItemsEl.appendChild(row);
  });
  resultEl.hidden = true;
  hasCalculated = false;
}

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('ingName').value.trim();
  const grams = parseFloat(document.getElementById('ingGrams').value);
  const cal = parseFloat(document.getElementById('ingCal').value);
  const protein = parseFloat(document.getElementById('ingProtein').value);
  const carbs = parseFloat(document.getElementById('ingCarbs').value);
  const fat = parseFloat(document.getElementById('ingFat').value);
  if (!name || [grams, cal, protein, carbs, fat].some(isNaN)) return;

  ingredients.push({ name, grams, cal, protein, carbs, fat });
  if (!hasStarted) { hasStarted = true; fireEvent('nutrition_calc_start'); }
  fireEvent('ingredient_added', { ingredient_count: ingredients.length });

  renderList();
  addForm.reset();
});

lineItemsEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('list-item__remove')) return;
  ingredients.splice(parseInt(e.target.dataset.i, 10), 1);
  fireEvent('ingredient_removed', { ingredient_count: ingredients.length });
  renderList();
});

document.getElementById('calcBtn').addEventListener('click', () => {
  if (ingredients.length === 0) return;
  const servings = Math.max(1, Number(document.getElementById('servings').value) || 1);

  const totals = ingredients.reduce((acc, ing) => {
    const mult = ing.grams / 100;
    acc.cal += ing.cal * mult;
    acc.protein += ing.protein * mult;
    acc.carbs += ing.carbs * mult;
    acc.fat += ing.fat * mult;
    return acc;
  }, { cal: 0, protein: 0, carbs: 0, fat: 0 });

  document.getElementById('rCal').textContent = `${totals.cal.toFixed(0)} kcal`;
  document.getElementById('rProtein').textContent = `${totals.protein.toFixed(1)} g`;
  document.getElementById('rCarbs').textContent = `${totals.carbs.toFixed(1)} g`;
  document.getElementById('rFat').textContent = `${totals.fat.toFixed(1)} g`;
  document.getElementById('rCalServing').textContent = `${(totals.cal / servings).toFixed(0)} kcal`;
  resultEl.hidden = false;
  hasCalculated = true;

  fireEvent('nutrition_calculated', {
    ingredient_count: ingredients.length,
    servings,
    total_calories: Number(totals.cal.toFixed(0)),
    calories_per_serving: Number((totals.cal / servings).toFixed(0))
  });
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hasStarted && !hasCalculated) {
    fireEvent('nutrition_calc_abandoned', { ingredient_count: ingredients.length });
  }
});
