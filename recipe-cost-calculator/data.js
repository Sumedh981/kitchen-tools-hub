// ============================================================
// data.js — static content only. No dependencies on other files.
// Edit these arrays to change what shows up as sample recipes
// and ingredient autocomplete suggestions.
// ============================================================

const SAMPLE_RECIPES = [
  {
    name: 'Weeknight dal',
    category: 'Dinner',
    servings: 4,
    currency: '₹',
    budget: '',
    ingredients: [
      { name: 'Red lentils', qty: 250, unit: 'g', price: 0.12 },
      { name: 'Onion', qty: 1, unit: 'pc', price: 15 },
      { name: 'Tomato', qty: 2, unit: 'pc', price: 12 },
      { name: 'Cooking oil', qty: 30, unit: 'ml', price: 0.4 },
      { name: 'Spices', qty: 1, unit: 'tsp mix', price: 8 }
    ]
  },
  {
    name: 'Pancake stack',
    category: 'Breakfast',
    servings: 4,
    currency: '₹',
    budget: '',
    ingredients: [
      { name: 'Flour', qty: 200, unit: 'g', price: 0.08 },
      { name: 'Milk', qty: 300, unit: 'ml', price: 0.09 },
      { name: 'Egg', qty: 2, unit: 'pc', price: 8 },
      { name: 'Butter', qty: 20, unit: 'g', price: 0.6 },
      { name: 'Sugar', qty: 30, unit: 'g', price: 0.05 }
    ]
  },
  {
    name: 'Chocolate mug cake',
    category: 'Dessert',
    servings: 1,
    currency: '₹',
    budget: '',
    ingredients: [
      { name: 'Flour', qty: 40, unit: 'g', price: 0.08 },
      { name: 'Cocoa powder', qty: 10, unit: 'g', price: 0.5 },
      { name: 'Sugar', qty: 25, unit: 'g', price: 0.05 },
      { name: 'Milk', qty: 60, unit: 'ml', price: 0.09 },
      { name: 'Cooking oil', qty: 15, unit: 'ml', price: 0.4 }
    ]
  }
];

const INGREDIENT_PRESETS = [
  'Rice', 'Flour', 'Sugar', 'Salt', 'Cooking oil', 'Butter', 'Milk', 'Egg',
  'Onion', 'Tomato', 'Garlic', 'Ginger', 'Potato', 'Red lentils', 'Chicken',
  'Paneer', 'Cocoa powder', 'Spices', 'Yogurt', 'Bread'
];
