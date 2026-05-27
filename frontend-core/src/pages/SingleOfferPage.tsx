import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft, ChevronRight, Bookmark, ThumbsUp, ThumbsDown, Share2,
    MapPin, Globe, Tag, Clock, CheckCircle, XCircle, User, Calendar,
    Send, Loader2, ExternalLink, Zap
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
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric' });
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

function InfoRow({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${className ?? ''}`}>
            <span className="mt-0.5 text-primary-500 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
                <div className="text-sm font-bold text-zinc-900 dark:text-white break-words">{value}</div>
            </div>
        </div>
    );
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
                // Fetch Offer Details
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

            // Fetch Reviews/Comments — окремо, щоб помилка не блокувала сторінку
            try {
                const reviewsRes = await api.get<Comment[]>(`/Discounts/${id}/reviews`);
                setComments(reviewsRes.data);
            } catch (e) {
                console.error("Error fetching reviews", e);
            }

            // If authenticated, check saved and review status
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
            // Revert on failure
            setSaved(previousState);
            setSaveCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    const handleLike = async () => {
        if (!isAuthenticated) return navigate('/login');

        const wasLiked = liked;
        const wasDisliked = disliked;

        // Optimistic UI update
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
            // Revert
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

        // Optimistic UI update
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
            // Revert
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
                isRecommended: liked, // retain current recommendation status
                comment: commentText.trim()
            });

            // Update comments list
            setComments(prev => [res.data, ...prev]);
            setCommentText('');
        } catch (err) {
            console.error("Failed to post comment", err);
        } finally {
            setIsPostingComment(false);
        }
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Завантаження пропозиції...</p>
        </div>
    );

    if (error || !offer) return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold mb-2 text-zinc-900 dark:text-white">Знижку не знайдено</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">{error ?? 'Ця пропозиція не існує або була видалена.'}</p>
            <button onClick={() => navigate('/offers')} className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2.5 rounded-xl transition-colors font-bold">
                Переглянути інші пропозиції
            </button>
        </div>
    );

    const images = offer.imageUrls?.length > 0 ? offer.imageUrls : [FALLBACK_IMAGE];
    const discount = offer.oldPrice && offer.oldPrice > 0
        ? Math.round(((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100)
        : 0;
    const isExpired = offer.validTo ? new Date(offer.validTo) < new Date() : false;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors group font-semibold"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                Назад
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* ── IMAGE GALLERY ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden rounded-2xl">
                        <div className="relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-800">
                            <img
                                src={images[activeImg].startsWith('http') ? images[activeImg] : `https://localhost:7094${images[activeImg]}`}
                                alt={offer.title}
                                className="w-full h-full object-cover transition-opacity duration-300"
                                onError={e => { e.currentTarget.src = FALLBACK_IMAGE; }}
                            />
                            {/* Badges overlay */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                {discount > 0 && (
                                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                                        -{discount}%
                                    </span>
                                )}
                                <span className={`text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg ${offer.isActive && !isExpired ? 'bg-emerald-500' : 'bg-zinc-500'}`}>
                                    {offer.isActive && !isExpired ? '● Активна' : '● Завершилась'}
                                </span>
                            </div>
                            {/* Image nav arrows */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setActiveImg(i => (i - 1 + images.length) % images.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setActiveImg(i => (i + 1) % images.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>
                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 p-3 overflow-x-auto">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImg(i)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-primary-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-90'}`}
                                    >
                                        <img src={img.startsWith('http') ? img : `https://localhost:7094${img}`} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── TITLE & DESCRIPTION ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                                <p className="text-sm font-semibold text-primary-500 mb-1 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5" />
                                    {offer.categoryName}
                                </p>
                                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
                                    {offer.title}
                                </h1>
                            </div>
                        </div>

                        {offer.description && (
                            <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm mt-4 whitespace-pre-line">
                                {offer.description}
                            </p>
                        )}
                    </div>

                    {/* ── FEEDBACK & COMMENTS (Unified at the bottom) ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-5 mb-6 gap-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                💬 Відгуки та коментарі
                                <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({comments.length})</span>
                            </h2>
                            
                            {/* Like / Dislike / Save / Share Buttons */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Like */}
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border
                                        ${liked
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-600 dark:text-emerald-400'
                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 hover:text-emerald-500'
                                        }`}
                                >
                                    <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-emerald-400' : ''}`} />
                                    <span>Рекомендую</span>
                                    <span className="font-bold ml-0.5">{likeCount}</span>
                                </button>

                                {/* Dislike */}
                                <button
                                    onClick={handleDislike}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border
                                        ${disliked
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-500 dark:text-red-400'
                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-500'
                                        }`}
                                >
                                    <ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-red-400' : ''}`} />
                                    <span>Не рекомендую</span>
                                    <span className="font-bold ml-0.5">{dislikeCount}</span>
                                </button>

                                {/* Save */}
                                <button
                                    onClick={handleSave}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border
                                        ${saved
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-600 dark:text-amber-400'
                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-400 hover:text-amber-500'
                                        }`}
                                >
                                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-400' : ''}`} />
                                    <span>{saved ? 'Збережено' : 'Зберегти'}</span>
                                    <span className="font-bold ml-0.5">{saveCount}</span>
                                </button>

                                {/* Share */}
                                <button
                                    onClick={handleShare}
                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs transition-all active:scale-95 border
                                        ${shareCopied
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600 dark:text-blue-400'
                                            : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-500'
                                        }`}
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>{shareCopied ? 'Скопійовано!' : 'Поділитись'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Post comment */}
                        <form onSubmit={handlePostComment} className="mb-6">
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

                {/* ── RIGHT COLUMN ── */}
                <div className="flex flex-col gap-6">

                    {/* ── PRICING ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl">
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                                {offer.newPrice.toFixed(2)}
                                <span className="text-2xl ml-1">₴</span>
                            </span>
                            {discount > 0 && (
                                <span className="mb-1 bg-red-100 dark:bg-red-900/30 text-red-500 text-sm font-bold px-2 py-0.5 rounded-lg">
                                    -{discount}%
                                </span>
                            )}
                        </div>
                        {offer.oldPrice && offer.oldPrice > 0 && (
                            <p className="text-zinc-400 text-sm line-through mb-4">Було {offer.oldPrice.toFixed(2)} ₴</p>
                        )}
                        {offer.isOnline && offer.offerUrl ? (
                            <a href={offer.offerUrl} target="_blank" rel="noreferrer" className="bg-primary-500 hover:bg-primary-600 text-white rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors font-bold w-full text-center text-sm shadow-sm">
                                <ExternalLink className="w-4 h-4 mr-2" /> Отримати знижку
                            </a>
                        ) : !offer.isOnline && offer.latitude && offer.longitude ? (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl px-4 py-2.5 flex items-center justify-center transition-colors font-bold w-full text-center text-sm"
                            >
                                <MapPin className="w-4 h-4 mr-2" /> Показати на карті
                            </a>
                        ) : null}
                    </div>

                    {/* ── DETAILED PLACE / STORE INFO (Add info on the side) ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl">
                        <h2 className="text-base font-bold mb-4 text-zinc-900 dark:text-white flex items-center gap-2">
                            🏪 Інформація про заклад
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Назва</p>
                                <div className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    {offer.storeName}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${offer.isOnline ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
                                        {offer.isOnline ? 'Онлайн' : 'Фізичний'}
                                    </span>
                                </div>
                            </div>

                            {offer.address && !offer.isOnline && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Адреса</p>
                                    <div className="text-sm text-zinc-800 dark:text-zinc-200 flex items-start gap-1.5 font-medium leading-relaxed">
                                        <MapPin className="w-4.5 h-4.5 text-primary-500 flex-shrink-0 mt-0.5" />
                                        <span>{offer.address}</span>
                                    </div>
                                </div>
                            )}

                            {offer.storeDescription && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Про заклад</p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line font-medium">
                                        {offer.storeDescription}
                                    </p>
                                </div>
                            )}

                            {offer.offerUrl && (
                                <div>
                                    <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Джерело / Сайт</p>
                                    <a href={offer.offerUrl} target="_blank" rel="noreferrer" className="text-sm text-primary-500 hover:text-primary-600 underline underline-offset-2 flex items-center gap-1.5 truncate font-semibold">
                                        <Globe className="w-4 h-4 flex-shrink-0" />
                                        <span>{offer.storeName} Website</span>
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Mini map link */}
                        {!offer.isOnline && offer.latitude && offer.longitude && (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50/50 dark:hover:bg-primary-950/20 transition-all active:scale-98 shadow-xs"
                            >
                                <MapPin className="w-4 h-4 text-primary-500" />
                                <span>Показати на карті</span>
                            </a>
                        )}
                    </div>

                    {/* ── OFFER DETAILS ── */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 rounded-2xl">
                        <h2 className="text-base font-bold mb-4 text-zinc-900 dark:text-white">Деталі акції</h2>
                        <div className="divide-y-0 space-y-1">
                            <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="Статус" value={
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${offer.isActive && !isExpired ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {offer.isActive && !isExpired ? '● Активна' : '● Завершилась'}
                                </span>
                            } />
                            <InfoRow icon={<Tag className="w-4 h-4" />} label="Категорія" value={offer.categoryName} />
                            <InfoRow icon={<Clock className="w-4 h-4" />} label="Початок акції" value={formatDate(offer.validFrom)} />
                            <InfoRow icon={<XCircle className="w-4 h-4" />} label="Кінець акції" value={
                                <span className={isExpired ? 'text-red-500' : ''}>{formatDate(offer.validTo)}</span>
                            } />
                            <InfoRow icon={<Zap className="w-4 h-4" />} label="Джерело" value={offer.creator === 'User' ? '👤 Додано користувачем' : '🤖 Авто-парсер'} />
                            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Дата публікації" value={formatDate(offer.createdAt)} />
                            {(offer.createdByName || offer.createdById) && (
                                <InfoRow icon={<User className="w-4 h-4" />} label="Автор публікації" value={offer.createdByName || `Користувач #${offer.createdById}`} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
