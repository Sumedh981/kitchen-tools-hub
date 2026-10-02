// ============================================================
// app.js — the only file that reaches into the others. Owns the
// page state, wires up every button/input, and calls into
// Calculator, Storage, and Chart as needed.
//
// GA4 EVENTS FIRED FROM THIS FILE (see README.md for the full
// funnel plan):
//   recipe_start            sample_recipe_loaded
//   ingredient_added         ingredient_removed
//   servings_adjusted        category_changed
//   calculation_completed    budget_exceeded
//   chart_viewed             recipe_saved
//   recipe_shared            recipe_exported
//   recipe_abandoned
// ============================================================

let ingredients = [];
let hasStartedRecipe = false;
let hasCalculated = false;

const el = (id) => document.getElementById(id);

const lineItemsEl = el('lineItems');
const addForm = el('addForm');
const calcBtn = el('calcBtn');
const totalsEl = el('totals');
const actionsEl = el('actions');
const servingsInput = el('servings');
const currencySelect = el('currency');
const categorySelect = el('category');
const budgetInput = el('budget');
const budgetFlagEl = el('budgetFlag');
const chartSectionEl = el('chartSection');
const chartBarsEl = el('chartBars');
const saveBtn = el('saveBtn');
const shareBtn = el('shareBtn');
const printBtn = el('printBtn');
const savedSection = el('savedSection');
const savedList = el('savedList');
const savedFilter = el('savedFilter');
const recipeNameInput = el('recipeName');
const sampleButtonsEl = el('sampleButtons');
const ingredientPresetsEl = el('ingredientPresets');

// ---------- Setup ----------

function init() {
  INGREDIENT_PRESETS.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    ingredientPresetsEl.appendChild(opt);
  });

  SAMPLE_RECIPES.forEach((recipe, i) => {
    const btn = document.createElement('button');
    btn.className = 'samples__btn';
    btn.textContent = recipe.name;
    btn.addEventListener('click', () => loadSample(i));
    sampleButtonsEl.appendChild(btn);
  });

  renderSavedList();
}

// ---------- Rendering ----------

function renderLineItems() {
  lineItemsEl.innerHTML = '';
  ingredients.forEach((ing, i) => {
    const lineCost = Calculator.lineCost(ing);
    const row = document.createElement('div');
    row.className = 'line-item';
    row.innerHTML = `
      <span class="line-item__name">${escapeHtml(ing.name)}</span>
      <span class="line-item__qty">${ing.qty}${escapeHtml(ing.unit)}</span>
      <span class="line-item__leader"></span>
      <span class="line-item__price">${currencySelect.value}${lineCost.toFixed(2)}</span>
      <button class="line-item__remove" data-index="${i}" aria-label="Remove ${escapeHtml(ing.name)}">×</button>
    `;
    lineItemsEl.appendChild(row);
  });

  totalsEl.hidden = true;
  actionsEl.hidden = true;
  chartSectionEl.hidden = true;
  budgetFlagEl.hidden = true;
  hasCalculated = false;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Ingredient add / remove ----------

addForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = el('ingName').value.trim();
  const qty = parseFloat(el('ingQty').value);
  const unit = el('ingUnit').value.trim();
  const price = parseFloat(el('ingPrice').value);
  if (!name || isNaN(qty) || !unit || isNaN(price)) return;

  ingredients.push({ name, qty, unit, price });

  if (!hasStartedRecipe) {
    hasStartedRecipe = true;
    fireEvent('recipe_start', { category: categorySelect.value });
  }
  fireEvent('ingredient_added', { ingredient_count: ingredients.length });

  renderLineItems();
  addForm.reset();
  el('ingName').focus();
});

lineItemsEl.addEventListener('click', (e) => {
  if (!e.target.classList.contains('line-item__remove')) return;
  const index = parseInt(e.target.dataset.index, 10);
  ingredients.splice(index, 1);
  fireEvent('ingredient_removed', { ingredient_count: ingredients.length });
  renderLineItems();
});

// ---------- Field changes ----------

servingsInput.addEventListener('change', () => {
  fireEvent('servings_adjusted', { servings: Number(servingsInput.value) });
  if (hasCalculated) calculate();
});

categorySelect.addEventListener('change', () => {
  fireEvent('category_changed', { category: categorySelect.value });
});

// ---------- Calculate ----------

calcBtn.addEventListener('click', () => {
  if (ingredients.length === 0) return;
  calculate();
});

function calculate() {
  const subtotal = Calculator.subtotal(ingredients);
  const servings = Math.max(1, Number(servingsInput.value) || 1);
  const perServing = Calculator.perServing(subtotal, servings);
  const symbol = currencySelect.value;

  el('totalSubtotal').textContent = `${symbol}${subtotal.toFixed(2)}`;
  el('totalPerServing').textContent = `${symbol}${perServing.toFixed(2)}`;
  totalsEl.hidden = false;
  actionsEl.hidden = false;
  hasCalculated = true;

  fireEvent('calculation_completed', {
    ingredient_count: ingredients.length,
    category: categorySelect.value,
    servings,
    subtotal: Number(subtotal.toFixed(2)),
    cost_per_serving: Number(perServing.toFixed(2)),
    currency: symbol
  });

  // Budget check
  const budget = parseFloat(budgetInput.value);
  if (!isNaN(budget) && budget > 0) {
    if (subtotal > budget) {
      budgetFlagEl.hidden = false;
      budgetFlagEl.textContent = `Over budget by ${symbol}${(subtotal - budget).toFixed(2)}`;
      fireEvent('budget_exceeded', {
        budget,
        subtotal: Number(subtotal.toFixed(2)),
        over_by: Number((subtotal - budget).toFixed(2))
      });
    } else {
      budgetFlagEl.hidden = true;
    }
  }

  // Chart
  Chart.render(ingredients, chartBarsEl, symbol);
  chartSectionEl.hidden = false;
  fireEvent('chart_viewed', { ingredient_count: ingredients.length });
}

// ---------- Save / share / export ----------

const FREE_SAVE_LIMIT = 3;

saveBtn.addEventListener('click', () => {
  if (Storage.getAll().length >= FREE_SAVE_LIMIT && !Subscription.isPremium()) {
    showPaywall('unlimited_recipe_saves', () => saveBtn.click());
    return;
  }
  const recipe = {
    name: recipeNameInput.value.trim() || 'Untitled recipe',
    category: categorySelect.value,
    servings: Number(servingsInput.value),
    currency: currencySelect.value,
    budget: budgetInput.value,
    ingredients
  };
  Storage.save(recipe);
  fireEvent('recipe_saved', {
    ingredient_count: ingredients.length,
    category: recipe.category
  });
  renderSavedList();
});

shareBtn.addEventListener('click', async () => {
  const symbol = currencySelect.value;
  const subtotal = Calculator.subtotal(ingredients);
  const perServing = Calculator.perServing(subtotal, servingsInput.value);
  const text = `${recipeNameInput.value || 'My recipe'} — ${symbol}${perServing.toFixed(2)} per serving`;

  fireEvent('recipe_shared', { category: categorySelect.value });

  if (navigator.share) {
    try { await navigator.share({ text }); } catch { /* user cancelled */ }
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  }
});

printBtn.addEventListener('click', () => {
  fireEvent('recipe_exported');
  window.print();
});

// ---------- Saved list ----------

function renderSavedList() {
  const all = Storage.getAll();
  const filter = savedFilter.value;
  const filtered = filter === 'all' ? all : all.filter(r => r.category === filter);

  savedSection.hidden = all.length === 0;
  savedList.innerHTML = '';

  const limitNoteId = 'saveLimitNote';
  let note = document.getElementById(limitNoteId);
  if (!Subscription.isPremium()) {
    if (!note) {
      note = document.createElement('p');
      note.id = limitNoteId;
      note.style.cssText = 'font-size:0.75rem; color:var(--ink-soft); margin:0 0 10px;';
      savedSection.insertBefore(note, savedSection.firstChild.nextSibling);
    }
    note.textContent = `${all.length}/${FREE_SAVE_LIMIT} free saves used`;
    note.hidden = false;
  } else if (note) {
    note.hidden = true;
  }

  filtered.forEach((r) => {
    const originalIndex = all.indexOf(r);
    const subtotal = Calculator.subtotal(r.ingredients);
    const perServing = Calculator.perServing(subtotal, r.servings);
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${escapeHtml(r.name)} <em>(${escapeHtml(r.category)})</em> — ${r.currency}${perServing.toFixed(2)}/serving</span>
      <button data-index="${originalIndex}">load</button>
    `;
    savedList.appendChild(li);
  });
}

savedFilter.addEventListener('change', renderSavedList);

savedList.addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  const index = parseInt(e.target.dataset.index, 10);
  const r = Storage.getAll()[index];
  if (!r) return;
  applyRecipe(r);
});

// ---------- Sample recipes ----------

function loadSample(i) {
  const recipe = SAMPLE_RECIPES[i];
  applyRecipe(recipe);
  fireEvent('sample_recipe_loaded', { recipe_name: recipe.name, category: recipe.category });
  calculate();
}

function applyRecipe(r) {
  recipeNameInput.value = r.name;
  categorySelect.value = r.category;
  servingsInput.value = r.servings;
  currencySelect.value = r.currency;
  budgetInput.value = r.budget || '';
  ingredients = r.ingredients.map(ing => ({ ...ing }));
  hasStartedRecipe = true;
  renderLineItems();
}

// ---------- Abandonment tracking ----------

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && hasStartedRecipe && !hasCalculated) {
    fireEvent('recipe_abandoned', { ingredient_count: ingredients.length });
  }
});

init();
