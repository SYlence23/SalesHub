import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
    ChevronLeft, 
    Sparkles, 
    MapPin, 
    Globe, 
    Calendar, 
    User, 
    ChevronLeft as ArrowLeft, 
    ChevronRight as ArrowRight, 
    Users, 
    ThumbsUp, 
    ThumbsDown, 
    Share2, 
    Bookmark, 
    Tag, 
    Clock, 
    CheckCircle2, 
    XCircle,
    Eye
} from 'lucide-react';
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
    const { isAuthenticated } = useAuth();

    const [deal, setDeal] = useState<GoodDealDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeImage, setActiveImage] = useState(0);

    // Mock interactive states for premium UX
    const [likesCount, setLikesCount] = useState(1);
    const [hasLiked, setHasLiked] = useState(false);
    const [dislikesCount, setDislikesCount] = useState(0);
    const [hasDisliked, setHasDisliked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const [shareTooltip, setShareTooltip] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchDeal = async () => {
            try {
                const res = await api.get<GoodDealDetail>(`/api/GoodDeals/${id}`);
                setDeal(res.data);
            } catch (err) {
                setError('Failed to load offer.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDeal();

        if (isAuthenticated) {
            const checkSaved = async () => {
                try {
                    const res = await api.get<{ isSaved: boolean }>(`/User/saved-good-deals/${id}/check`);
                    setIsSaved(res.data.isSaved);
                } catch (e) {
                    // ignore
                }
            };
            checkSaved();
        }
    }, [id, isAuthenticated]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Безстроково';
        return new Date(dateStr).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const handleLike = () => {
        if (hasLiked) {
            setLikesCount(prev => prev - 1);
            setHasLiked(false);
        } else {
            setLikesCount(prev => prev + 1);
            setHasLiked(true);
            if (hasDisliked) {
                setDislikesCount(prev => prev - 1);
                setHasDisliked(false);
            }
        }
    };

    const handleDislike = () => {
        if (hasDisliked) {
            setDislikesCount(prev => prev - 1);
            setHasDisliked(false);
        } else {
            setDislikesCount(prev => prev + 1);
            setHasDisliked(true);
            if (hasLiked) {
                setLikesCount(prev => prev - 1);
                setHasLiked(false);
            }
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        try {
            if (isSaved) {
                await api.delete(`/User/saved-good-deals/${id}`);
                setIsSaved(false);
                setSaveCount(prev => prev - 1);
            } else {
                await api.post(`/User/saved-good-deals/${id}`);
                setIsSaved(true);
                setSaveCount(prev => prev + 1);
            }
        } catch (error) {
            alert('Не вдалося зберегти хорошу пропозицію.');
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setShareTooltip(true);
        setTimeout(() => setShareTooltip(false), 2000);
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-8 w-32 bg-zinc-200 dark:bg-zinc-700/50 rounded mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="h-96 w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-3xl" />
                        <div className="h-40 w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-3xl" />
                    </div>
                    <div className="space-y-6">
                        <div className="h-48 w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-3xl" />
                        <div className="h-64 w-full bg-zinc-200 dark:bg-zinc-700/50 rounded-3xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !deal) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Sparkles className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Good deal not found</h2>
                <p className="text-zinc-500 mb-6">{error}</p>
                <button onClick={() => navigate('/good-deals')} className="btn-primary">
                    Повернутися до списку
                </button>
            </div>
        );
    }

    const hasImages = deal.imageUrls && deal.imageUrls.length > 0;
    const now = new Date();
    const validToDate = deal.validTo ? new Date(deal.validTo) : null;
    const isExpired = validToDate && validToDate < now;
    const isExpiringSoon = validToDate && !isExpired && (validToDate.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate('/good-deals')}
                className="flex items-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors font-semibold gap-1 text-sm uppercase tracking-wider"
            >
                <ChevronLeft className="w-4 h-4" />
                <span>Назад</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: Main content cards */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. Image card */}
                    <div className="relative w-full h-80 sm:h-[480px] rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 group shadow-lg">
                        <img
                            src={hasImages ? deal.imageUrls[activeImage] : ''}
                            alt={deal.title}
                            className="w-full h-full object-cover transition-all duration-500"
                            onError={(e) => {
                                e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80";
                            }}
                        />

                        {/* Badges on image */}
                        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Хороша пропозиція
                            </span>

                            {isExpired ? (
                                <span className="bg-zinc-950/80 text-zinc-300 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                                    <span className="w-2 h-2 rounded-full bg-zinc-400" />
                                    Завершено
                                </span>
                            ) : isExpiringSoon ? (
                                <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                    Скоро завершується
                                </span>
                            ) : (
                                <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    Активна
                                </span>
                            )}
                        </div>

                        {/* Image navigation */}
                        {deal.imageUrls.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImage(prev => (prev - 1 + deal.imageUrls.length) % deal.imageUrls.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImage(prev => (prev + 1) % deal.imageUrls.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur-xs">
                                    {deal.imageUrls.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImage(i)}
                                            className={`w-2 h-2 rounded-full transition-all ${i === activeImage ? 'bg-emerald-400 w-5' : 'bg-white/60 hover:bg-white'}`}
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
                                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImage ? 'border-emerald-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 2. Text details card */}
                    <div className="glass-card p-6 sm:p-8 space-y-4">
                        {/* Category */}
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            <Tag className="w-4 h-4 text-emerald-500" />
                            <span className="uppercase tracking-wider">{deal.categoryName}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                            {deal.title}
                        </h1>

                        {/* Description */}
                        {deal.description && (
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-base whitespace-pre-wrap pt-2">
                                {deal.description}
                            </p>
                        )}
                    </div>

                    {/* 3. Action / Interactions card */}
                    <div className="glass-card p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all active:scale-95 ${
                                    isSaved 
                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-600 dark:text-emerald-400' 
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                }`}
                            >
                                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                                <span>Зберегти</span>
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-500">{saveCount}</span>
                            </button>

                            {/* Likes Container */}
                            <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <button
                                    onClick={handleLike}
                                    className={`inline-flex items-center justify-center p-2.5 transition-all ${
                                        hasLiked 
                                            ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' 
                                            : 'text-zinc-500 hover:text-emerald-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                    }`}
                                    aria-label="Подобається"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="ml-1.5 text-xs font-bold">{likesCount}</span>
                                </button>
                                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                                <button
                                    onClick={handleDislike}
                                    className={`inline-flex items-center justify-center p-2.5 transition-all ${
                                        hasDisliked 
                                            ? 'text-red-500 bg-red-50 dark:bg-red-950/20' 
                                            : 'text-zinc-500 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                    }`}
                                    aria-label="Не подобається"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span className="ml-1.5 text-xs font-bold">{dislikesCount}</span>
                                </button>
                            </div>
                        </div>

                        {/* Share Button */}
                        <div className="relative">
                            <button
                                onClick={handleShare}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl text-sm font-medium transition-all active:scale-95"
                            >
                                <Share2 className="w-4 h-4" />
                                <span>Поділитися</span>
                            </button>
                            {shareTooltip && (
                                <div className="absolute right-0 bottom-full mb-2 bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
                                    Посилання скопійовано!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Target Audiences card */}
                    {deal.targetAudiences && deal.targetAudiences.length > 0 && (
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-500" />
                                Для кого це буде корисно
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {deal.targetAudiences.map(a => (
                                    <AudienceBadge key={a} label={a} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Sidebar cards stack */}
                <div className="space-y-6">
                    
                    {/* 1. Main Action Button Card */}
                    {deal.isOnline && deal.offerUrl && (
                        <div className="glass-card p-6 space-y-4">
                            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                                <span>Посилання</span>
                                <Globe className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h4 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Онлайн</h4>
                            <a
                                href={deal.offerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <Globe className="w-4.5 h-4.5" />
                                Перейти на сайт
                            </a>
                        </div>
                    )}

                    {/* 2. Offer Details sidebar card */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-5 border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                            <Eye className="w-4.5 h-4.5 text-emerald-500" />
                            Деталі пропозиції
                        </h3>
                        
                        <div className="space-y-4.5">
                            {/* Status */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Статус</span>
                                </div>
                                <div className="text-sm font-medium">
                                    {isExpired ? (
                                        <span className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1.5">
                                            <XCircle className="w-3.5 h-3.5" /> Завершено
                                        </span>
                                    ) : (
                                        <span className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Активна
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <Tag className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Категорія</span>
                                </div>
                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{deal.categoryName}</span>
                            </div>

                            {/* Valid From */}
                            {deal.validFrom && (
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Діє з</span>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(deal.validFrom)}</span>
                                </div>
                            )}

                            {/* Valid To */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Діє до</span>
                                </div>
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(deal.validTo)}</span>
                            </div>

                            {/* Creator */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <User className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Додав</span>
                                </div>
                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {deal.creatorUserName || 'Користувач'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Store / Place sidebar card */}
                    <div className="glass-card p-6 space-y-5">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                            <MapPin className="w-4.5 h-4.5 text-emerald-500" />
                            Місце / Заклад
                        </h3>

                        <div className="space-y-4.5">
                            {/* Store Name */}
                            <div>
                                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Заклад</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{deal.storeName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                        deal.isOnline 
                                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        {deal.isOnline ? 'Онлайн' : 'Офлайн'}
                                    </span>
                                </div>
                            </div>

                            {/* About Store / Type */}
                            <div>
                                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Тип магазину</span>
                                </div>
                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {deal.isOnline ? 'Інтернет-платформа' : 'Фізична локація / заклад партнер'}
                                </span>
                            </div>
                        </div>

                        {/* Map Button for Physical places */}
                        {!deal.isOnline && deal.latitude && deal.longitude && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${deal.latitude},${deal.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95"
                            >
                                <MapPin className="w-4 h-4 text-emerald-500" />
                                <span>Показати на мапі</span>
                            </a>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
