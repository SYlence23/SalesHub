import { Link } from 'react-router-dom';
import { User, Sparkles, Calendar, MapPin } from 'lucide-react';

export interface GoodDeal {
  id: number;
  title: string;
  description?: string;
  storeName: string;
  mainImageUrl?: string;
  creatorUserName?: string;
  categoryName?: string;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  targetAudiences?: string[];
}

// Audience color palette — consistent across the app
export const AUDIENCE_COLORS: Record<string, string> = {
  'Студенти':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Учні':            'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'Викладачі':       'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'IT-спеціалісти':  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  'Пенсіонери':      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'Молодь':          'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Усі':             'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export const DEFAULT_AUDIENCE_COLOR = 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

export function AudienceBadge({ label, small = false }: { label: string; small?: boolean }) {
  const colorClass = AUDIENCE_COLORS[label] ?? DEFAULT_AUDIENCE_COLOR;
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'} ${colorClass}`}>
      {label}
    </span>
  );
}

interface GoodDealCardProps {
  deal: GoodDeal;
}

export default function GoodDealCard({ deal }: GoodDealCardProps) {
  const now = new Date();
  const validTo = deal.validTo ? new Date(deal.validTo) : null;
  const isExpired = validTo && validTo < now;
  const isExpiringSoon = validTo && !isExpired && (validTo.getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
  const audiences = deal.targetAudiences ?? [];

  return (
    <Link to={`/good-deals/${deal.id}`} className="block w-full group">
      <div className="glass-card overflow-hidden flex flex-row hover:-translate-y-0.5 hover:shadow-xl transition-all duration-300 h-44">

        {/* Left — Image */}
        <div className="relative w-44 shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          <img
            src={deal.mainImageUrl || ''}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=300&q=80";
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />

          {/* Expiring badge on image */}
          {isExpiringSoon && (
            <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              Скоро
            </div>
          )}
          {isExpired && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">Завершено</span>
            </div>
          )}
        </div>

        {/* Right — Content */}
        <div className="flex flex-col flex-1 min-w-0 p-4">

          {/* Top row: store + category */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{deal.storeName}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Good deal sparkle */}
              <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                Хороша
              </span>
              {deal.categoryName && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  {deal.categoryName}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {deal.title}
          </h3>

          {/* Description */}
          {deal.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
              {deal.description}
            </p>
          )}

          {/* Audience badges */}
          {audiences.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-auto">
              {audiences.slice(0, 4).map(a => (
                <AudienceBadge key={a} label={a} small />
              ))}
              {audiences.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  +{audiences.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Bottom row: date + creator */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
            {deal.validTo ? (
              <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                До {new Date(deal.validTo).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
              </span>
            ) : (
              <span />
            )}
            {deal.creatorUserName && (
              <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <User className="w-3 h-3" />
                <span>{deal.creatorUserName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
