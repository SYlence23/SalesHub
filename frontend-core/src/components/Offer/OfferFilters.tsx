import { useState } from 'react';
import { Search, X } from 'lucide-react';

export interface Category {
  id: number;
  name: string;
}

interface OfferFiltersProps {
  categories: Category[];
  searchTerm: string;
  selectedCategory: number | null;
  sortOption: string;
  onApplyFilters: (filters: { searchTerm: string; selectedCategory: number | null; sortOption: string }) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function OfferFilters({
  categories,
  searchTerm,
  selectedCategory,
  sortOption,
  onApplyFilters,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer
}: OfferFiltersProps) {

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localSelectedCategory, setLocalSelectedCategory] = useState<number | null>(selectedCategory);
  const [localSortOption, setLocalSortOption] = useState(sortOption);

  const [prevProps, setPrevProps] = useState({ searchTerm, selectedCategory, sortOption });


  if (searchTerm !== prevProps.searchTerm || selectedCategory !== prevProps.selectedCategory || sortOption !== prevProps.sortOption) {
    setPrevProps({ searchTerm, selectedCategory, sortOption });
    setLocalSearchTerm(searchTerm);
    setLocalSelectedCategory(selectedCategory);
    setLocalSortOption(sortOption);
  }

  const handleApply = () => {
    onApplyFilters({
      searchTerm: localSearchTerm,
      selectedCategory: localSelectedCategory,
      sortOption: localSortOption
    });
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const FilterContent = (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Шукати</h4>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="Шукати знижки..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Категорії</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
              checked={localSelectedCategory === null}
              onChange={() => setLocalSelectedCategory(null)}
            />
            <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
              Усі категорії
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                checked={localSelectedCategory === cat.id}
                onChange={() => setLocalSelectedCategory(cat.id)}
              />
              <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Сортувати за</h4>
        <select
          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
          value={localSortOption}
          onChange={(e) => setLocalSortOption(e.target.value)}
        >
          <option value="newest">Найновіші</option>
          <option value="price_asc">Ціна: від меншого до більшого</option>
          <option value="price_desc">Ціна: від більшого до меншого</option>
          <option value="discount_desc">Найвигідніша знижка</option>
        </select>
      </div>

      {/* Apply Button */}
      <div className="mt-4 flex flex-col gap-2">
        <button className="btn-secondary py-2" onClick={() => { onApplyFilters({ searchTerm: '', selectedCategory: null, sortOption: 'newest' }) }}>
          Очистити фільтри
        </button>
        <button
          onClick={handleApply}
          className="w-full btn-primary"
        >
          Застосувати фільтри
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="glass-card p-6 sticky top-24">
          {FilterContent}
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCloseMobileDrawer}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-xs h-full bg-white dark:bg-zinc-900 shadow-2xl p-6 overflow-y-auto transform transition-transform ml-auto flex flex-col border-l border-zinc-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-2xl">Filters</h3>
              <button
                onClick={onCloseMobileDrawer}
                className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {FilterContent}
          </div>
        </div>
      )}
    </>
  );
}
