import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Save,
  X,
  Boxes
} from 'lucide-react';

export default function KitchenRecipesView() {
  const { addToast } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Recipe Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    instructions: '',
    prepTime: 10,
    ingredients: [],
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, invRes, recRes] = await Promise.all([
        posService.menu.getItems(),
        posService.kitchen.getInventory(),
        posService.recipes.getAll(),
      ]);

      if (itemsRes.success) {
        const list = Array.isArray(itemsRes.data) ? itemsRes.data : itemsRes.data.items || [];
        setMenuItems(list);
      }
      if (invRes.success) {
        setInventoryItems(invRes.data || []);
      }
      if (recRes.success) {
        const rList = Array.isArray(recRes.data) ? recRes.data : recRes.data.items || [];
        setRecipes(rList);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load recipe data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRecipeEditor = async (menuItem) => {
    setSelectedMenuItem(menuItem);
    setShowModal(true);

    try {
      const res = await posService.recipes.getByMenuItem(menuItem.id);
      if (res.success && res.data) {
        const r = res.data;
        setRecipeForm({
          instructions: r.instructions || '',
          prepTime: r.prepTime || 10,
          ingredients: r.ingredients?.map((ing) => ({
            inventoryItemId: ing.inventoryItemId,
            quantityRequired: Number(ing.quantityRequired),
            unit: ing.unit,
          })) || [],
        });
      } else {
        setRecipeForm({ instructions: '', prepTime: 10, ingredients: [] });
      }
    } catch (e) {
      setRecipeForm({ instructions: '', prepTime: 10, ingredients: [] });
    }
  };

  const handleAddIngredientRow = () => {
    if (inventoryItems.length === 0) {
      addToast('No inventory ingredients available. Please ensure ingredients exist.', 'warning');
      return;
    }
    const defaultItem = inventoryItems[0];
    setRecipeForm({
      ...recipeForm,
      ingredients: [
        ...recipeForm.ingredients,
        {
          inventoryItemId: defaultItem.id,
          quantityRequired: 0.1,
          unit: defaultItem.unit,
        },
      ],
    });
  };

  const handleIngredientChange = (index, field, value) => {
    const updated = [...recipeForm.ingredients];
    if (field === 'inventoryItemId') {
      const matched = inventoryItems.find((inv) => inv.id === value);
      updated[index] = {
        ...updated[index],
        inventoryItemId: value,
        unit: matched ? matched.unit : updated[index].unit,
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
    }
    setRecipeForm({ ...recipeForm, ingredients: updated });
  };

  const handleRemoveIngredientRow = (index) => {
    const updated = recipeForm.ingredients.filter((_, idx) => idx !== index);
    setRecipeForm({ ...recipeForm, ingredients: updated });
  };

  const handleSaveRecipe = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem) return;

    if (recipeForm.ingredients.length === 0) {
      addToast('Please add at least one ingredient to the recipe', 'warning');
      return;
    }

    // Check for duplicates
    const invIds = recipeForm.ingredients.map((i) => i.inventoryItemId);
    if (new Set(invIds).size !== invIds.length) {
      addToast('Duplicate ingredients found. Please combine quantities into one row.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        menuItemId: selectedMenuItem.id,
        instructions: recipeForm.instructions.trim() || undefined,
        prepTime: Number(recipeForm.prepTime) || 10,
        ingredients: recipeForm.ingredients.map((ing) => ({
          inventoryItemId: ing.inventoryItemId,
          quantityRequired: Number(ing.quantityRequired),
          unit: ing.unit,
        })),
      };

      await posService.recipes.create(payload);
      addToast(`Recipe for '${selectedMenuItem.name}' saved successfully!`, 'success');
      setShowModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save recipe', 'error');
    } finally {
      setSaving(false);
    }
  };

  const recipeMap = new Map(recipes.map((r) => [r.menuItemId, r]));

  const filteredMenuItems = menuItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.category?.name && item.category.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-amber-400" />
            <span>Recipe Management</span>
          </h1>
          <p className="text-sm text-slate-400">
            Define ingredient Bill of Materials (BOM) for menu items for automated kitchen stock consumption
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search dish by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {filteredMenuItems.length} dishes
        </div>
      </div>

      {/* Menu Dishes & Recipes Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading dishes and recipes...</span>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-16 text-center">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Menu Items Found</h3>
          <p className="text-sm text-slate-400 mt-1">Add menu items via the restaurant menu catalogue first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => {
            const recipe = recipeMap.get(item.id);
            const hasRecipe = recipe && recipe.ingredients && recipe.ingredients.length > 0;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold text-white">{item.name}</h3>
                      <div className="text-[11px] text-slate-400">
                        {item.category?.name || 'Main Course'} • ₹{Number(item.price).toFixed(2)}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        hasRecipe
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/80 border-rose-800 text-rose-300'
                      }`}
                    >
                      {hasRecipe ? 'Recipe Active' : 'No Recipe'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Ingredients Preview */}
                  <div className="border-t border-slate-800/80 pt-3 mt-3">
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2 flex items-center justify-between">
                      <span>Ingredients (Per Portion)</span>
                      {recipe?.prepTime && (
                        <span className="font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" /> {recipe.prepTime}m
                        </span>
                      )}
                    </div>

                    {hasRecipe ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {recipe.ingredients.map((ing, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between text-xs bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800/60"
                          >
                            <span className="text-slate-300 truncate max-w-[150px]">
                              {ing.inventoryItem?.name || 'Item'}
                            </span>
                            <span className="font-mono text-xs text-amber-400">
                              {Number(ing.quantityRequired)} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 text-center">
                        <p className="text-xs text-rose-300">No ingredients defined.</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Orders of this dish will require a recipe before preparation completes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4">
                  <button
                    onClick={() => openRecipeEditor(item)}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/30 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{hasRecipe ? 'Edit Recipe (BOM)' : 'Configure Recipe'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Editor Modal */}
      {showModal && selectedMenuItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  <span>Recipe for {selectedMenuItem.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Specify ingredient quantities required per 1 unit of this dish.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              {/* Preparation Time & Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={recipeForm.prepTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kitchen Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cook in tandoor until crisp..."
                    value={recipeForm.instructions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Ingredient List Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Ingredients (Per Portion)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {recipeForm.ingredients.length === 0 ? (
                  <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-6 text-center">
                    <p className="text-xs text-slate-400">No ingredients added yet.</p>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="mt-2 text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      + Add First Ingredient
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800"
                      >
                        {/* Ingredient Select */}
                        <div className="flex-1">
                          <select
                            value={ing.inventoryItemId}
                            onChange={(e) => handleIngredientChange(idx, 'inventoryItemId', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} (Stock: {Number(inv.currentStock)} {inv.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="w-24">
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            required
                            placeholder="Qty"
                            value={ing.quantityRequired}
                            onChange={(e) => handleIngredientChange(idx, 'quantityRequired', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 text-right"
                          />
                        </div>

                        {/* Unit Select */}
                        <div className="w-24">
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                          >
                            <option value="KG">KG</option>
                            <option value="GRAM">GRAM</option>
                            <option value="LITER">LITER</option>
                            <option value="MILLILITER">MILLILITER</option>
                            <option value="PIECE">PIECE</option>
                            <option value="PACKET">PACKET</option>
                            <option value="CAN">CAN</option>
                            <option value="BOTTLE">BOTTLE</option>
                          </select>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving Recipe...' : 'Save Recipe'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
