// ============================================================
// storage.js — localStorage persistence only. No dependencies
// on other files. Everything stays on the visitor's device.
// ============================================================

const Storage = {
  KEY: 'savedRecipes',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) || '[]');
    } catch {
      return [];
    }
  },

  save(recipe) {
    const all = this.getAll();
    all.push({ ...recipe, savedAt: new Date().toISOString() });
    localStorage.setItem(this.KEY, JSON.stringify(all));
  },

  remove(index) {
    const all = this.getAll();
    all.splice(index, 1);
    localStorage.setItem(this.KEY, JSON.stringify(all));
  }
};
