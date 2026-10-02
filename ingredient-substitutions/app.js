const searchInput = document.getElementById('search');
const resultsEl = document.getElementById('results');
let searchDebounce;

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function render(query) {
  resultsEl.innerHTML = '';
  if (!query.trim()) return;

  const matches = SUBSTITUTIONS.filter(item =>
    item.ingredient.toLowerCase().includes(query.toLowerCase())
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `<p style="font-size:0.85rem; color:var(--ink-soft); margin-top:16px;">No substitutes on file for "${escapeHtml(query)}" yet.</p>`;
    fireEvent('substitution_not_found', { query });
    return;
  }

  matches.forEach(item => {
    const block = document.createElement('div');
    block.style.marginTop = '18px';
    block.innerHTML = `
      <p style="font-family: var(--font-display); font-size:1rem; margin:0 0 6px;">${escapeHtml(item.ingredient)}</p>
      <ul style="margin:0; padding-left:18px; font-size:0.85rem; color:var(--ink-soft);">
        ${item.subs.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ul>
    `;
    resultsEl.appendChild(block);
  });

  fireEvent('substitution_found', { query, match_count: matches.length });
}

searchInput.addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  const query = e.target.value;
  searchDebounce = setTimeout(() => {
    render(query);
    if (query.trim()) fireEvent('substitution_searched', { query });
  }, 400);
});
