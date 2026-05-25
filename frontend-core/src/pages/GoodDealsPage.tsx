import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X, Users } from 'lucide-react';
import GoodDealCard, { type GoodDeal, AudienceBadge } from '../components/Offer/GoodDealCard';
import GoodDealSkeletonCard from '../components/Offer/GoodDealSkeletonCard';
import { type Category } from '../components/Offer/OfferFilters';

interface ApiGoodDealResponse {
    total: number;
    page: number;
    data: GoodDeal[];
}

// Predefined audience list (same as in CreatePage)
const AUDIENCES = ['Молодь', 'Студенти', 'Учні'];

export default function GoodDealsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [deals, setDeals] = useState<GoodDeal[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalDeals, setTotalDeals] = useState(0);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const searchTerm = searchParams.get('searchTerm') || '';
    const selectedCategoryStr = searchParams.get('categoryId');
    const selectedCategory = selectedCategoryStr ? parseInt(selectedCategoryStr, 10) : null;
    const selectedAudience = searchParams.get('audience') || null;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const totalPages = Math.ceil(totalDeals / 10);

    const [localSearch, setLocalSearch] = useState(searchTerm);

    useEffect(() => { setLocalSearch(searchTerm); }, [searchTerm]);

    const applySearch = () => {
        const p = new URLSearchParams(searchParams);
        if (localSearch) p.set('searchTerm', localSearch); else p.delete('searchTerm');
        p.set('page', '1');
        setSearchParams(p);
    };

    const handleCategorySelect = (catId: number | null) => {
        const p = new URLSearchParams(searchParams);
        if (catId !== null) p.set('categoryId', catId.toString()); else p.delete('categoryId');
        p.set('page', '1');
        setSearchParams(p);
    };

    const handleAudienceSelect = (audience: string | null) => {
        const p = new URLSearchParams(searchParams);
        if (audience) p.set('audience', audience); else p.delete('audience');
        p.set('page', '1');
        setSearchParams(p);
    };

    const clearAll = () => {
        setLocalSearch('');
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (newPage: number) => {
        const p = new URLSearchParams(searchParams);
        p.set('page', newPage.toString());
        setSearchParams(p);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch categories
    useEffect(() => {
        axios.get<Category[]>('/api/Discounts/categories')
            .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
            .catch(err => console.error('Failed to fetch categories:', err));
    }, []);

    // Fetch good deals
    useEffect(() => {
        const fetchDeals = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                if (searchTerm) params.append('searchTerm', searchTerm);
                if (selectedCategory !== null) params.append('categoryId', selectedCategory.toString());
                if (selectedAudience) params.append('audience', selectedAudience);
                params.append('page', page.toString());

                const res = await axios.get<ApiGoodDealResponse>(`/api/GoodDeals?${params.toString()}`);
                if (Array.isArray(res.data.data)) {
                    setDeals(res.data.data);
                    setTotalDeals(res.data.total);
                }
            } catch (err) {
                console.error('Failed to fetch good deals:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeals();
    }, [searchTerm, selectedCategory, selectedAudience, page]);

    const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name;
    const hasActiveFilters = !!(searchTerm || selectedCategory || selectedAudience);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-start sm:items-center justify-between mb-8 flex-col sm:flex-row gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-6 h-6 text-orange-500" />
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            Студентська <span className="text-orange-500">вигода</span>
                        </h1>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Хаб корисних вигід для молоді.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/good-deals/create')}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95 gap-2 whitespace-nowrap"
                >
                    <Sparkles className="w-4 h-4" />
                    Додати вигоду
                </button>
            </div>

            {/* Search Row */}
            <div className="flex gap-3 mb-4 flex-wrap">
                <div className="flex flex-1 min-w-[200px] gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applySearch()}
                            placeholder="Пошук вигід..."
                            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                        />
                    </div>
                    <button onClick={applySearch} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all active:scale-95">
                        Знайти
                    </button>
                </div>
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium border transition-all active:scale-95 ${
                        selectedCategory || selectedAudience
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400 text-orange-700 dark:text-orange-400'
                            : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Фільтри
                    {(selectedCategory || selectedAudience) && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {[selectedCategory, selectedAudience].filter(Boolean).length}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {isFilterOpen && (
                <div className="glass-card p-5 mb-5 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Category filter */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Категорія</p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleCategorySelect(null)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === null ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                Усі категорії
                            </button>
                            {categories
                                .filter(c => ['Розваги', 'Транспорт', 'Відпочинок', 'Освіта'].includes(c.name))
                                .filter((c, index, self) => self.findIndex(t => t.name === c.name) === index)
                                .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
                                .map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleCategorySelect(c.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedCategory === c.id ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                                    >
                                        {c.name}
                                    </button>
                                ))
                            }
                        </div>
                    </div>

                    {/* Audience filter */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            Для кого
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleAudienceSelect(null)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedAudience === null ? 'bg-orange-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
                            >
                                Будь-яка аудиторія
                            </button>
                            {AUDIENCES.map(a => (
                                <button
                                    key={a}
                                    onClick={() => handleAudienceSelect(a)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedAudience === a ? 'ring-2 ring-offset-1 ring-orange-500' : ''}`}
                                >
                                    <AudienceBadge label={a} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Active filter chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {searchTerm && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm border border-orange-200 dark:border-orange-800">
                            🔍 "{searchTerm}"
                            <button onClick={() => { setLocalSearch(''); const p = new URLSearchParams(searchParams); p.delete('searchTerm'); p.set('page','1'); setSearchParams(p); }}>
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    {selectedCategoryName && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm border border-orange-200 dark:border-orange-800">
                            {selectedCategoryName}
                            <button onClick={() => handleCategorySelect(null)}><X className="w-3.5 h-3.5" /></button>
                        </span>
                    )}
                    {selectedAudience && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border border-emerald-200 dark:border-emerald-800">
                            <AudienceBadge label={selectedAudience} />
                            <button onClick={() => handleAudienceSelect(null)} className="ml-1 text-zinc-400 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    )}
                    <button onClick={clearAll} className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-2">
                        Очистити все
                    </button>
                </div>
            )}

            {!isLoading && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    Знайдено: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalDeals}</span> пропозицій
                </p>
            )}

            {/* Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => <GoodDealSkeletonCard key={i} />)}
                </div>
            ) : deals.length > 0 ? (
                <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {deals.map(deal => <GoodDealCard key={deal.id} deal={deal} />)}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-2">
                            <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1} className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Попередня сторінка">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Сторінка {page} з {totalPages}
                            </span>
                            <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Наступна сторінка">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card p-12 text-center">
                    <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-2xl font-bold mb-2">Пропозицій не знайдено</h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                        Спробуйте змінити фільтри або пошуковий запит.
                    </p>
                    <button onClick={clearAll} className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-medium text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md active:scale-95">
                        Очистити фільтри
                    </button>
                </div>
            )}
        </div>
    );
}
