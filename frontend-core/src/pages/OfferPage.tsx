import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Filter } from 'lucide-react';
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

    const [offers, setOffers] = useState<Offer[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Mobile drawer state
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Derived State from URL
    const searchTerm = searchParams.get('searchTerm') || '';
    const selectedCategoryStr = searchParams.get('categoryId');
    const selectedCategory = selectedCategoryStr ? parseInt(selectedCategoryStr, 10) : null;
    const sortOption = searchParams.get('sortOption') || 'newest';

    const updateFilter = (key: string, value: string | null) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    const handleSearchChange = (term: string) => updateFilter('searchTerm', term || null);
    const handleCategoryChange = (id: number | null) => updateFilter('categoryId', id?.toString() || null);
    const handleSortChange = (option: string) => updateFilter('sortOption', option);


    useEffect(() => {
        const newParams = new URLSearchParams();
        if (searchTerm) newParams.set('searchTerm', searchTerm);
        if (selectedCategory !== null) newParams.set('categoryId', selectedCategory.toString());
        if (sortOption) newParams.set('sortOption', sortOption);
        setSearchParams(newParams);
    }, [searchTerm, selectedCategory, sortOption]);

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

                const response = await axios.get<ApiOfferResponse>(`/api/Discounts?${params.toString()}`);
                if (Array.isArray(response.data.data)) {
                    setOffers(response.data.data);
                } else {
                    console.error("Expected array of offers, got:", typeof response.data);
                    setOffers([]);
                }
            } catch (error) {
                console.error("Failed to fetch offers:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOffers();
    }, [searchTerm, selectedCategory, sortOption]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                        Explore <span className="text-primary-500">Offers</span>
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Find the best deals and discounts tailored for you.
                    </p>
                </div>

                {/* Mobile Filter Toggle Button */}
                <button
                    onClick={() => setIsMobileDrawerOpen(true)}
                    className="lg:hidden btn-secondary gap-2"
                >
                    <Filter className="w-5 h-5" />
                    <span>Filters</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Filters Panel Component */}
                <OfferFilters
                    categories={categories}
                    searchTerm={searchTerm}
                    setSearchTerm={handleSearchChange}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategoryChange}
                    sortOption={sortOption}
                    setSortOption={handleSortChange}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {offers.map((offer) => (
                                <OfferCard key={offer.id} offer={offer} />
                            ))}
                        </div>
                    ) : (
                        // Empty State
                        <div className="glass-card p-12 text-center">
                            <h3 className="text-2xl font-bold mb-2">No offers found</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                            <button
                                onClick={() => {
                                    handleSearchChange('');
                                    handleCategoryChange(null);
                                }}
                                className="mt-6 btn-primary"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
