import { useState, useRef, useEffect } from 'react';
import { Bookmark, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

interface SavedOffer {
  id: number;
  title: string;
  storeName: string;
  newPrice: number;
  oldPrice: number;
}

export default function UserProfile() {
  const [isOpen, setIsOpen] = useState(false);
  const [savedOffers, setSavedOffers] = useState<SavedOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, firstName, lastName, userEmail, logout } = useAuth();
  const navigate = useNavigate();

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch saved offers from database when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      setIsLoading(true);
      api.get<SavedOffer[]>('/User/saved-offers')
        .then(res => {
          setSavedOffers(res.data);
        })
        .catch(err => {
          console.error("Failed to fetch saved offers in profile dropdown", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, isAuthenticated]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return null;
  }

  const displayName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Користувач';
  const initials = [firstName, lastName]
    .filter(Boolean)
    .map(s => s![0].toUpperCase())
    .join('') || '?';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400 text-white font-bold text-sm hover:shadow-lg hover:scale-105 transition-all active:scale-95"
      >
        {initials}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[85vh] overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col animate-in fade-in zoom-in duration-200 origin-top-right">
          
          {/* Header */}
          <Link 
            to="/profile" 
            onClick={() => setIsOpen(false)}
            className="p-4 border-b border-zinc-100 dark:border-white/10 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400 flex items-center justify-center text-white font-bold text-xl">
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">{displayName}</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{userEmail}</p>
            </div>
          </Link>

          {/* Scrollable Content */}
          <div className="overflow-y-auto grow custom-scrollbar max-h-60">
            {/* Section: Saved Discounts */}
            <section className="p-4">
              <div className="flex items-center gap-2 mb-3 text-zinc-400 dark:text-zinc-500">
                <Bookmark className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Збережені знижки</h4>
              </div>

              {isLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                  <div className="h-10 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl" />
                </div>
              ) : savedOffers.length > 0 ? (
                <div className="space-y-2">
                  {savedOffers.slice(0, 3).map(item => {
                    const discount = item.oldPrice && item.oldPrice > 0
                      ? Math.round(((item.oldPrice - item.newPrice) / item.oldPrice) * 100)
                      : 0;

                    return (
                      <Link
                        key={item.id}
                        to={`/offers/${item.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1 group-hover:text-primary-500 transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-zinc-500">{item.storeName}</p>
                        </div>
                        {discount > 0 && (
                          <span className="text-xs font-bold text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors ml-2 shrink-0">
                            -{discount}%
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {savedOffers.length > 3 && (
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block text-center text-xs font-semibold text-primary-500 hover:underline pt-1"
                    >
                      Показати всі ({savedOffers.length})
                    </Link>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4">
                  Немає збережених знижок
                </p>
              )}
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-zinc-50 dark:bg-black/20 border-t border-zinc-100 dark:border-white/10 mt-auto">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Вийти з акаунту</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
