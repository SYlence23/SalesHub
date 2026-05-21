import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';
import OfferSkeletonCard from '../components/Offer/OfferSkeletonCard';
import OfferFilters, { type Category } from '../components/Offer/OfferFilters';

interface ApiOfferResponse {
    total: number;
    page: number;
    data: Offer[];
}

export default function OfferPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [offers, setOffers] = useState<Offer[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalOffers, setTotalOffers] = useState(0);

    // Mobile drawer state
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Derived State from URL
    const searchTerm = searchParams.get('searchTerm') || '';
    const selectedCategoryStr = searchParams.get('categoryId');
    const selectedCategory = selectedCategoryStr ? parseInt(selectedCategoryStr, 10) : null;
    const sortOption = searchParams.get('sortOption') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const totalPages = Math.ceil(totalOffers / 10);

    const handleApplyFilters = (filters: { searchTerm: string; selectedCategory: number | null; sortOption: string }) => {
        const newParams = new URLSearchParams(searchParams);
        if (filters.searchTerm) {
            newParams.set('searchTerm', filters.searchTerm);
        } else {
            newParams.delete('searchTerm');
        }
        if (filters.selectedCategory !== null) {
            newParams.set('categoryId', filters.selectedCategory.toString());
        } else {
            newParams.delete('categoryId');
        }
        if (filters.sortOption) {
            newParams.set('sortOption', filters.sortOption);
        } else {
            newParams.delete('sortOption');
        }
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get<Category[]>('/api/Discounts/categories');
                if (Array.isArray(response.data)) {
                    setCategories(response.data);
                } else {
                    console.error("Expected array of categories, got:", typeof response.data);
                    setCategories([]);
                }
            } catch (error) {
                console.error("Failed to fetch categories:", error);
            }
        };
        fetchCategories();
    }, []);

    // Fetch offers when URL params change
    useEffect(() => {
        const fetchOffers = async () => {
            setIsLoading(true);
            try {
                // Build query params for axios
                const params = new URLSearchParams();
                if (searchTerm) params.append('searchTerm', searchTerm);
                if (selectedCategory !== null) params.append('categoryId', selectedCategory.toString());
                if (sortOption) params.append('sortOption', sortOption);
                params.append('page', page.toString());

                const response = await axios.get<ApiOfferResponse>(`/api/Discounts?${params.toString()}`);
                if (Array.isArray(response.data.data)) {
                    setOffers(response.data.data);
                    setTotalOffers(response.data.total);
                } else {
                    console.error("Expected array of offers, got:", typeof response.data);
                    setOffers([]);
                    setTotalOffers(0);
                }
            } catch (error) {
                console.error("Failed to fetch offers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOffers();
    }, [searchTerm, selectedCategory, sortOption, page]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                        Пошук <span className="text-primary-500">Знижок</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Відкривайте найкращі пропозиції та знижки.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/offers/create')}
                        className="btn-primary"
                    >
                        Створити знижку
                    </button>
                    {/* Mobile Filter Toggle Button */}
                    <button
                        onClick={() => setIsMobileDrawerOpen(true)}
                        className="lg:hidden btn-secondary gap-2"
                    >
                        <Filter className="w-5 h-5" />
                        <span>Фільтри</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Panel Component */}
                <OfferFilters
                    categories={categories}
                    searchTerm={searchTerm}
                    selectedCategory={selectedCategory}
                    sortOption={sortOption}
                    onApplyFilters={handleApplyFilters}
                    isMobileDrawerOpen={isMobileDrawerOpen}
                    onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
                />

                {/* Offers Grid */}
                <div className="grow">
                    {isLoading ? (
                        // Skeleton State
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <OfferSkeletonCard key={i} />
                            ))}
                        </div>
                    ) : offers.length > 0 ? (
                        // Data State
                        <div className="flex flex-col gap-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {offers.map((offer) => (
                                    <OfferCard key={offer.id} offer={offer} />
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page <= 1}
                                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Попередня сторінка"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                        Сторінка {page} з {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page >= totalPages}
                                        className="btn-secondary px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Наступна сторінка"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Empty State
                        <div className="glass-card p-12 text-center">
                            <h3 className="text-2xl font-bold mb-2">Знижок не знайдено</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Спробуйте змінити фільтри або пошуковий запит, щоб знайти те, що ви шукаєте.
                            </p>
                            <button
                                onClick={() => {
                                    handleApplyFilters({ searchTerm: '', selectedCategory: null, sortOption: 'newest' });
                                }}
                                className="mt-6 btn-primary"
                            >
                                Очистити фільтри
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
