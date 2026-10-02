// ---------- Pan size scaling ----------
document.getElementById('panBtn').addEventListener('click', () => {
  const from = parseFloat(document.getElementById('panFrom').value) || 1;
  const to = parseFloat(document.getElementById('panTo').value) || 1;
  const ratio = (to * to) / (from * from); // area scales with radius^2, diameter ratio squared works the same way
  document.getElementById('panResult').textContent =
    `Multiply every ingredient by ${ratio.toFixed(2)}× (area-based scaling for round pans)`;
  fireEvent('pan_size_scaled', { from_cm: from, to_cm: to, ratio: Number(ratio.toFixed(2)) });
});

// ---------- Temperature ----------
document.getElementById('tempBtn').addEventListener('click', () => {
  const value = parseFloat(document.getElementById('tempValue').value) || 0;
  const unit = document.getElementById('tempUnit').value;
  const adjust = document.getElementById('ovenType').value;

  let celsius = unit === 'F' ? (value - 32) * 5 / 9 : value;
  if (adjust === 'fan') celsius -= 20;
  if (adjust === 'conventional') celsius += 20;
  const fahrenheit = celsius * 9 / 5 + 32;

  document.getElementById('tempResult').textContent =
    `${celsius.toFixed(0)}°C / ${fahrenheit.toFixed(0)}°F`;
  fireEvent('temperature_converted', { input_value: value, input_unit: unit, adjustment: adjust });
});

// ---------- Baker's percentage ----------
let bakerIngredients = [];
let bakerStarted = false;

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderBakerList() {
  const el = document.getElementById('bakerList');
  el.innerHTML = '';
  bakerIngredients.forEach((ing, i) => {
    const row = document.createElement('div');
    row.className = 'list-item';
    row.innerHTML = `
      <span>${escapeHtml(ing.name)}</span>
      <span class="list-item__leader"></span>
      <span>${ing.grams}g</span>
      <button class="list-item__remove" data-i="${i}">×</button>
    `;
    el.appendChild(row);
  });
  document.getElementById('bakerResult').hidden = true;
}

document.getElementById('bakerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('bakerName').value.trim();
  const grams = parseFloat(document.getElementById('bakerGrams').value);
  if (!name || isNaN(grams)) return;
  bakerIngredients.push({ name, grams });
  if (!bakerStarted) { bakerStarted = true; fireEvent('bakers_percentage_start'); }
  renderBakerList();
  document.getElementById('bakerForm').reset();
});

document.getElementById('bakerList').addEventListener('click', (e) => {
  if (!e.target.classList.contains('list-item__remove')) return;
  bakerIngredients.splice(parseInt(e.target.dataset.i, 10), 1);
  renderBakerList();
});

document.getElementById('bakerBtn').addEventListener('click', () => {
  const flour = parseFloat(document.getElementById('flourWeight').value) || 1;
  const resultEl = document.getElementById('bakerResult');
  const rows = [`<div class="result__row"><span>Flour</span><span>100%</span></div>`]
    .concat(bakerIngredients.map(ing => {
      const pct = (ing.grams / flour) * 100;
      return `<div class="result__row"><span>${escapeHtml(ing.name)}</span><span>${pct.toFixed(1)}%</span></div>`;
    }));
  resultEl.innerHTML = rows.join('');
  resultEl.hidden = false;

  fireEvent('bakers_percentage_calculated', {
    flour_grams: flour,
    ingredient_count: bakerIngredients.length
  });
});
