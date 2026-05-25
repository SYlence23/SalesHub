import { User } from 'lucide-react';

export interface Offer {
  id: number;
  title: string;
  newPrice: number;
  oldPrice: number;
  storeName: string;
  mainImageUrl: string;
  creatorUserName?: string;
}

interface OfferCardProps {
  offer: Offer;
}

export default function OfferCard({ offer }: OfferCardProps) {
  const discount = offer.oldPrice && offer.oldPrice > 0
    ? Math.round(((offer.oldPrice - offer.newPrice) / offer.oldPrice) * 100)
    : 0;

  return (
    <div className="glass-card overflow-hidden group flex flex-col h-full hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300">
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        <img
          src={offer.mainImageUrl}
          alt={offer.title}
          className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80";
          }}
        />
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
            -{discount}%
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col grow">
        <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
          {offer.storeName}
        </div>
        <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight mb-3 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {offer.title}
        </h3>
        <div className="mt-auto flex items-end justify-between">
          <div>
            {offer.oldPrice > 0 && (
              <div className="text-sm text-zinc-500 dark:text-zinc-400 line-through mb-0.5">
                {offer.oldPrice.toFixed(2)} ₴
              </div>
            )}
            <div className="font-bold text-2xl text-zinc-900 dark:text-white">
              {offer.newPrice.toFixed(2)} ₴
            </div>
          </div>
          {offer.creatorUserName && (
            <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
              <User className="w-3 h-3" />
              <span>{offer.creatorUserName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
