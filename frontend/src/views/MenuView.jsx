import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  Search,
  RefreshCw,
  Sliders,
  Utensils,
  FolderPlus,
  Layers
} from 'lucide-react';

export default function MenuView() {
  const { restaurant, addToast, role } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedItemForRecipe, setSelectedItemForRecipe] = useState(null);
  const [recipeData, setRecipeData] = useState(null);

  // Form States
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isVeg: true,
    isAvailable: true,
    preparationTime: 15,
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Recipe ingredients editor state
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  const currency = restaurant?.currency || '₹';

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, itmRes, invRes] = await Promise.all([
        posService.menu.getCategories(),
        posService.menu.getItems(),
        posService.inventory.getAll(),
      ]);
      if (catRes.success) setCategories(catRes.data || []);
      if (itmRes.success) setItems(itmRes.data || []);
      if (invRes.success) setInventoryItems(invRes.data || []);
    } catch (err) {
      addToast(err.message || 'Failed to load menu data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async (item) => {
    try {
      const nextState = !item.isAvailable;
      await posService.menu.toggleAvailability(item.id, nextState);
      addToast(`${item.name} is now ${nextState ? 'Available' : 'Marked 86 (Out of Stock)'}`, 'info');
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextState } : i)));
    } catch (err) {
      addToast(err.message || 'Failed to toggle availability', 'error');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await posService.menu.createCategory({
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
      });
      addToast('Category added successfully', 'success');
      setNewCatName('');
      setNewCatDesc('');
      setShowCatModal(false);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to create category', 'error');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"? Items inside will lose category link.`)) return;
    try {
      await posService.menu.deleteCategory(id);
      addToast('Category deleted', 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete category', 'error');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      addToast('Please fill in dish name, price and category', 'warning');
      return;
    }
    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || undefined,
        price: Number(itemForm.price),
        categoryId: itemForm.categoryId,
        isVeg: Boolean(itemForm.isVeg),
        isAvailable: Boolean(itemForm.isAvailable),
        preparationTime: Number(itemForm.preparationTime) || 15,
      };

      if (editingItem) {
        await posService.menu.updateItem(editingItem.id, payload);
        addToast(`${payload.name} updated successfully`, 'success');
      } else {
        await posService.menu.createItem(payload);
        addToast(`${payload.name} added to menu`, 'success');
      }
      setShowItemModal(false);
      setEditingItem(null);
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to save menu item', 'error');
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from menu?`)) return;
    try {
      await posService.menu.deleteItem(id);
      addToast(`${name} removed`, 'success');
      loadData();
    } catch (err) {
      addToast(err.message || 'Failed to delete dish', 'error');
    }
  };

  const openRecipeModal = async (item) => {
    setSelectedItemForRecipe(item);
    setShowRecipeModal(true);
    setRecipeData(null);
    try {
      const res = await posService.recipes.getByMenuItem(item.id);
      if (res.success && res.data) {
        setRecipeData(res.data);
        setRecipeIngredients(
          res.data.ingredients?.map((ing) => ({
            inventoryItemId: ing.inventoryItemId,
            quantityRequired: ing.quantityRequired,
            unit: ing.unit,
          })) || []
        );
      } else {
        setRecipeIngredients([]);
      }
    } catch (err) {
      setRecipeIngredients([]);
    }
  };

  const handleAddRecipeRow = () => {
    if (inventoryItems.length === 0) {
      addToast('No inventory ingredients found. Add inventory items first.', 'warning');
      return;
    }
    setRecipeIngredients([
      ...recipeIngredients,
      {
        inventoryItemId: inventoryItems[0].id,
        quantityRequired: 1,
        unit: inventoryItems[0].unit || 'kg',
      },
    ]);
  };

  const handleSaveRecipe = async () => {
    if (!selectedItemForRecipe) return;
    try {
      const payload = {
        menuItemId: selectedItemForRecipe.id,
        ingredients: recipeIngredients.map((r) => ({
          inventoryItemId: r.inventoryItemId,
          quantityRequired: Number(r.quantityRequired),
          unit: r.unit,
        })),
      };

      if (recipeData?.id) {
        await posService.recipes.update(recipeData.id, payload);
      } else {
        await posService.recipes.create(payload);
      }
      addToast('Recipe Bill of Materials saved!', 'success');
      setShowRecipeModal(false);
    } catch (err) {
      addToast(err.message || 'Failed to save recipe', 'error');
    }
  };

  const filteredItems = items.filter((itm) => {
    const matchCat = selectedCatId === 'ALL' || itm.categoryId === selectedCatId;
    const matchSearch = itm.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            <span>Menu & Recipe Engineering</span>
          </h1>
          <p className="text-sm text-slate-400">
            Configure dishes, categories, live availability switches, and automated inventory depletion recipes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCatModal(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setItemForm({
                name: '',
                description: '',
                price: '',
                categoryId: categories[0]?.id || '',
                isVeg: true,
                isAvailable: true,
                preparationTime: 15,
              });
              setShowItemModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex gap-2 overflow-x-auto max-w-3xl pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              selectedCatId === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <div key={c.id} className="flex items-center group">
              <button
                onClick={() => setSelectedCatId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  selectedCatId === c.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {c.name}
              </button>
              {role === 'RESTAURANT_OWNER' && (
                <button
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity ml-0.5"
                  title="Delete category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading menu records...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-2 text-slate-600" />
            <p className="text-white font-semibold">No dishes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Dish</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Dietary</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Prep Time</th>
                  <th className="px-5 py-3.5">86 Availability</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((itm) => {
                  const cat = categories.find((c) => c.id === itm.categoryId);
                  return (
                    <tr key={itm.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{itm.name}</div>
                        {itm.description && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs mt-0.5">
                            {itm.description}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-300">
                        {cat?.name || 'Unassigned'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            itm.isVeg
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {itm.isVeg ? 'Vegetarian' : 'Non-Veg'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-white text-sm">
                        {currency}{Number(itm.price).toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono">
                        {itm.preparationTime || 15} mins
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleAvailability(itm)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border transition-colors ${
                            itm.isAvailable
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                          }`}
                        >
                          {itm.isAvailable ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                              <span>In Stock</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 text-rose-400" />
                              <span>86 Out</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => openRecipeModal(itm)}
                          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-400 px-2.5 py-1.5 rounded-lg border border-slate-700 font-semibold"
                          title="Manage Recipe BOM"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Recipe</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(itm);
                            setItemForm({
                              name: itm.name,
                              description: itm.description || '',
                              price: itm.price,
                              categoryId: itm.categoryId,
                              isVeg: itm.isVeg,
                              isAvailable: itm.isAvailable,
                              preparationTime: itm.preparationTime || 15,
                            });
                            setShowItemModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(itm.id, itm.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">
              {editingItem ? 'Edit Dish' : 'Add New Menu Item'}
            </h3>
            <p className="text-xs text-slate-400 mb-5">Configure dish information, pricing, and category</p>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Mushroom Risotto"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Fresh arborio rice with wild forest mushrooms and aged parmesan"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dietary Preference</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, isVeg: true })}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        itemForm.isVeg
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Veg
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemForm({ ...itemForm, isVeg: false })}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        !itemForm.isVeg
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      Non-Veg
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  {editingItem ? 'Update Dish' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORY MODAL */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Menu Category</h3>
            <p className="text-xs text-slate-400 mb-5">Group items into logical sections (e.g. Starters, Main, Cocktails)</p>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Woodfired Pizzas"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Hand-stretched artisanal sourdough pizzas"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/40"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECIPE BOM DRAWER */}
      {showRecipeModal && selectedItemForRecipe && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <span>Recipe Bill of Materials (BOM)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Linked to <span className="font-bold text-white">{selectedItemForRecipe.name}</span>
                </p>
              </div>
              <button
                onClick={() => setShowRecipeModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed bg-amber-950/20 p-3 rounded-xl border border-amber-900/40">
                Whenever the kitchen completes an order containing this dish, these inventory raw materials will be automatically decremented from warehouse stocks.
              </p>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Ingredients Breakdown</span>
                <button
                  onClick={handleAddRecipeRow}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              {recipeIngredients.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No recipe ingredients configured yet. Click "Add Ingredient" to link raw materials.
                </div>
              ) : (
                <div className="space-y-3">
                  {recipeIngredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3"
                    >
                      <select
                        value={ing.inventoryItemId}
                        onChange={(e) => {
                          const item = inventoryItems.find((inv) => inv.id === e.target.value);
                          setRecipeIngredients((prev) =>
                            prev.map((r, i) =>
                              i === idx
                                ? { ...r, inventoryItemId: e.target.value, unit: item?.unit || r.unit }
                                : r
                            )
                          );
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {inventoryItems.map((inv) => (
                          <option key={inv.id} value={inv.id}>
                            {inv.name} (Stock: {inv.currentStock} {inv.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="Qty"
                        value={ing.quantityRequired}
                        onChange={(e) =>
                          setRecipeIngredients((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, quantityRequired: e.target.value } : r))
                          )
                        }
                        className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                      />

                      <span className="text-xs text-slate-400 font-mono w-12">{ing.unit || 'unit'}</span>

                      <button
                        onClick={() =>
                          setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowRecipeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={handleSaveRecipe}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md"
              >
                Save Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
