import { useState, useEffect, useMemo } from 'react';
import { Filter } from 'lucide-react';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';
import OfferSkeletonCard from '../components/Offer/OfferSkeletonCard';
import OfferFilters, { type Category } from '../components/Offer/OfferFilters';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MOCK_CATEGORIES: Category[] = [
    { id: 1, name: 'Food & Drinks' },
    { id: 2, name: 'Electronics' },
    { id: 3, name: 'Fashion' },
    { id: 4, name: 'Entertainment' }
];

// Added categoryId to the standard Offer interface specifically for the mock data mapping
interface MockOffer extends Offer {
    categoryId: number;
    createdAt: string; // ISO date string for "newest" sorting
}

const MOCK_OFFERS: MockOffer[] = [
    {
        id: 10,
        title: "Знижка 50% на піцу",
        newPrice: 150.00,
        oldPrice: 300.00,
        storeName: "Pizza Day",
        mainImageUrl: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
        categoryId: 1,
        createdAt: "2026-04-10T10:00:00Z"
    },
    {
        id: 11,
        title: "Кава у подарунок",
        newPrice: 0.00,
        oldPrice: 45.00,
        storeName: "Aroma Kava",
        mainImageUrl: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=80",
        categoryId: 1,
        createdAt: "2026-04-09T15:30:00Z"
    },
    {
        id: 12,
        title: "iPhone 15 Pro Case",
        newPrice: 399.00,
        oldPrice: 800.00,
        storeName: "iStore",
        mainImageUrl: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=600&q=80",
        categoryId: 2,
        createdAt: "2026-04-08T09:00:00Z"
    },
    {
        id: 13,
        title: "Квитки у кіно 1+1",
        newPrice: 200.00,
        oldPrice: 400.00,
        storeName: "Multiplex",
        mainImageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80",
        categoryId: 4,
        createdAt: "2026-04-05T12:00:00Z"
    },
    {
        id: 14,
        title: "Winter Jacket Clearance",
        newPrice: 1200.00,
        oldPrice: 3500.00,
        storeName: "Zara",
        mainImageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        categoryId: 3,
        createdAt: "2026-04-01T18:00:00Z"
    },
    {
        id: 15,
        title: "Безкоштовна доставка суші",
        newPrice: 500.00,
        oldPrice: 550.00,
        storeName: "Sushi Master",
        mainImageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80",
        categoryId: 1,
        createdAt: "2026-04-10T14:00:00Z"
    }
];

export default function OfferPage() {
    const [offers, setOffers] = useState<MockOffer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [sortOption, setSortOption] = useState('newest');

    // Mobile drawer state
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

    // Fetch mock data simulation
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            // Simulate network request delay (1.5s for skeletons to show nicely)
            await sleep(1500);
            setOffers(MOCK_OFFERS);
            setIsLoading(false);
        };

        fetchData();
    }, []);

    // Filter and Sort logic
    const filteredAndSortedOffers = useMemo(() => {
        let result = [...offers];

        // 1. Search Filter
        if (searchTerm.trim()) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(o =>
                o.title.toLowerCase().includes(lowerQuery) ||
                o.storeName.toLowerCase().includes(lowerQuery)
            );
        }

        // 2. Category Filter
        if (selectedCategory !== null) {
            result = result.filter(o => o.categoryId === selectedCategory);
        }

        // 3. Sorting
        result.sort((a, b) => {
            switch (sortOption) {
                case 'price_asc':
                    return a.newPrice - b.newPrice;
                case 'price_desc':
                    return b.newPrice - a.newPrice;
                case 'discount_desc': {
                    const discountA = (a.oldPrice - a.newPrice) / a.oldPrice;
                    const discountB = (b.oldPrice - b.newPrice) / b.oldPrice;
                    return discountB - discountA;
                }
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        return result;
    }, [offers, searchTerm, selectedCategory, sortOption]);

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
                    categories={MOCK_CATEGORIES}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    sortOption={sortOption}
                    setSortOption={setSortOption}
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
                    ) : filteredAndSortedOffers.length > 0 ? (
                        // Data State
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAndSortedOffers.map((offer) => (
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
                                    setSearchTerm('');
                                    setSelectedCategory(null);
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
