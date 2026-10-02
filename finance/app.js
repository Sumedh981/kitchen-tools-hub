// ============================================================
// finance/app.js — five independent sections on one page.
// localStorage keys: financeBudget, financeExpenses, financePrices
//
// Sections 2-5 are gated behind the mock Premium subscription
// (shared.js). Only the Grocery Budget Tracker (section 1) is
// free. Locking is applied once, on load — see applyGating().
// ============================================================

const FEATURE_LABELS = {
  meal_cost_comparator: 'Cook vs eat out comparator',
  price_tracker: 'Ingredient price tracker',
  batch_cost_planner: 'Batch-cost planner',
  household_split: 'Household budget split'
};

function applyGating() {
  document.querySelectorAll('.gated').forEach(section => {
    // Remove any existing overlay first (e.g. after subscribing)
    const existing = section.querySelector('.lock-overlay');
    if (existing) existing.remove();

    if (Subscription.isPremium()) return;

    const feature = section.dataset.feature;
    const overlay = document.createElement('div');
    overlay.className = 'lock-overlay';
    overlay.innerHTML = `
      <p class="lock-overlay__label">🔒 Premium feature</p>
      <p class="lock-overlay__desc">${FEATURE_LABELS[feature] || 'This tool'} is part of the Premium plan.</p>
      <button class="btn btn--primary unlock-btn">Unlock with Premium</button>
    `;
    overlay.querySelector('.unlock-btn').addEventListener('click', () => {
      showPaywall(feature, applyGating);
    });
    section.appendChild(overlay);
    fireEvent('paywall_viewed', { feature });
  });
}

applyGating();

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ---------- 1. Grocery Budget Tracker ----------

function getBudget() {
  try { return JSON.parse(localStorage.getItem('financeBudget') || 'null'); }
  catch { return null; }
}
function setBudget(b) { localStorage.setItem('financeBudget', JSON.stringify(b)); }

function getExpenses() {
  try { return JSON.parse(localStorage.getItem('financeExpenses') || '[]'); }
  catch { return []; }
}
function setExpenses(list) { localStorage.setItem('financeExpenses', JSON.stringify(list)); }

function renderBudgetStatus() {
  const budget = getBudget();
  const statusEl = document.getElementById('budgetStatus');
  const catEl = document.getElementById('categoryBreakdown');

  if (!budget) {
    statusEl.innerHTML = `<div class="result__row"><span>No budget set yet</span><span>—</span></div>`;
    catEl.innerHTML = '';
    return;
  }

  const expenses = getExpenses();
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget.amount - spent;

  statusEl.innerHTML = `
    <div class="result__row"><span>${budget.period} budget</span><span>₹${budget.amount.toFixed(2)}</span></div>
    <div class="result__row"><span>Spent so far</span><span>₹${spent.toFixed(2)}</span></div>
    <div class="result__row result__row--big"><span>Remaining</span><span>₹${remaining.toFixed(2)}</span></div>
  `;

  const byCategory = {};
  expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
  catEl.innerHTML = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `<div class="cat-row"><span>${escapeHtml(cat)}</span><span>₹${amt.toFixed(2)}</span></div>`)
    .join('');
}

document.getElementById('setBudgetBtn').addEventListener('click', () => {
  const period = document.getElementById('budgetPeriod').value;
  const amount = parseFloat(document.getElementById('budgetAmount').value);
  if (isNaN(amount) || amount <= 0) return;
  setBudget({ period, amount });
  fireEvent('budget_set', { period, amount });
  renderBudgetStatus();
});

document.getElementById('expenseForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const item = document.getElementById('expItem').value.trim();
  const amount = parseFloat(document.getElementById('expAmount').value);
  const category = document.getElementById('expCategory').value;
  if (!item || isNaN(amount)) return;

  const expenses = getExpenses();
  expenses.push({ item, amount, category, loggedAt: new Date().toISOString() });
  setExpenses(expenses);

  const budget = getBudget();
  const spent = expenses.reduce((sum, ex) => sum + ex.amount, 0);
  fireEvent('expense_logged', { amount, category, expense_count: expenses.length });

  if (budget && spent > budget.amount) {
    fireEvent('budget_exceeded', { period: budget.period, budget: budget.amount, spent: Number(spent.toFixed(2)) });
  }

  renderBudgetStatus();
  document.getElementById('expenseForm').reset();
});

renderBudgetStatus();

// ---------- 2. Meal Cost vs Eating Out ----------

document.getElementById('compareBtn').addEventListener('click', () => {
  const home = parseFloat(document.getElementById('homeCost').value) || 0;
  const out = parseFloat(document.getElementById('outCost').value) || 0;
  const times = parseFloat(document.getElementById('timesPerWeek').value) || 0;

  const weeklySavings = (out - home) * times;
  const monthlySavings = weeklySavings * 4.33;

  document.getElementById('compareResult').textContent =
    `Cooking at home saves ~₹${weeklySavings.toFixed(0)}/week (~₹${monthlySavings.toFixed(0)}/month) at ${times}x/week`;

  fireEvent('comparison_calculated', {
    home_cost: home, out_cost: out, times_per_week: times,
    weekly_savings: Number(weeklySavings.toFixed(0))
  });
});

// ---------- 3. Ingredient Price Tracker ----------

function getPrices() {
  try { return JSON.parse(localStorage.getItem('financePrices') || '{}'); }
  catch { return {}; }
}
function setPrices(p) { localStorage.setItem('financePrices', JSON.stringify(p)); }

function renderPriceHistory() {
  const prices = getPrices();
  const el = document.getElementById('priceHistory');
  el.innerHTML = '';

  Object.entries(prices).forEach(([name, entries]) => {
    const last = entries[entries.length - 1];
    const prev = entries[entries.length - 2];
    let trend = '';
    if (prev) {
      if (last.price > prev.price) trend = `<span class="price-row__trend trend-up">↑ up from ₹${prev.price.toFixed(2)}</span>`;
      else if (last.price < prev.price) trend = `<span class="price-row__trend trend-down">↓ down from ₹${prev.price.toFixed(2)}</span>`;
      else trend = `<span class="price-row__trend">no change</span>`;
    }
    const row = document.createElement('div');
    row.className = 'price-row';
    row.innerHTML = `<span>${escapeHtml(name)} — ₹${last.price.toFixed(2)}</span>${trend}`;
    el.appendChild(row);
  });
}

document.getElementById('priceForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('priceIngredient').value.trim();
  const price = parseFloat(document.getElementById('priceValue').value);
  if (!name || isNaN(price)) return;

  const prices = getPrices();
  if (!prices[name]) prices[name] = [];
  prices[name].push({ price, loggedAt: new Date().toISOString() });
  setPrices(prices);

  fireEvent('price_logged', { ingredient: name, price, entry_count: prices[name].length });

  renderPriceHistory();
  document.getElementById('priceForm').reset();
});

renderPriceHistory();
fireEvent('price_history_viewed', { tracked_ingredient_count: Object.keys(getPrices()).length });

// ---------- 4. Recipe Batch-Cost Planner ----------

document.getElementById('batchBtn').addEventListener('click', () => {
  const costPerBatch = parseFloat(document.getElementById('batchCost').value) || 0;
  const batches = parseFloat(document.getElementById('batchCount').value) || 1;
  const mealsPerBatch = parseFloat(document.getElementById('mealsPerBatch').value) || 1;

  const totalCost = costPerBatch * batches;
  const totalMeals = batches * mealsPerBatch;
  const costPerMeal = totalCost / totalMeals;

  document.getElementById('batchResult').textContent =
    `Total: ₹${totalCost.toFixed(2)} for ${totalMeals} meals → ₹${costPerMeal.toFixed(2)} per meal`;

  fireEvent('batch_cost_calculated', {
    cost_per_batch: costPerBatch, batch_count: batches,
    total_cost: Number(totalCost.toFixed(2)), cost_per_meal: Number(costPerMeal.toFixed(2))
  });
});

// ---------- 5. Household Budget Split ----------

document.getElementById('splitBtn').addEventListener('click', () => {
  const total = parseFloat(document.getElementById('householdBudget').value) || 0;
  const size = Math.max(1, parseFloat(document.getElementById('householdSize').value) || 1);
  const perPerson = total / size;
  const splits = { Breakfast: 0.25, Lunch: 0.35, Dinner: 0.40 };

  const resultEl = document.getElementById('splitResult');
  resultEl.innerHTML = `
    <div class="result__row result__row--big"><span>Per person</span><span>₹${perPerson.toFixed(2)}</span></div>
    ${Object.entries(splits).map(([meal, pct]) =>
      `<div class="result__row"><span>${meal} (${(pct * 100).toFixed(0)}%)</span><span>₹${(total * pct).toFixed(2)}</span></div>`
    ).join('')}
  `;
  resultEl.hidden = false;

  fireEvent('budget_split_calculated', { total_budget: total, household_size: size, per_person: Number(perPerson.toFixed(2)) });
});
