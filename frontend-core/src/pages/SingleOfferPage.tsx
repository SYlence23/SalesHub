import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Bookmark, ThumbsUp, ThumbsDown, Share2,
  CheckCircle, XCircle, Tag, MapPin, Calendar, User,
  Hash, Store, Clock, MessageCircle, Send, ChevronLeft,
  ChevronRight, ExternalLink, Info, Loader2
} from 'lucide-react';

interface OfferDetail {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  newPrice: number;
  oldPrice: number | null;
  validFrom: string | null;
  validTo: string | null;
  creator: string;
  categoryName: string;
  createdAt: string;
  isOnline: boolean;
  storeName: string;
  offerUrl: string;
  latitude: number | null;
  longitude: number | null;
  imageUrls: string[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  avatar: string;
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getKey(offerId: number | string, suffix: string) {
  return `offer_${offerId}_${suffix}`;
}

function initCount(offerId: number | string, suffix: string, fallback: number) {
  const raw = localStorage.getItem(getKey(offerId, suffix));
  return raw !== null ? parseInt(raw, 10) : fallback;
}

function saveCount(offerId: number | string, suffix: string, value: number) {
  localStorage.setItem(getKey(offerId, suffix), value.toString());
}

function initBool(offerId: number | string, suffix: string) {
  return localStorage.getItem(getKey(offerId, suffix)) === 'true';
}

function saveBool(offerId: number | string, suffix: string, value: boolean) {
  localStorage.setItem(getKey(offerId, suffix), value.toString());
}

export default function SingleOfferPage() {
  const { id } = useParams<{ id: string }>();
  const [offer, setOffer] = useState<OfferDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);

  // Interaction states
  const [saved, setSaved] = useState(false);
  const [saveCount_, setSaveCount_] = useState(0);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const commentEndRef = useRef<HTMLDivElement>(null);

  // Load offer
  useEffect(() => {
    const fetch_ = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get<OfferDetail>(`/api/Discounts/${id}`);
        setOffer(res.data);
        // init persisted states
        setSaved(initBool(id!, 'saved'));
        setSaveCount_(initCount(id!, 'saveCount', Math.floor(Math.random() * 80) + 10));
        setLiked(initBool(id!, 'liked'));
        setDisliked(initBool(id!, 'disliked'));
        setLikeCount(initCount(id!, 'likeCount', Math.floor(Math.random() * 120) + 20));
        setDislikeCount(initCount(id!, 'dislikeCount', Math.floor(Math.random() * 30) + 2));
        const stored = localStorage.getItem(getKey(id!, 'comments'));
        setComments(stored ? JSON.parse(stored) : []);
      } catch {
        setError('Could not load offer. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetch_();
  }, [id]);

  // Persist comments
  useEffect(() => {
    if (id && comments.length >= 0) {
      localStorage.setItem(getKey(id, 'comments'), JSON.stringify(comments));
    }
  }, [comments, id]);

  const handleSave = () => {
    const next = !saved;
    setSaved(next);
    saveBool(id!, 'saved', next);
    const nc = saveCount_ + (next ? 1 : -1);
    setSaveCount_(nc);
    saveCount(id!, 'saveCount', nc);
  };

  const handleLike = () => {
    if (liked) {
      // undo like
      const nl = likeCount - 1;
      setLiked(false); setLikeCount(nl);
      saveBool(id!, 'liked', false); saveCount(id!, 'likeCount', nl);
    } else {
      // like; remove dislike if active
      const nl = likeCount + 1;
      setLiked(true); setLikeCount(nl);
      saveBool(id!, 'liked', true); saveCount(id!, 'likeCount', nl);
      if (disliked) {
        const nd = dislikeCount - 1;
        setDisliked(false); setDislikeCount(nd);
        saveBool(id!, 'disliked', false); saveCount(id!, 'dislikeCount', nd);
      }
    }
  };

  const handleDislike = () => {
    if (disliked) {
      const nd = dislikeCount - 1;
      setDisliked(false); setDislikeCount(nd);
      saveBool(id!, 'disliked', false); saveCount(id!, 'dislikeCount', nd);
    } else {
      const nd = dislikeCount + 1;
      setDisliked(true); setDislikeCount(nd);
      saveBool(id!, 'disliked', true); saveCount(id!, 'dislikeCount', nd);
      if (liked) {
        const nl = likeCount - 1;
        setLiked(false); setLikeCount(nl);
        saveBool(id!, 'liked', false); saveCount(id!, 'likeCount', nl);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const avatarSeed = commentAuthor.trim() || 'Anonymous';
    const newComment: Comment = {
      id: Date.now().toString(),
      author: avatarSeed,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=f97316`
    };
    setComments(prev => [...prev, newComment]);
    setCommentText('');
    setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const images = offer?.imageUrls && offer.imageUrls.length > 0
    ? offer.imageUrls
    : [FALLBACK_IMG];

  const discount = offer && offer.oldPrice && offer.oldPrice > 0
    ? Math.round(((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <XCircle className="w-16 h-16 text-red-400" />
        <h2 className="text-2xl font-bold">{error || 'Offer not found'}</h2>
        <Link to="/offers" className="btn-primary">← Back to offers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <Link to="/offers" className="inline-flex items-center gap-2 text-zinc-500 hover:text-primary-500 transition-colors font-medium group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Offers
      </Link>

      {/* Main card */}
      <div className="glass-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">

          {/* ── Image Gallery ── */}
          <div className="relative bg-zinc-100 dark:bg-zinc-800 min-h-72 lg:min-h-[480px]">
            <img
              src={images[imgIdx]}
              alt={offer.title}
              className="w-full h-full object-cover"
              style={{ minHeight: '320px', maxHeight: '480px' }}
              onError={e => { e.currentTarget.src = FALLBACK_IMG; }}
            />
            {discount > 0 && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                -{discount}%
              </div>
            )}
            <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${offer.isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-500 text-white'}`}>
              {offer.isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {offer.isActive ? 'Active' : 'Inactive'}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Offer Details ── */}
          <div className="p-6 lg:p-8 flex flex-col gap-5">
            {/* Category + Store */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                <Tag className="w-3 h-3" /> {offer.categoryName}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                <Store className="w-3 h-3" /> {offer.storeName}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold text-zinc-900 dark:text-white leading-tight">
              {offer.title}
            </h1>

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                {offer.newPrice.toFixed(2)} ₴
              </span>
              {offer.oldPrice && offer.oldPrice > 0 && (
                <span className="text-xl text-zinc-400 line-through mb-0.5">
                  {offer.oldPrice.toFixed(2)} ₴
                </span>
              )}
            </div>

            {/* Description */}
            {offer.description && (
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed text-sm">
                {offer.description}
              </p>
            )}

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <MetaItem icon={<User className="w-4 h-4" />} label="Creator" value={offer.creator} />
              <MetaItem icon={<Clock className="w-4 h-4" />} label="Created At" value={formatDate(offer.createdAt)} />
              <MetaItem icon={<Calendar className="w-4 h-4" />} label="Valid From" value={formatDate(offer.validFrom)} />
              <MetaItem icon={<Calendar className="w-4 h-4" />} label="Valid To" value={formatDate(offer.validTo)} />
            </div>

            {/* Online store link */}
            {offer.isOnline && offer.offerUrl && (
              <a
                href={offer.offerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary gap-2 self-start"
              >
                <ExternalLink className="w-4 h-4" /> Visit Store
              </a>
            )}

            {/* ── Action Buttons ── */}
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
              {/* Save */}
              <ActionButton
                id="btn-save"
                onClick={handleSave}
                active={saved}
                activeClass="bg-primary-500 text-white"
                inactiveClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                icon={<Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />}
                label="Save"
                count={saveCount_}
              />

              {/* Like */}
              <ActionButton
                id="btn-like"
                onClick={handleLike}
                active={liked}
                activeClass="bg-emerald-500 text-white"
                inactiveClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                icon={<ThumbsUp className={`w-4 h-4 ${liked ? 'fill-white' : ''}`} />}
                label="Like"
                count={likeCount}
              />

              {/* Dislike */}
              <ActionButton
                id="btn-dislike"
                onClick={handleDislike}
                active={disliked}
                activeClass="bg-red-500 text-white"
                inactiveClass="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                icon={<ThumbsDown className={`w-4 h-4 ${disliked ? 'fill-white' : ''}`} />}
                label="Dislike"
                count={dislikeCount}
              />

              {/* Share */}
              <button
                id="btn-share"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all active:scale-95 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Share2 className="w-4 h-4" />
                {shareCopied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Full Data Table ── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-primary-500" /> Full Offer Data
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="text-left py-2 pr-6 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Field</th>
                <th className="text-left py-2 font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-xs">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {[
                { field: 'Title', value: offer.title },
                { field: 'Description', value: offer.description || '—' },
                { field: 'IsActive', value: offer.isActive ? '✅ Yes' : '❌ No' },
                { field: 'NewPrice', value: `${offer.newPrice.toFixed(2)} ₴` },
                { field: 'OldPrice', value: offer.oldPrice ? `${offer.oldPrice.toFixed(2)} ₴` : '—' },
                { field: 'ValidFrom', value: formatDate(offer.validFrom) },
                { field: 'ValidTo', value: formatDate(offer.validTo) },
                { field: 'Creator', value: offer.creator },
                { field: 'CreatedAt', value: formatDate(offer.createdAt) },
              ].map(({ field, value }) => (
                <tr key={field} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="py-2.5 pr-6 font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">{field}</td>
                  <td className="py-2.5 text-zinc-600 dark:text-zinc-400 break-all">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-500" />
          Comments
          <span className="ml-1 text-sm font-normal text-zinc-400">({comments.length})</span>
        </h2>

        {/* Comment list */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-6">No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <img
                  src={c.avatar}
                  alt={c.author}
                  className="w-9 h-9 rounded-full shrink-0 bg-zinc-200"
                  onError={e => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}&background=f97316&color=fff`; }}
                />
                <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">{c.author}</span>
                    <span className="text-xs text-zinc-400">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={commentEndRef} />
        </div>

        {/* Add comment */}
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-5 space-y-3">
          <input
            id="comment-author"
            type="text"
            value={commentAuthor}
            onChange={e => setCommentAuthor(e.target.value)}
            placeholder="Your name (optional)"
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
          />
          <div className="flex gap-3">
            <textarea
              id="comment-text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              placeholder="Write a comment… (Enter to submit)"
              rows={2}
              className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 resize-none"
            />
            <button
              id="btn-submit-comment"
              onClick={handleAddComment}
              disabled={!commentText.trim()}
              className="btn-primary self-end px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg px-3 py-2">
      <span className="text-primary-500 mt-0.5 shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-zinc-400 leading-none mb-0.5">{label}</div>
        <div className="font-medium text-zinc-800 dark:text-zinc-200 break-all">{value}</div>
      </div>
    </div>
  );
}

function ActionButton({
  id, onClick, active, activeClass, inactiveClass, icon, label, count
}: {
  id: string;
  onClick: () => void;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all active:scale-95 ${active ? activeClass : inactiveClass}`}
    >
      {icon}
      {label}
      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
        {count}
      </span>
    </button>
  );
}
