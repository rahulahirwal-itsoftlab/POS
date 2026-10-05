import React, { useState, useEffect } from 'react';
import posService from '../services/pos.service';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function WaiterMenuView() {
  const { restaurant, addToast } = useAuth();
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadMenu = async () => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        posService.menu.getCategories(),
        posService.menu.getItems(),
      ]);
      if (catsRes.success && catsRes.data) setCategories(catsRes.data);
      if (itemsRes.success && itemsRes.data) setMenuItems(itemsRes.data);
    } catch (err) {
      addToast(err.message || 'Failed to load restaurant menu', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const currency = restaurant?.currency || '₹';

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'ALL' || item.categoryId === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5D8C6] shadow-sandstone">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl text-[#92400E]">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1F2937] flex items-center gap-2">
                Restaurant Menu Catalog
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#5B6470] border border-[#E5D8C6] font-medium">
                  Read Only
                </span>
              </h1>
              <p className="text-xs text-[#5B6470]">
                Browse official dish prices, categories, and kitchen availability
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5B6470] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E5D8C6] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1F2937] placeholder-[#5B6470] focus:outline-none focus:border-[#92400E] focus:ring-1 focus:ring-[#92400E] w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${selectedCategory === 'ALL'
              ? 'bg-[#92400E] text-white shadow-sandstone font-bold'
              : 'bg-white text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6] shadow-sandstone'
            }`}
        >
          All Items ({menuItems.length})
        </button>
        {categories.map((cat) => {
          const count = menuItems.filter((i) => i.categoryId === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${selectedCategory === cat.id
                  ? 'bg-[#92400E] text-white shadow-sandstone font-bold'
                  : 'bg-white text-[#5B6470] hover:text-[#1F2937] hover:bg-[#F1E8DB] border border-[#E5D8C6] shadow-sandstone'
                }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center text-[#5B6470] text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-[#92400E] mr-2" />
          Loading menu catalog...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#E5D8C6] text-[#9CA3AF] text-sm shadow-sandstone">
          No menu items found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isAvail = item.isAvailable;
            const categoryName = categories.find((c) => c.id === item.categoryId)?.name || 'General';

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E5D8C6] hover:border-[#92400E] rounded-2xl p-5 shadow-sandstone hover:shadow-sandstone-md hover:-translate-y-0.5 flex flex-col justify-between transition group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#92400E] px-2.5 py-0.5 bg-[#FAF7F2] border border-[#E5D8C6] rounded-lg">
                      {categoryName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${isAvail
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                    >
                      {isAvail ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isAvail ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <h3 className="font-bold text-[#1F2937] text-sm group-hover:text-[#92400E] transition">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-[#5B6470] mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5D8C6] mt-4 flex items-center justify-between">
                  <span className="text-base font-extrabold text-[#92400E] font-mono">
                    {currency}
                    {Number(item.price).toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#5B6470] font-medium">Official Price</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
