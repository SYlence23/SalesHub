import { Link } from 'react-router-dom';
import { User, Sparkles, Calendar, Tag } from 'lucide-react';

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
    <Link to={`/good-deals/${deal.id}`} className="block w-full group h-full">
      <div className="glass-card overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 h-full">

        {/* Top — Image container */}
        <div className="relative p-3 pb-0 w-full shrink-0">
          <div className="relative rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 aspect-[16/10]">
            <img
              src={deal.mainImageUrl || ''}
              alt={deal.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80";
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Badges on image */}
          <div className="absolute top-5 left-5 flex flex-wrap gap-1.5">
            {/* Good deal pill */}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              Хороша
            </span>

            {/* Status pill */}
            {isExpired ? (
              <span className="bg-zinc-950/70 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1 backdrop-blur-xs">
                <span className="w-1 h-1 rounded-full bg-zinc-400" />
                Завершено
              </span>
            ) : isExpiringSoon ? (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Скоро
              </span>
            ) : (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Активна
              </span>
            )}
          </div>
        </div>

        {/* Bottom — Content */}
        <div className="flex flex-col flex-grow p-4">
          {/* Category & Store */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="uppercase tracking-wider">{deal.categoryName || 'Пропозиція'}</span>
            {deal.storeName && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="truncate text-zinc-600 dark:text-zinc-300 font-medium">{deal.storeName}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-snug mb-1.5 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {deal.title}
          </h3>

          {/* Description */}
          {deal.description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3.5 leading-relaxed">
              {deal.description}
            </p>
          )}

          {/* Audience badges */}
          {audiences.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {audiences.slice(0, 3).map(a => (
                <AudienceBadge key={a} label={a} small />
              ))}
              {audiences.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                  +{audiences.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Bottom Row */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-400 dark:text-zinc-500">
            {deal.validTo ? (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                До {new Date(deal.validTo).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Безстроково
              </span>
            )}
            {deal.creatorUserName && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{deal.creatorUserName}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </Link>
  );
}
