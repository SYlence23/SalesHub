import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Sparkles, MapPin, Globe, Calendar, User, ChevronLeft as ArrowLeft, ChevronRight as ArrowRight, Users } from 'lucide-react';
import { AudienceBadge } from '../components/Offer/GoodDealCard';

interface GoodDealDetail {
    id: number;
    title: string;
    description?: string;
    categoryName: string;
    validFrom?: string;
    validTo?: string;
    isOnline: boolean;
    storeName: string;
    offerUrl?: string;
    latitude?: number;
    longitude?: number;
    imageUrls: string[];
    creatorUserName?: string;
    createdAt: string;
    targetAudiences: string[];
}

export default function GoodDealDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [deal, setDeal] = useState<GoodDealDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);

    useEffect(() => {
        if (!id) return;
        const fetchDeal = async () => {
            try {
                const res = await axios.get<GoodDealDetail>(`/api/GoodDeals/${id}`);
                setDeal(res.data);
            } catch (err) {
                setError('Не вдалося завантажити пропозицію.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeal();
    }, [id]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-6" />
                <div className="h-80 w-full bg-zinc-200 dark:bg-zinc-700 rounded-2xl mb-6" />
                <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
                <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
                <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Пропозицію не знайдено</h2>
                <p className="text-zinc-500 mb-6">{error}</p>
                <button onClick={() => navigate('/good-deals')} className="btn-primary">
                    Повернутися до списку
                </button>
            </div>
        );
    }

    const hasImages = deal.imageUrls && deal.imageUrls.length > 0;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/good-deals')}
                className="flex items-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Назад до пропозицій
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Left: Images */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Main image */}
                    <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group">
                        <img
                            src={hasImages ? deal.imageUrls[activeImage] : ''}
                            alt={deal.title}
                            className="w-full h-full object-cover transition-all duration-500"
                            onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80";
                            }}
                        />

                        {/* Good Deal badge */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                            <Sparkles className="w-4 h-4" />
                            Хороша пропозиція
                        </div>

                        {/* Image navigation */}
                        {deal.imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImage(prev => (prev - 1 + deal.imageUrls.length) % deal.imageUrls.length)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => (prev + 1) % deal.imageUrls.length)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {deal.imageUrls.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-white w-4' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {deal.imageUrls.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {deal.imageUrls.map((url, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImage(i)}
                                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImage ? 'border-emerald-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Category */}
                    <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {deal.categoryName}
                    </span>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                        {deal.title}
                    </h1>

                    {/* Description */}
                    {deal.description && (
                        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {deal.description}
                        </p>
                    )}

                    {/* Target Audience */}
                    {deal.targetAudiences && deal.targetAudiences.length > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                            <Users className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Для кого</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {deal.targetAudiences.map(a => (
                                        <AudienceBadge key={a} label={a} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Info cards */}
                    <div className="space-y-3">
                        {/* Store */}
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                            {deal.isOnline ? (
                                <Globe className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                            ) : (
                                <MapPin className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                            )}
                            <div>
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                    {deal.isOnline ? 'Онлайн магазин' : 'Заклад'}
                                </p>
                                <p className="font-semibold text-zinc-900 dark:text-white">{deal.storeName}</p>
                                {deal.isOnline && deal.offerUrl && (
                                    <a
                                        href={deal.offerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline break-all"
                                    >
                                        {deal.offerUrl}
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Dates */}
                        {(deal.validFrom || deal.validTo) && (
                            <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                                <Calendar className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Термін дії</p>
                                    <p className="font-medium text-zinc-900 dark:text-white">
                                        {deal.validFrom && <span>З {formatDate(deal.validFrom)}</span>}
                                        {deal.validFrom && deal.validTo && <span className="text-zinc-400 mx-1">–</span>}
                                        {deal.validTo && <span>До {formatDate(deal.validTo)}</span>}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Creator */}
                        {deal.creatorUserName && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                                <User className="w-5 h-5 text-zinc-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">Додав</p>
                                    <p className="font-medium text-zinc-900 dark:text-white">{deal.creatorUserName}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CTA — if online */}
                    {deal.isOnline && deal.offerUrl && (
                        <a
                            href={deal.offerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Globe className="w-4 h-4" />
                            Перейти до пропозиції
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
