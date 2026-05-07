import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin } from 'lucide-react';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';

interface PlaceFull {
    id: number;
    name: string;
    description: string;
    addresses: string[];
    mainImageUrl: string | null;
    offers: Offer[];
}

export default function PlaceDetailsPage() {
    const { id } = useParams();
    const [place, setPlace] = useState<PlaceFull | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlace = async () => {
            try {
                const response = await axios.get<PlaceFull>(`/api/places/${id}`);
                setPlace(response.data);
            } catch (error) {
                console.error("Failed to fetch place details:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlace();
    }, [id]);

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl mb-8"></div>
                <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3 mb-12"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                    <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!place) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Заклад не знайдено</h2>
                <Link to="/places" className="btn-primary">Назад до закладів</Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/places" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary-500 transition-colors mb-6 font-medium">
                <ArrowLeft className="w-5 h-5" />
                Назад до закладів
            </Link>

            {/* Header Section */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-12 min-h-[300px] flex items-end">
                {place.mainImageUrl ? (
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${place.mainImageUrl})` }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    </div>
                ) : (
                    <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-400" />
                )}

                <div className={`relative z-10 p-8 sm:p-12 w-full ${place.mainImageUrl ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4">{place.name}</h1>
                    <div className="flex flex-col gap-2 mb-6">
                        {place.addresses.map((addr, idx) => (
                            <div key={idx} className={`flex items-center gap-2 ${place.mainImageUrl ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                <MapPin className="w-5 h-5 text-primary-500" />
                                <span className="text-lg">{addr}</span>
                            </div>
                        ))}
                    </div>
                    {place.description && (
                        <p className={`text-lg max-w-3xl leading-relaxed ${place.mainImageUrl ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300'}`}>
                            {place.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Offers Section */}
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold">
                        Доступні <span className="text-primary-500">Пропозиції</span>
                    </h2>
                    <div className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold px-4 py-2 rounded-full text-sm">
                        {place.offers.length} пропозиції
                    </div>
                </div>

                {place.offers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {place.offers.map((offer: any) => (
                            <OfferCard key={offer.id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <h3 className="text-xl font-bold mb-2">Немає активних пропозицій</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Завітайте пізніше, щоб побачити цікаві знижки у {place.name}.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
