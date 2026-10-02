// ============================================================
// chart.js — renders a cost-breakdown bar chart as plain divs.
// No canvas/SVG library needed, so it never breaks on GitHub
// Pages. Takes ingredients + a target DOM element, nothing else.
// ============================================================

const Chart = {
  render(ingredients, containerEl, currencySymbol) {
    containerEl.innerHTML = '';
    if (ingredients.length === 0) return;

    const costs = ingredients.map(ing => ({
      name: ing.name,
      cost: Calculator.lineCost(ing)
    }));
    const maxCost = Math.max(...costs.map(c => c.cost), 0.01);

    costs
      .sort((a, b) => b.cost - a.cost)
      .forEach(item => {
        const pct = Math.max(4, (item.cost / maxCost) * 100);
        const row = document.createElement('div');
        row.className = 'chart-bar-row';
        row.innerHTML = `
          <span class="chart-bar-row__label">${escapeHtmlChart(item.name)}</span>
          <div class="chart-bar-row__track">
            <div class="chart-bar-row__fill" style="width:${pct}%"></div>
          </div>
          <span class="chart-bar-row__value">${currencySymbol}${item.cost.toFixed(2)}</span>
        `;
        containerEl.appendChild(row);
      });
  }
};

function escapeHtmlChart(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
