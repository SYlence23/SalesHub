import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft, ChevronRight, Bookmark, ThumbsUp, ThumbsDown, Share2,
    MapPin, Globe, Tag, Clock, CheckCircle2, XCircle, User, Calendar,
    Send, Loader2, ExternalLink, Eye
} from 'lucide-react';

interface OfferDetail {
    id: number;
    title: string;
    description: string;
    isActive: boolean;
    categoryName: string;
    newPrice: number;
    oldPrice?: number;
    validFrom?: string;
    validTo?: string;
    createdAt: string;
    creator: string;
    createdById?: number;
    createdByName?: string;
    isOnline: boolean;
    storeName: string;
    storeDescription: string;
    offerUrl: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    imageUrls: string[];
    saveCount: number;
    likeCount: number;
    dislikeCount: number;
}

interface Comment {
    id: number;
    author: string;
    text: string;
    createdAt: string;
    avatar: string;
    isRecommended: boolean;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80";

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Безстроково';
    return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'щойно';
    if (mins < 60) return `${mins} хв тому`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} год тому`;
    return `${Math.floor(hrs / 24)} дн тому`;
}

export default function SingleOfferPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, firstName, lastName } = useAuth();
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();

    const [offer, setOffer] = useState<OfferDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Image gallery
    const [activeImg, setActiveImg] = useState(0);

    // Interaction counters (local state for optimistic UI)
    const [saved, setSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(0);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(0);
    const [shareCopied, setShareCopied] = useState(false);

    // Comments
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchOfferAndInteractions = async () => {
            setIsLoading(true);
            try {
                const res = await api.get<OfferDetail>(`/Discounts/${id}`);
                setOffer(res.data);
                setSaveCount(res.data.saveCount);
                setLikeCount(res.data.likeCount);
                setDislikeCount(res.data.dislikeCount);
            } catch {
                setError('Не вдалося завантажити пропозицію. Можливо, її було видалено або вона не існує.');
                setIsLoading(false);
                return;
            }

            try {
                const reviewsRes = await api.get<Comment[]>(`/Discounts/${id}/reviews`);
                setComments(reviewsRes.data);
            } catch (e) {
                console.error("Error fetching reviews", e);
            }

            if (isAuthenticated) {
                try {
                    const savedRes = await api.get<{ isSaved: boolean }>(`/User/saved-offers/${id}/check`);
                    setSaved(savedRes.data.isSaved);
                } catch (e) {
                    console.error("Error checking saved status", e);
                }

                try {
                    const reviewRes = await api.get<{ hasReview: boolean, isRecommended: boolean, comment: string }>(`/Discounts/${id}/review/check`);
                    if (reviewRes.data.hasReview) {
                        setLiked(reviewRes.data.isRecommended === true);
                        setDisliked(reviewRes.data.isRecommended === false);
                    }
                } catch (e) {
                    console.error("Error checking review status", e);
                }
            }

            setIsLoading(false);
        };
        fetchOfferAndInteractions();
    }, [id, isAuthenticated, fullName, firstName]);

    const handleSave = async () => {
        if (!isAuthenticated) return navigate('/login');

        const previousState = saved;
        setSaved(!previousState);
        setSaveCount(prev => previousState ? prev - 1 : prev + 1);

        try {
            if (previousState) {
                await api.delete(`/User/saved-offers/${id}`);
            } else {
                await api.post(`/User/saved-offers/${id}`);
            }
        } catch (err) {
            setSaved(previousState);
            setSaveCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return navigate('/login');

        const wasLiked = liked;
        const wasDisliked = disliked;

        setLiked(!wasLiked);
        setLikeCount(prev => wasLiked ? prev - 1 : prev + 1);
        if (wasDisliked) {
            setDisliked(false);
            setDislikeCount(prev => prev - 1);
        }

        try {
            await api.post(`/Discounts/${id}/reviews`, {
                isRecommended: !wasLiked,
                comment: null
            });
        } catch (err) {
            setLiked(wasLiked);
            setDisliked(wasDisliked);
            setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
            if (wasDisliked) setDislikeCount(prev => prev + 1);
        }
    };

    const handleDislike = async () => {
        if (!isAuthenticated) return navigate('/login');

        const wasDisliked = disliked;
        const wasLiked = liked;

        setDisliked(!wasDisliked);
        setDislikeCount(prev => wasDisliked ? prev - 1 : prev + 1);
        if (wasLiked) {
            setLiked(false);
            setLikeCount(prev => prev - 1);
        }

        try {
            await api.post(`/Discounts/${id}/reviews`, {
                isRecommended: false,
                comment: null
            });
        } catch (err) {
            setDisliked(wasDisliked);
            setLiked(wasLiked);
            setDislikeCount(prev => wasDisliked ? prev + 1 : prev - 1);
            if (wasLiked) setLikeCount(prev => prev + 1);
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
        });
    };

    const handlePostComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');
        if (!commentText.trim()) return;

        setIsPostingComment(true);
        try {
            const res = await api.post<Comment>(`/Discounts/${id}/reviews`, {
                isRecommended: liked,
                comment: commentText.trim()
            });
            setComments(prev => [res.data, ...prev]);
            setCommentText('');
        } catch (err) {
            console.error("Failed to post comment", err);
        } finally {
            setIsPostingComment(false);
        }
    };

    // ── Loading skeleton (same style as GoodDealDetailsPage) ──
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

    // ── Error state ──
    if (error || !offer) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <Tag className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Знижку не знайдено</h2>
                <p className="text-zinc-500 mb-6">{error ?? 'Можливо її було видалено або вона не існує.'}</p>
                <button onClick={() => navigate('/offers')} className="btn-primary">
                    Повернутися до списку
                </button>
            </div>
        );
    }

    const images = offer.imageUrls?.length > 0 ? offer.imageUrls : [FALLBACK_IMAGE];
    const discount = offer.oldPrice && offer.oldPrice > 0
        ? Math.round(((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100)
        : 0;
    const now = new Date();
    const validToDate = offer.validTo ? new Date(offer.validTo) : null;
    const isExpired = validToDate && validToDate < now;
    const isExpiringSoon = validToDate && !isExpired && (validToDate.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
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
                            src={images[activeImg].startsWith('http') ? images[activeImg] : `https://localhost:7094${images[activeImg]}`}
                            alt={offer.title}
                            className="w-full h-full object-cover transition-all duration-500"
                            onError={e => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        />

                        {/* Badges on image */}
                        <div className="absolute top-5 left-5 flex flex-wrap gap-2">
                            {discount > 0 && (
                                <span className="bg-gradient-to-r from-red-600 to-red-400 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5">
                                    -{discount}%
                                </span>
                            )}

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
                                <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    Активна
                                </span>
                            )}
                        </div>

                        {/* Image navigation arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setActiveImg(i => (i + 1) % images.length)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 shadow-md"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/35 px-3 py-1.5 rounded-full backdrop-blur-xs">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActiveImg(i)}
                                            className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-primary-400 w-5' : 'bg-white/60 hover:bg-white'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img.startsWith('http') ? img : `https://localhost:7094${img}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 2. Text details card */}
                    <div className="glass-card p-6 sm:p-8 space-y-4">
                        {/* Category */}
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400">
                            <Tag className="w-4 h-4 text-primary-500" />
                            <span className="uppercase tracking-wider">{offer.categoryName}</span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                            {offer.title}
                        </h1>

                        {/* Description */}
                        {offer.description && (
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-base whitespace-pre-wrap pt-2">
                                {offer.description}
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
                                    saved
                                        ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-400 text-primary-600 dark:text-primary-400'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                }`}
                            >
                                <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                                <span>Зберегти</span>
                                <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs text-zinc-500">{saveCount}</span>
                            </button>

                            {/* Likes Container */}
                            <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                                <button
                                    onClick={handleLike}
                                    className={`inline-flex items-center justify-center p-2.5 transition-all ${
                                        liked
                                            ? 'text-primary-500 bg-primary-50 dark:bg-primary-950/20'
                                            : 'text-zinc-500 hover:text-primary-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                    }`}
                                    aria-label="Подобається"
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="ml-1.5 text-xs font-bold">{likeCount}</span>
                                </button>
                                <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                                <button
                                    onClick={handleDislike}
                                    className={`inline-flex items-center justify-center p-2.5 transition-all ${
                                        disliked
                                            ? 'text-red-500 bg-red-50 dark:bg-red-950/20'
                                            : 'text-zinc-500 hover:text-red-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                                    }`}
                                    aria-label="Не подобається"
                                >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span className="ml-1.5 text-xs font-bold">{dislikeCount}</span>
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
                            {shareCopied && (
                                <div className="absolute right-0 bottom-full mb-2 bg-zinc-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap animate-fade-in">
                                    Посилання скопійовано!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. Comments card */}
                    <div className="glass-card p-6 sm:p-8 space-y-6">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                            💬 Відгуки та коментарі
                            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({comments.length})</span>
                        </h3>

                        {/* Post comment */}
                        <form onSubmit={handlePostComment}>
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                                    {isAuthenticated ? (firstName?.substring(0, 2).toUpperCase() || 'YO') : 'YO'}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder={isAuthenticated ? "Поділіться своїми враженнями про цю знижку..." : "Увійдіть в систему, щоб залишити коментар..."}
                                        disabled={!isAuthenticated}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm disabled:opacity-60"
                                    />
                                    <div className="flex justify-between items-center mt-2 gap-4">
                                        <div className="text-xs text-red-500 font-medium">
                                            {isAuthenticated && !liked && !disliked && (
                                                <span>* Будь ласка, оберіть «Рекомендую» або «Не рекомендую» перед надсиланням коментаря</span>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || isPostingComment || !isAuthenticated || (!liked && !disliked)}
                                            className="bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-sm flex-shrink-0"
                                        >
                                            {isPostingComment
                                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Надсилання...</>
                                                : <><Send className="w-4 h-4 mr-2" />Надіслати</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Comment list */}
                        <div className="space-y-4">
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3 group">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                            {comment.avatar}
                                        </div>
                                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-4 py-3 border border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                                    {comment.author}
                                                    {comment.isRecommended !== null && (
                                                        <span className="text-xs font-medium">
                                                            {comment.isRecommended ? (
                                                                <span className="text-emerald-500 flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Рекомендує</span>
                                                            ) : (
                                                                <span className="text-red-500 flex items-center gap-1"><ThumbsDown className="w-3 h-3" /> Не рекомендує</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-6 text-zinc-500 dark:text-zinc-400 text-sm">
                                    Коментарів ще немає. Будьте першим, хто поділиться своєю думкою!
                                </p>
                            )}
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN: Sidebar cards stack */}
                <div className="space-y-6">

                    {/* 1. Pricing card */}
                    <div className="glass-card p-6 space-y-4 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold">
                            <span>Ціна</span>
                            <Tag className="w-4 h-4 text-primary-500" />
                        </div>

                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                                {offer.newPrice.toFixed(2)}
                                <span className="text-2xl ml-1">₴</span>
                            </span>
                            {discount > 0 && (
                                <span className="mb-1.5 bg-red-100 dark:bg-red-900/30 text-red-500 text-sm font-bold px-2.5 py-0.5 rounded-lg">
                                    -{discount}%
                                </span>
                            )}
                        </div>

                        {offer.oldPrice && offer.oldPrice > 0 && (
                            <p className="text-zinc-400 text-sm line-through">Було {offer.oldPrice.toFixed(2)} ₴</p>
                        )}

                        {offer.isOnline && offer.offerUrl ? (
                            <a
                                href={offer.offerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-white bg-primary-500 hover:bg-primary-600 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                <ExternalLink className="w-4.5 h-4.5" />
                                Отримати знижку
                            </a>
                        ) : !offer.isOnline && offer.latitude && offer.longitude ? (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all active:scale-95"
                            >
                                <MapPin className="w-4.5 h-4.5" />
                                Показати на карті
                            </a>
                        ) : null}
                    </div>

                    {/* 2. Offer Details sidebar card */}
                    <div className="glass-card p-6 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-5 border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                            <Eye className="w-4.5 h-4.5 text-primary-500" />
                            Деталі акції
                        </h3>

                        <div className="space-y-4.5">
                            {/* Status */}
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                                    <span>Статус</span>
                                </div>
                                <div className="text-sm font-medium">
                                    {isExpired ? (
                                        <span className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1.5">
                                            <XCircle className="w-3.5 h-3.5" /> Завершено
                                        </span>
                                    ) : (
                                        <span className="text-primary-500 dark:text-primary-400 font-bold flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" /> Активна
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Category */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <Tag className="w-4 h-4 text-primary-500 shrink-0" />
                                    <span>Категорія</span>
                                </div>
                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{offer.categoryName}</span>
                            </div>

                            {/* Valid From */}
                            {offer.validFrom && (
                                <div className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        <Clock className="w-4 h-4 text-primary-500 shrink-0" />
                                        <span>Діє з</span>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{formatDate(offer.validFrom)}</span>
                                </div>
                            )}

                            {/* Valid To */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <Calendar className="w-4 h-4 text-primary-500 shrink-0" />
                                    <span>Діє до</span>
                                </div>
                                <span className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{formatDate(offer.validTo)}</span>
                            </div>

                            {/* Creator */}
                            <div className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    <User className="w-4 h-4 text-primary-500 shrink-0" />
                                    <span>Додав</span>
                                </div>
                                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                                    {offer.createdByName || `Користувач #${offer.createdById}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Store / Place sidebar card */}
                    <div className="glass-card p-6 space-y-5 hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3 flex items-center gap-2">
                            <MapPin className="w-4.5 h-4.5 text-primary-500" />
                            Місце / Заклад
                        </h3>

                        <div className="space-y-4.5">
                            {/* Store Name */}
                            <div>
                                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                    <span>Заклад</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{offer.storeName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                        offer.isOnline
                                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                                            : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400'
                                    }`}>
                                        {offer.isOnline ? 'Онлайн' : 'Офлайн'}
                                    </span>
                                </div>
                            </div>

                            {/* Address */}
                            {offer.address && !offer.isOnline && (
                                <div>
                                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-primary-500" />
                                        <span>Адреса</span>
                                    </div>
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {offer.address}
                                    </span>
                                </div>
                            )}

                            {/* About Store */}
                            {offer.storeDescription && (
                                <div>
                                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-primary-500" />
                                        <span>Про заклад</span>
                                    </div>
                                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-line">
                                        {offer.storeDescription}
                                    </p>
                                </div>
                            )}

                            {/* Website */}
                            {offer.offerUrl && (
                                <div>
                                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Globe className="w-3.5 h-3.5 text-primary-500" />
                                        <span>Сайт</span>
                                    </div>
                                    <a href={offer.offerUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-500 hover:text-primary-600 underline underline-offset-2 flex items-center gap-1.5 truncate font-semibold">
                                        <Globe className="w-4 h-4 flex-shrink-0" />
                                        <span>{offer.storeName}</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Map Button for Physical places */}
                        {!offer.isOnline && offer.latitude && offer.longitude && (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-sm font-bold text-zinc-700 dark:text-zinc-300 transition-all active:scale-95"
                            >
                                <MapPin className="w-4 h-4 text-primary-500" />
                                <span>Показати на мапі</span>
                            </a>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
