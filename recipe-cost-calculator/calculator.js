// ============================================================
// calculator.js — pure cost math only. No dependencies on other
// files. fireEvent() now lives in ../shared.js since every tool
// in the hub uses it.
// ============================================================

const Calculator = {
  lineCost(ingredient) {
    return ingredient.qty * ingredient.price;
  },

  subtotal(ingredients) {
    return ingredients.reduce((sum, ing) => sum + this.lineCost(ing), 0);
  },

  perServing(subtotal, servings) {
    const safeServings = Math.max(1, Number(servings) || 1);
    return subtotal / safeServings;
  }
};
