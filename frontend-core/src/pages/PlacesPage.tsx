import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin } from 'lucide-react';

interface PlacePreview {
    id: number;
    name: string;
    addresses: string[];
    mainImageUrl: string | null;
}

export default function PlacesPage() {
    const [places, setPlaces] = useState<PlacePreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlaces = async () => {
            try {
                const response = await axios.get<PlacePreview[]>('/api/places');
                setPlaces(response.data);
            } catch (error) {
                console.error("Failed to fetch places:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlaces();
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
                    Наші <span className="text-primary-500">Заклади</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg">
                    Відкрийте для себе чудові магазини та заклади з ексклюзивними знижками.
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 glass-card animate-pulse rounded-2xl w-full" />
                    ))
                ) : places.length > 0 ? (
                    places.map(place => (
                        <Link key={place.id} to={`/places/${place.id}`} className="group relative block overflow-hidden rounded-2xl h-48 sm:h-56 shadow-[var(--shadow-glass)] dark:shadow-[var(--shadow-glass-dark)] transition-transform hover:-translate-y-1 border-2 border-primary-500">
                            {place.mainImageUrl ? (
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${place.mainImageUrl})` }}>
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-400 transition-transform duration-500 group-hover:scale-105" />
                            )}

                            <div className={`relative h-full flex flex-col justify-center px-8 sm:px-12 z-10 ${place.mainImageUrl ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                <h3 className="text-3xl font-bold mb-3 drop-shadow-md">{place.name}</h3>
                                <div className="flex flex-col gap-2">
                                    {place.addresses.length > 0 ? (
                                        place.addresses.map((addr, idx) => (
                                            <div key={idx} className={`flex items-center gap-2 ${place.mainImageUrl ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-200'}`}>
                                                <MapPin className="w-5 h-5 text-primary-400" />
                                                <span className="text-base font-medium">{addr}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className={`flex items-center gap-2 ${place.mainImageUrl ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-300'}`}>
                                            <MapPin className="w-5 h-5 text-zinc-400" />
                                            <span>Локація не вказана</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="glass-card p-12 text-center text-zinc-500">
                        Наразі закладів немає.
                    </div>
                )}
            </div>
        </div>
    );
}
