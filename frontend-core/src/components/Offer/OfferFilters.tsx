import { Search, X } from 'lucide-react';

export interface Category {
  id: number;
  name: string;
}

interface OfferFiltersProps {
  categories: Category[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: number | null;
  setSelectedCategory: (id: number | null) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export default function OfferFilters({
  categories,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  sortOption,
  setSortOption,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer
}: OfferFiltersProps) {
  
  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Search</h4>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="Search offers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Categories */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Categories</h4>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="radio"
              name="category"
              className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
              checked={selectedCategory === null}
              onChange={() => setSelectedCategory(null)}
            />
            <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
              All Categories
            </span>
          </label>
          {categories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                checked={selectedCategory === cat.id}
                onChange={() => setSelectedCategory(cat.id)}
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
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Sort By</h4>
        <select
          className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="newest">Newest Adds</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="discount_desc">Biggest Discount</option>
        </select>
      </div>

      {/* Apply Button (Mobile only) */}
      <div className="mt-4 lg:hidden">
        <button 
          onClick={onCloseMobileDrawer}
          className="w-full btn-primary"
        >
          Show Results
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 shrink-0">
        <div className="glass-card p-6 sticky top-24">
          <FilterContent />
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
            
            <FilterContent />
          </div>
        </div>
      )}
    </>
  );
}
