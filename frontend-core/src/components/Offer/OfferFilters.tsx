import { useState } from 'react';
import { Search, X } from 'lucide-react';

export interface Category {
  id: number;
  name: string;
  markerColor?: string;
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

  const handleApplyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  const FilterContent = (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <h4 className="font-bold text-zinc-900 dark:text-white mb-3">Пошук</h4>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-zinc-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            placeholder="Пошук пропозицій..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            onKeyDown={handleApplyKeyPress}
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
              Всі категорії
            </span>
          </label>
          {categories
            .filter(cat => !['Освіта', 'Побут', 'Подорожі', 'Відпочинок', 'Транспорт'].includes(cat.name))
            .map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                className="w-4 h-4 text-primary-500 focus:ring-primary-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                checked={localSelectedCategory === cat.id}
                onChange={() => setLocalSelectedCategory(cat.id)}
              />
              <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2">
                {cat.markerColor && (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" 
                    style={{ backgroundColor: cat.markerColor + '33' }}
                  >
                    {cat.name === 'Заклади' && (
                        <svg viewBox="0 0 122.88 122.88" className="w-5 h-5" style={{ fill: cat.markerColor }}>
                            <path d="M40.09,59.7l-0.15,9.21h16.63c3.52,0,6.4,2.88,6.4,6.4v6.4h-0.07v25.04c0,3.52-2.88,6.4-6.4,6.4h-6.4V84.03 c0-2.64,0.5-2.32-2.05-2.32H31.58v-0.04h-8.21c-5.3,0-9.63-4.33-9.63-9.63V40.51c0-5.39,4.41-9.79,9.79-9.79h4.85 c6.82,0,8.3,3.18,9.92,6.59l8.67,4.16c5.93,2.67,4.4,3.2,8.42-1.78l4.48-5.56l-4.97-2.92c-0.94,0.18-2.12,0.02-3.26-0.51 c-2.11-0.99-3.31-2.89-2.67-4.24c0.63-1.35,2.86-1.65,4.97-0.66c1.8,0.85,2.94,2.36,2.83,3.62l4.8,2.82 c3.46-2.25,11.3,1.83,7.38,8.02L61.37,50.6c-3.16,4.31-7.36,4.92-12.44,2.8l-8.84-3.11V59.7L40.09,59.7z M122.31,57.15H90.29 l2.49-3.04c0.39,0.3,0.83,0.54,1.29,0.72c0.56,0.21,1.18,0.33,1.81,0.33c1.43,0,2.72-0.59,3.66-1.54c0.94-0.95,1.51-2.25,1.51-3.7 c0-1.44-0.58-2.75-1.51-3.7c-0.94-0.95-2.23-1.54-3.66-1.54c-1.43,0-2.72,0.59-3.66,1.54c-0.85,0.86-1.41,2.03-1.5,3.32 c-7.84,0-15.69,0-23.53,0v0c-0.11,0-0.22,0.04-0.31,0.12c-0.18,0.17-0.18,0.45-0.01,0.63l5.98,6.85H59.7 c-0.31,0-0.57,0.26-0.57,0.57v8.16c0,0.31,0.26,0.57,0.57,0.57c10.91,0,16.21,0,27.13,0v50c0,0.41,0.34,0.75,0.75,0.75h0.29h0.02 h8.01h0.02h0.29c0.41,0,0.75-0.34,0.75-0.75v-50c7.2,0,18.15,0,25.35,0c0.31,0,0.57-0.26,0.57-0.57v-8.16 C122.88,57.4,122.62,57.15,122.31,57.15L122.31,57.15z M1.78,50.66h4.67c0.95,0,1.58,0.79,1.73,1.73 c1.77,11.12,2.72,22.25,2.67,33.37h31.95c1.26,0,2.29,1.03,2.29,2.29v4.63h-1.83v23.68c0,0.38-0.32,0.7-0.7,0.7h-6.12 c-0.38,0-0.7-0.31-0.7-0.7v-10.3H9.59c-0.38,3.14-0.85,6.28-1.41,9.42c-0.17,0.94-0.78,1.73-1.73,1.73H1.78 c-0.95,0-2-0.82-1.73-1.73c6.16-21.43,4.87-42.38,0-63.09C-0.18,51.46,0.82,50.66,1.78,50.66L1.78,50.66z M35.73,102.87V92.69 H10.75c-0.14,4.33-0.44,5.85-0.9,10.19H35.73L35.73,102.87z M28.07,0c7.4,0,13.4,6,13.4,13.4c0,7.4-6,13.4-13.4,13.4 c-7.4,0-13.4-6-13.4-13.4C14.68,6,20.68,0,28.07,0L28.07,0z" />
                        </svg>
                    )}
                    {cat.name === 'Розваги' && (
                        <svg viewBox="0 0 512.059 512.059" className="w-5 h-5" style={{ fill: cat.markerColor }}>
                            <path d="M486.623,216.815l-16.448,4.032c-46.383,11.367-95.144,7.328-138.585-10.918c-0.515-10.27-2.166-20.649-5.065-30.994 L293.034,59.283c-4.312-15.406-23.42-20.76-35.109-9.837l-19.2,17.941C189.974,113,119.7,131.016,53.434,114.797l-26.011-6.359 C11.568,104.562-2.589,119.2,1.814,134.916l33.515,119.637c18.768,66.986,83.095,110.149,151.994,107.281 c13.511,49.812,53.727,89.954,106.994,103.618c80.137,20.542,162.715-25.083,184.413-102.502l33.516-119.662 C516.649,227.567,502.481,212.927,486.623,216.815z M76.413,243.043l-23.726-84.696c74.477,15.177,152.12-4.841,208.673-53.932 l24.08,86.027c2.851,10.173,3.982,20.408,3.56,30.422c-0.063,0.496-0.112,0.998-0.142,1.508 c-2.445,42.267-32.171,79.18-75.263,92.111c-0.177,0.053-0.354,0.105-0.532,0.157c-1.298,0.383-2.605,0.748-3.926,1.087 c-0.062,0.016-0.124,0.031-0.186,0.047c-0.418,0.106-0.837,0.204-1.255,0.306c-1.677,0.389-3.591,0.756-6.974,1.363 c-0.589,0.106-1.163,0.247-1.731,0.398C144.36,326.691,90.859,294.602,76.413,243.043z M437.645,351.439 c-15.341,54.737-74.731,87.55-132.731,72.683c-36.994-9.49-64.95-36.445-75.391-69.915c0.139-0.045,0.274-0.096,0.413-0.142 c1.339-0.442,2.67-0.897,3.989-1.372c0.039-0.014,0.079-0.027,0.118-0.041c2.944-1.063,5.834-2.213,8.673-3.437 c0.062-0.027,0.124-0.054,0.185-0.081c42.13-18.227,72.43-53.788,83.86-95.273c42.843,15.628,89.388,19.981,134.766,12.312 L437.645,351.439z" />
                            <path d="M150.363,193.033H129.03c-11.782,0-21.333,9.551-21.333,21.333c0,11.782,9.551,21.333,21.333,21.333h21.333 c11.782,0,21.333-9.551,21.333-21.333C171.696,202.584,162.145,193.033,150.363,193.033z" />
                            <path d="M229.448,208.118l21.333-21.333c8.331-8.331,8.331-21.839,0-30.17c-8.331-8.331-21.839-8.331-30.17,0l-21.333,21.333 c-8.331,8.331-8.331,21.839,0,30.17C207.609,216.449,221.117,216.449,229.448,208.118z" />
                        </svg>
                    )}
                    {cat.name === 'Культура' && (
                        <svg viewBox="0 0 256 253" className="w-5 h-5" style={{ fill: cat.markerColor }}>
                            <path d="M185.489,154.208c0,0-23.61-30.526-57.724-37.078c-43.423-8.425-61,19.709-63.652,38.899 c-4.68,33.646,32.346,52.939,49.299,58.14c41.967,12.793,55.8-1.924,57.724-11.441c1.768-9.049-17.837-15.497-14.457-25.066 c3.068-8.737,22.621,8.581,29.59,2.132C188.609,177.662,196.046,168.821,185.489,154.208z M90.843,165.909 c-1.04,4.316-5.46,7.02-9.777,5.928c-4.316-1.04-7.02-5.46-5.928-9.777c1.04-4.316,5.46-7.02,9.777-5.928 C89.231,157.172,91.935,161.592,90.843,165.909z M94.015,150.516c-4.316-1.04-7.02-5.46-5.928-9.777 c1.04-4.316,5.46-7.02,9.777-5.928c4.316,1.04,7.02,5.46,5.928,9.777C102.752,148.904,98.331,151.608,94.015,150.516z M106.132,185.982c-1.04,4.316-5.46,7.02-9.777,5.928c-4.316-1.04-7.02-5.46-5.928-9.777c1.04-4.316,5.46-7.02,9.777-5.928 C104.572,177.246,107.172,181.666,106.132,185.982z M119.029,146.98c-4.316-1.092-7.02-5.512-5.928-9.829 c1.04-4.316,5.46-7.02,9.777-5.928c4.316,1.04,7.02,5.46,5.928,9.777C127.765,145.367,123.345,148.02,119.029,146.98z M129.378,197.579c-1.04,4.316-5.46,7.02-9.777,5.928c-4.316-1.04-7.02-5.46-5.928-9.777c1.04-4.316,5.46-7.02,9.777-5.928 C127.765,188.842,130.418,193.211,129.378,197.579z M2,69c0,13.678,9.625,25.302,22,29.576V233H2v18h252v-18h-22V98.554 c12.89-3.945,21.699-15.396,22-29.554v-8H2V69z M65.29,68.346c0,6.477,6.755,31.47,31.727,31.47 c21.689,0,31.202-19.615,31.202-31.47c0,11.052,7.41,31.447,31.464,31.447c21.733,0,31.363-20.999,31.363-31.447 c0,14.425,9.726,26.416,22.954,30.154V233H42V98.594C55.402,94.966,65.29,82.895,65.29,68.346z M254,54H2l32-32V2h189v20h-0.168 L254,54z" />
                        </svg>
                    )}
                    {cat.name === 'Книги' && (
                        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" style={{ stroke: cat.markerColor, strokeWidth: '1.5px', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                            <path d="M10 22C7.17157 22 5.75736 22 4.87868 21.1213C4 20.2426 4 18.8284 4 16V8C4 5.17157 4 3.75736 4.87868 2.87868C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.87868C20 3.75736 20 5.17157 20 8M14 22C16.8284 22 18.2426 22 19.1213 21.1213C20 20.2426 20 18.8284 20 16V12" />
                            <path d="M19.8978 16H7.89778C6.96781 16 6.50282 16 6.12132 16.1022C5.08604 16.3796 4.2774 17.1883 4 18.2235" />
                            <path d="M7 16V9M7 2.5V5" />
                            <path d="M13 16V19.5309C13 19.8065 13 19.9443 12.9051 20C12.8103 20.0557 12.6806 19.9941 12.4211 19.8708L11.1789 19.2808C11.0911 19.2391 11.0472 19.2182 11 19.2182C10.9528 19.2182 10.9089 19.2391 10.8211 19.2808L9.57889 19.8708C9.31943 19.9941 9.18971 20.0557 9.09485 20C9 19.9443 9 19.8065 9 19.5309V16.45" />
                        </svg>
                    )}
                    {cat.name === 'Спорт' && (
                        <svg viewBox="0 0 326.845 326.845" className="w-5 h-5" style={{ fill: cat.markerColor }}>
                            <path d="M264.693,326.845h-38.079c-4.418,0-8-3.582-8-8v-30.464H108.231v30.464c0,4.418-3.582,8-8,8H62.152c-4.418,0-8-3.582-8-8 v-6.939H24.074c-4.418,0-8-3.582-8-8V224.03c0-4.418,3.582-8,8-8h30.077v-6.938c0-4.418,3.582-8,8-8h38.079c4.418,0,8,3.582,8,8 v30.464h110.384v-30.464c0-4.418,3.582-8,8-8h38.079c4.418,0,8,3.582,8,8v6.938h30.077c4.418,0,8,3.582,8,8v79.875 c0,4.418-3.582,8-8,8h-30.077v6.939C272.693,323.263,269.112,326.845,264.693,326.845z M234.615,310.845h22.079v-93.753h-22.079 V310.845z M70.152,310.845h22.079v-93.753H70.152V310.845z M272.693,295.905h22.077V232.03h-22.077V295.905z M32.074,295.905h22.077 V232.03H32.074V295.905z M108.231,272.381h110.384v-16.825H108.231V272.381z M145.443,223.376c-1.331,0-2.68-0.332-3.922-1.032 c-3.849-2.17-5.209-7.05-3.04-10.898c14.273-25.312,33.543-46.712,56.214-63.181c-9.894-13.703-21.197-26.173-33.681-37.227 c-31.019,33.403-73.355,55.896-120.395,61.599c1.042,4.209,2.303,8.368,3.784,12.468c1.501,4.155-0.65,8.741-4.806,10.242 c-4.158,1.502-8.741-0.651-10.242-4.807c-5.571-15.424-8.396-31.599-8.396-48.077C20.959,63.908,84.868,0,163.423,0 c78.554,0,142.462,63.908,142.462,142.463c0,14.179-2.104,28.201-6.255,41.68c-1.301,4.223-5.78,6.589-10,5.291 c-4.223-1.3-6.591-5.777-5.291-10c3.68-11.951,5.546-24.39,5.546-36.971c0-4.869-0.276-9.673-0.814-14.4 c-25.871,2.997-50.403,11.521-72.172,24.662c4.713,7.504,9.017,15.253,12.873,23.202c1.928,3.975,0.269,8.761-3.706,10.689 c-3.975,1.925-8.762,0.269-10.689-3.707c-3.573-7.366-7.501-14.486-11.761-21.341c-20.629,15.091-38.175,34.642-51.196,57.736 C150.948,221.911,148.236,223.376,145.443,223.376z M66.601,61.193c-18.492,21.994-29.642,50.354-29.642,81.27 c0,4.834,0.274,9.639,0.819,14.399c43.257-5.019,82.233-25.484,110.873-56.012C124.555,82.391,96.76,68.814,66.601,61.193z M171.329,98.998c13.625,12.048,25.936,25.664,36.611,40.442c23.598-14.378,50.218-23.758,78.307-27.155 c-9.987-40.635-39.667-73.615-78.299-88.194C201.125,51.937,188.433,77.333,171.329,98.998z M79.321,48.096 c28.682,8.458,55.914,22.357,79.681,40.709c15.771-20.065,27.435-43.606,33.62-69.402C183.248,17.179,173.468,16,163.423,16 C131.162,16,101.686,28.14,79.321,48.096z" />
                        </svg>
                    )}
                    {cat.name !== 'Заклади' && cat.name !== 'Розваги' && cat.name !== 'Культура' && cat.name !== 'Книги' && cat.name !== 'Спорт' && (
                        <svg viewBox="0 0 122.88 122.88" className="w-5 h-5" style={{ fill: cat.markerColor }}>
                            <circle cx="61.44" cy="61.44" r="40" />
                        </svg>
                    )}
                  </div>
                )}
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
          onChange={(e) => {
            const val = e.target.value;
            setLocalSortOption(val);
            onApplyFilters({
              searchTerm: localSearchTerm,
              selectedCategory: localSelectedCategory,
              sortOption: val
            });
          }}
        >
          <option value="newest">Нові додані</option>
          <option value="popular">Найпопулярніші</option>
          <option value="price_asc">Ціна: від низької</option>
          <option value="price_desc">Ціна: від високої</option>
          <option value="discount_desc">Найбільша знижка</option>
        </select>
      </div>

      {/* Apply Button */}
      <div className="mt-4 flex flex-col gap-2">
        <button className="btn-secondary py-2" onClick={() => { onApplyFilters({ searchTerm: '', selectedCategory: null, sortOption: 'newest' }) }}>
          Очистити
        </button>
        <button
          onClick={handleApply}
          className="w-full btn-primary"
        >
          Застосувати
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
              <h3 className="font-bold text-2xl">Фільтри</h3>
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
