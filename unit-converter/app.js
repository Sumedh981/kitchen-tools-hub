const UNITS = {
  volume: {
    // all relative to 1 ml
    ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, cup: 236.588, fl_oz: 29.5735
  },
  weight: {
    // all relative to 1 g
    g: 1, kg: 1000, oz: 28.3495, lb: 453.592
  }
};

const categorySelect = document.getElementById('category');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const resultEl = document.getElementById('result');
const resultValueEl = document.getElementById('resultValue');

function populateUnits() {
  const cat = categorySelect.value;
  fromUnitSelect.innerHTML = '';
  toUnitSelect.innerHTML = '';
  resultEl.hidden = true;

  const options = cat === 'temperature' ? ['C', 'F', 'K'] : Object.keys(UNITS[cat]);
  options.forEach((u, i) => {
    [fromUnitSelect, toUnitSelect].forEach((sel, selIndex) => {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      if (selIndex === 1 && i === 1) opt.selected = true; // sensible default "to" unit
      sel.appendChild(opt);
    });
  });
}

categorySelect.addEventListener('change', () => {
  populateUnits();
  fireEvent('unit_category_changed', { category: categorySelect.value });
});
populateUnits();

function convertTemperature(value, from, to) {
  let celsius;
  if (from === 'C') celsius = value;
  else if (from === 'F') celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

document.getElementById('convertBtn').addEventListener('click', () => {
  const cat = categorySelect.value;
  const value = parseFloat(document.getElementById('value').value) || 0;
  const from = fromUnitSelect.value;
  const to = toUnitSelect.value;
  let output;

  if (cat === 'temperature') {
    output = convertTemperature(value, from, to);
  } else {
    const table = UNITS[cat];
    const baseValue = value * table[from];
    output = baseValue / table[to];
  }

  resultValueEl.textContent = `${value} ${from} = ${output.toFixed(2)} ${to}`;
  resultEl.hidden = false;

  fireEvent('unit_converted', { category: cat, from_unit: from, to_unit: to, input_value: value });
});
