import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    isOnline: boolean;
    storeName: string;
    storeDescription: string;
    offerUrl: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    imageUrls: string[];
}

interface Comment {
    id: number;
    author: string;
    text: string;
    createdAt: string;
    avatar: string;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80";

const MOCK_COMMENTS: Comment[] = [
    { id: 1, author: "Alex Marchenko", text: "Great deal! I bought this last week and was very satisfied with the quality.", createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), avatar: "AM" },
    { id: 2, author: "Olena Kovalchuk", text: "Still available? I'm going tomorrow to check it out.", createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), avatar: "OK" },
    { id: 3, author: "Roman Bilas", text: "The store is open on weekends too. Confirmed it yesterday!", createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), avatar: "RB" },
];

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function InfoRow({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: React.ReactNode; className?: string }) {
    return (
        <div className={`flex items-start gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 ${className ?? ''}`}>
            <span className="mt-0.5 text-primary-500 flex-shrink-0">{icon}</span>
            <div className="min-w-0">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
                <div className="text-sm font-semibold text-zinc-900 dark:text-white break-words">{value}</div>
            </div>
        </div>
    );
}

export default function SingleOfferPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [offer, setOffer] = useState<OfferDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Image gallery
    const [activeImg, setActiveImg] = useState(0);

    // Interaction counters (local state — backend endpoints can be wired later)
    const [saved, setSaved] = useState(false);
    const [saveCount, setSaveCount] = useState(47);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(124);
    const [disliked, setDisliked] = useState(false);
    const [dislikeCount, setDislikeCount] = useState(8);
    const [shareCopied, setShareCopied] = useState(false);

    // Comments
    const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS);
    const [commentText, setCommentText] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const commentInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const fetchOffer = async () => {
            setIsLoading(true);
            try {
                const res = await axios.get<OfferDetail>(`/api/Discounts/${id}`);
                setOffer(res.data);
            } catch {
                setError('Failed to load offer. It may have been removed or does not exist.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOffer();
    }, [id]);

    const handleSave = () => {
        setSaved(prev => !prev);
        setSaveCount(prev => saved ? prev - 1 : prev + 1);
    };

    const handleLike = () => {
        if (liked) {
            setLiked(false);
            setLikeCount(p => p - 1);
        } else {
            setLiked(true);
            setLikeCount(p => p + 1);
            if (disliked) { setDisliked(false); setDislikeCount(p => p - 1); }
        }
    };

    const handleDislike = () => {
        if (disliked) {
            setDisliked(false);
            setDislikeCount(p => p - 1);
        } else {
            setDisliked(true);
            setDislikeCount(p => p + 1);
            if (liked) { setLiked(false); setLikeCount(p => p - 1); }
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
        });
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setIsPostingComment(true);
        await new Promise(r => setTimeout(r, 600));
        const newComment: Comment = {
            id: Date.now(),
            author: "You",
            text: commentText.trim(),
            createdAt: new Date().toISOString(),
            avatar: "YO",
        };
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
        setIsPostingComment(false);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading offer...</p>
        </div>
    );

    if (error || !offer) return (
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold mb-2">Offer not found</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8">{error ?? 'This offer does not exist.'}</p>
            <button onClick={() => navigate('/offers')} className="btn-primary">Browse Offers</button>
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
                className="flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors group"
            >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── LEFT COLUMN ── */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* ── IMAGE GALLERY ── */}
                    <div className="glass-card overflow-hidden rounded-2xl">
                        <div className="relative aspect-[16/9] bg-zinc-100 dark:bg-zinc-800">
                            <img
                                src={images[activeImg]}
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
                                    {offer.isActive && !isExpired ? '● Active' : '● Expired'}
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
                                        <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.src = FALLBACK_IMAGE; }} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── TITLE & DESCRIPTION ── */}
                    <div className="glass-card p-6 rounded-2xl">
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

                    {/* ── INTERACTION BUTTONS ── */}
                    <div className="glass-card p-4 rounded-2xl">
                        <div className="flex flex-wrap items-center gap-3">

                            {/* Save */}
                            <button
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 border-2
                                    ${saved
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-400 text-amber-600 dark:text-amber-400'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-amber-400 hover:text-amber-500'
                                    }`}
                            >
                                <Bookmark className={`w-4.5 h-4.5 ${saved ? 'fill-amber-400' : ''}`} />
                                <span>{saved ? 'Saved' : 'Save'}</span>
                                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-md font-bold ${saved ? 'bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                    {saveCount}
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

                            {/* Like */}
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 border-2
                                    ${liked
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-600 dark:text-emerald-400'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-emerald-400 hover:text-emerald-500'
                                    }`}
                            >
                                <ThumbsUp className={`w-4.5 h-4.5 ${liked ? 'fill-emerald-400' : ''}`} />
                                <span className={`px-1.5 py-0.5 text-xs rounded-md font-bold ${liked ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                    {likeCount}
                                </span>
                            </button>

                            {/* Dislike */}
                            <button
                                onClick={handleDislike}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 border-2
                                    ${disliked
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-500 dark:text-red-400'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-red-400 hover:text-red-500'
                                    }`}
                            >
                                <ThumbsDown className={`w-4.5 h-4.5 ${disliked ? 'fill-red-400' : ''}`} />
                                <span className={`px-1.5 py-0.5 text-xs rounded-md font-bold ${disliked ? 'bg-red-100 dark:bg-red-800/40 text-red-500 dark:text-red-400' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}>
                                    {dislikeCount}
                                </span>
                            </button>

                            {/* Divider */}
                            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />

                            {/* Share */}
                            <button
                                onClick={handleShare}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-95 border-2
                                    ${shareCopied
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-600 dark:text-blue-400'
                                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-500'
                                    }`}
                            >
                                <Share2 className="w-4.5 h-4.5" />
                                <span>{shareCopied ? 'Copied!' : 'Share'}</span>
                            </button>

                            {/* Online offer link */}
                            {offer.isOnline && offer.offerUrl && (
                                <a
                                    href={offer.offerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-auto flex items-center gap-2 btn-primary text-sm py-2.5"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Go to Store
                                </a>
                            )}
                        </div>
                    </div>

                    {/* ── COMMENTS ── */}
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                            💬 Comments
                            <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">({comments.length})</span>
                        </h2>

                        {/* Post comment */}
                        <form onSubmit={handlePostComment} className="mb-6">
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                                    YO
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        ref={commentInputRef}
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="Share your thoughts about this offer..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none text-sm"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="submit"
                                            disabled={!commentText.trim() || isPostingComment}
                                            className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isPostingComment
                                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Posting...</>
                                                : <><Send className="w-4 h-4 mr-2" />Post</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Comment list */}
                        <div className="space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                                        {comment.avatar}
                                    </div>
                                    <div className="flex-1 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl px-4 py-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-semibold text-zinc-900 dark:text-white">{comment.author}</span>
                                            <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="flex flex-col gap-6">

                    {/* ── PRICING ── */}
                    <div className="glass-card p-6 rounded-2xl">
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
                            <p className="text-zinc-400 text-sm line-through mb-4">Was {offer.oldPrice.toFixed(2)} ₴</p>
                        )}
                        {offer.isOnline && offer.offerUrl ? (
                            <a href={offer.offerUrl} target="_blank" rel="noreferrer" className="btn-primary w-full text-center text-sm">
                                <ExternalLink className="w-4 h-4 mr-2" /> Get This Deal
                            </a>
                        ) : !offer.isOnline && offer.latitude && offer.longitude ? (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="btn-secondary w-full text-center text-sm"
                            >
                                <MapPin className="w-4 h-4 mr-2" /> View on Map
                            </a>
                        ) : null}
                    </div>

                    {/* ── OFFER DETAILS ── */}
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-base font-bold mb-2 text-zinc-900 dark:text-white">Offer Details</h2>
                        <div className="divide-y-0">
                            <InfoRow icon={<CheckCircle className="w-4 h-4" />} label="Status" value={
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${offer.isActive && !isExpired ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {offer.isActive && !isExpired ? '● Active' : '● Inactive'}
                                </span>
                            } />
                            <InfoRow icon={<Tag className="w-4 h-4" />} label="Category" value={offer.categoryName} />
                            <InfoRow icon={<Clock className="w-4 h-4" />} label="Valid From" value={formatDate(offer.validFrom)} />
                            <InfoRow icon={<XCircle className="w-4 h-4" />} label="Valid To" value={
                                <span className={isExpired ? 'text-red-500' : ''}>{formatDate(offer.validTo)}</span>
                            } />
                            <InfoRow icon={<Zap className="w-4 h-4" />} label="Creator" value={offer.creator === 'User' ? '👤 User submitted' : '🤖 Auto-parsed'} />
                            <InfoRow icon={<Calendar className="w-4 h-4" />} label="Created At" value={formatDate(offer.createdAt)} />
                            {offer.createdById && (
                                <InfoRow icon={<User className="w-4 h-4" />} label="Created By" value={`User #${offer.createdById}`} />
                            )}
                        </div>
                    </div>

                    {/* ── PLACE / STORE ── */}
                    <div className="glass-card p-6 rounded-2xl">
                        <h2 className="text-base font-bold mb-2 text-zinc-900 dark:text-white">Store / Place</h2>
                        <div>
                            <InfoRow
                                icon={offer.isOnline ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                                label="Store"
                                value={
                                    <span className="flex items-center gap-2">
                                        {offer.storeName}
                                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${offer.isOnline ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                            {offer.isOnline ? 'Online' : 'Physical'}
                                        </span>
                                    </span>
                                }
                            />
                            {offer.storeDescription && (
                                <InfoRow icon={<Tag className="w-4 h-4" />} label="About Store" value={offer.storeDescription} />
                            )}
                            {!offer.isOnline && offer.address && (
                                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={offer.address} />
                            )}
                            {offer.isOnline && offer.offerUrl && (
                                <InfoRow icon={<Globe className="w-4 h-4" />} label="Website" value={
                                    <a href={offer.offerUrl} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-600 underline underline-offset-2 truncate block max-w-full">
                                        {offer.offerUrl}
                                    </a>
                                } />
                            )}
                        </div>

                        {/* Mini map link */}
                        {!offer.isOnline && offer.latitude && offer.longitude && (
                            <a
                                href={`/map?lat=${offer.latitude}&lng=${offer.longitude}`}
                                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:border-primary-400 hover:text-primary-500 transition-all"
                            >
                                <MapPin className="w-4 h-4" /> Open on Map
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
