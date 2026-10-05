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
import { INVENTORY_UNITS } from '../constants/inventory.constants';

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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#92400E]" />
            <span>Recipe Management</span>
          </h1>
          <p className="text-sm text-[#5B6470]">
            Define ingredient Bill of Materials (BOM) for menu items for automated kitchen stock consumption
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 bg-white hover:bg-[#F1E8DB] text-[#1F2937] rounded-xl border border-[#E5D8C6] shadow-sandstone transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#92400E]' : 'text-[#5B6470]'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#E5D8C6] rounded-2xl p-4 shadow-sandstone flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5B6470]" />
          <input
            type="text"
            placeholder="Search dish by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-4 py-2 text-xs text-[#1F2937] placeholder-[#5B6470] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E]"
          />
        </div>
        <div className="text-xs text-[#5B6470] font-mono">
          Showing {filteredMenuItems.length} dishes
        </div>
      </div>

      {/* Menu Dishes & Recipes Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#92400E] animate-spin" />
          <span className="text-sm text-[#5B6470]">Loading dishes and recipes...</span>
        </div>
      ) : filteredMenuItems.length === 0 ? (
        <div className="bg-white border border-[#E5D8C6] rounded-2xl p-16 text-center shadow-sandstone">
          <BookOpen className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#1F2937]">No Menu Items Found</h3>
          <p className="text-sm text-[#5B6470] mt-1">Add menu items via the restaurant menu catalogue first.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenuItems.map((item) => {
            const recipe = recipeMap.get(item.id);
            const hasRecipe = recipe && recipe.ingredients && recipe.ingredients.length > 0;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E5D8C6] rounded-2xl p-5 flex flex-col justify-between shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-base font-bold text-[#1F2937]">{item.name}</h3>
                      <div className="text-[11px] text-[#5B6470]">
                        {item.category?.name || 'Main Course'} • ₹{Number(item.price).toFixed(2)}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${
                        hasRecipe
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      {hasRecipe ? 'Recipe Active' : 'No Recipe'}
                    </span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-[#5B6470] line-clamp-2 mt-1 mb-3">
                      {item.description}
                    </p>
                  )}

                  {/* Ingredients Preview */}
                  <div className="border-t border-[#E5D8C6] pt-3 mt-3">
                    <div className="text-[10px] uppercase font-bold text-[#5B6470] mb-2 flex items-center justify-between">
                      <span>Ingredients (Per Portion)</span>
                      {recipe?.prepTime && (
                        <span className="font-mono text-[#5B6470] flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3 text-[#92400E]" /> {recipe.prepTime}m
                        </span>
                      )}
                    </div>

                    {hasRecipe ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {recipe.ingredients.map((ing, iIdx) => (
                          <div
                            key={iIdx}
                            className="flex items-center justify-between text-xs bg-[#FAF7F2] px-2.5 py-1.5 rounded-lg border border-[#E5D8C6]"
                          >
                            <span className="text-[#1F2937] font-medium truncate max-w-[150px]">
                              {ing.inventoryItem?.name || 'Item'}
                            </span>
                            <span className="font-mono text-xs text-[#92400E] font-bold">
                              {Number(ing.quantityRequired)} {ing.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3 text-center">
                        <p className="text-xs font-semibold text-amber-900">No ingredients defined.</p>
                        <p className="text-[10px] text-[#5B6470] mt-0.5">
                          Orders of this dish will require a recipe before preparation completes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5D8C6] mt-4">
                  <button
                    onClick={() => openRecipeEditor(item)}
                    className="w-full flex items-center justify-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sandstone hover:shadow-sandstone-md cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5D8C6] rounded-2xl w-full max-w-2xl p-6 shadow-sandstone-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#E5D8C6] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#92400E]" />
                  <span>Recipe for {selectedMenuItem.name}</span>
                </h3>
                <p className="text-xs text-[#5B6470] mt-1">
                  Specify ingredient quantities required per 1 unit of this dish.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#5B6470] hover:text-[#1F2937] p-1.5 rounded-lg hover:bg-[#F1E8DB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              {/* Preparation Time & Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={recipeForm.prepTime}
                    onChange={(e) => setRecipeForm({ ...recipeForm, prepTime: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E] font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-[#1F2937] mb-1">
                    Kitchen Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cook in tandoor until crisp..."
                    value={recipeForm.instructions}
                    onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                    className="w-full bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl px-3 py-2 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E]"
                  />
                </div>
              </div>

              {/* Ingredient List Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#1F2937] uppercase tracking-wider">
                    Ingredients (Per Portion)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-semibold text-[#92400E] hover:text-[#78350F] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                {recipeForm.ingredients.length === 0 ? (
                  <div className="bg-[#FAF7F2] border border-dashed border-[#E5D8C6] rounded-xl p-6 text-center">
                    <p className="text-xs text-[#5B6470]">No ingredients added yet.</p>
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      className="mt-2 text-xs font-bold text-[#92400E] hover:underline cursor-pointer"
                    >
                      + Add First Ingredient
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E5D8C6]"
                      >
                        {/* Ingredient Select */}
                        <div className="flex-1">
                          <select
                            value={ing.inventoryItemId}
                            onChange={(e) => handleIngredientChange(idx, 'inventoryItemId', e.target.value)}
                            className="w-full bg-white border border-[#E5D8C6] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E]"
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
                            className="w-full bg-white border border-[#E5D8C6] rounded-lg px-2.5 py-1.5 text-xs text-[#1F2937] font-mono focus:outline-none focus:border-[#92400E] text-right"
                          />
                        </div>

                        {/* Unit Select */}
                        <div className="w-24">
                          <select
                            value={ing.unit}
                            onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            className="w-full bg-white border border-[#E5D8C6] rounded-lg px-2 py-1.5 text-xs text-[#1F2937] focus:outline-none focus:border-[#92400E]"
                          >
                            {INVENTORY_UNITS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredientRow(idx)}
                          className="p-1.5 text-[#5B6470] hover:text-[#EF4444] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E5D8C6]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#5B6470] hover:text-[#1F2937] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#92400E] hover:bg-[#78350F] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sandstone hover:shadow-sandstone-md cursor-pointer disabled:opacity-50"
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
