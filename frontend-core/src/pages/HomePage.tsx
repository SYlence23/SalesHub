import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';
import OfferSkeletonCard from '../components/Offer/OfferSkeletonCard';

interface ApiResponse {
  total: number;
  page: number;
  data: Offer[];
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [recentOffers, setRecentOffers] = useState<Offer[]>([]);
  const [popularOffers, setPopularOffers] = useState<Offer[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await axios.get<ApiResponse>('/api/Discounts?pageSize=6&sortOption=newest');
        setRecentOffers(response.data.data);
      } catch (error) {
        console.error("Failed to fetch recent offers:", error);
      } finally {
        setIsLoadingRecent(false);
      }
    };

    const fetchPopular = async () => {
      try {
        const response = await axios.get<ApiResponse>('/api/Discounts?pageSize=6&sortOption=discount_desc');
        setPopularOffers(response.data.data);
      } catch (error) {
        console.error("Failed to fetch popular offers:", error);
      } finally {
        setIsLoadingPopular(false);
      }
    };

    fetchRecent();
    fetchPopular();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/offers?searchTerm=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/offers');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
      {/* Hero Section */}
      <div className="text-center py-20 lg:py-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full -z-10" />

        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6">
          Відкрийте найкращі <span className="text-primary-500">знижки</span> Львова
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-10 max-w-2xl mx-auto">
          SalesHub збирає найновіші знижки та вигідні пропозиції спеціально для вас.
        </p>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto mb-10 relative group"
        >
          <div className="relative flex items-center">
            <Search className="absolute left-5 w-6 h-6 text-zinc-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Шукайте товари, бренди або магазини..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-16 pl-14 pr-32 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all outline-none text-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              Пошук
            </button>
          </div>
        </form>


      </div>

      {/* Recently Added Slider */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold">Найновіші пропозиції</h2>
          </div>
          <button
            onClick={() => navigate('/offers?sortOption=newest')}
            className="flex items-center gap-2 text-primary-500 font-semibold hover:underline"
          >
            Дивитися всі <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoadingRecent ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[280px] sm:min-w-[320px]">
                <OfferSkeletonCard />
              </div>
            ))
          ) : (
            recentOffers.map((offer) => (
              <div key={offer.id} className="min-w-[280px] sm:min-w-[320px]">
                <OfferCard offer={offer} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Popular Sales Slider */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold">Популярні знижки</h2>
          </div>
          <button
            onClick={() => navigate('/offers?sortOption=discount_desc')}
            className="flex items-center gap-2 text-primary-500 font-semibold hover:underline"
          >
            Дивитися всі <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex overflow-x-auto pb-6 gap-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {isLoadingPopular ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="min-w-[280px] sm:min-w-[320px]">
                <OfferSkeletonCard />
              </div>
            ))
          ) : (
            popularOffers.map((offer) => (
              <div key={offer.id} className="min-w-[280px] sm:min-w-[320px]">
                <OfferCard offer={offer} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
