import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import api from '../api/axios';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';
import OfferSkeletonCard from '../components/Offer/OfferSkeletonCard';

interface PublicProfile {
    id: number;
    name: string;
    surname: string;
    category: string;
    createdOffersCount: number;
}

export default function PublicProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoadingOffers, setIsLoadingOffers] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            try {
                const res = await api.get<PublicProfile>(`/User/${id}`);
                setProfile(res.data);
            } catch (err: any) {
                if (err.response?.status === 404) setNotFound(true);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        const fetchOffers = async () => {
            setIsLoadingOffers(true);
            try {
                const res = await api.get<Offer[]>(`/User/${id}/offers`);
                setOffers(res.data);
            } catch {
                setOffers([]);
            } finally {
                setIsLoadingOffers(false);
            }
        };

        fetchProfile();
        fetchOffers();
    }, [id]);

    if (notFound) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="text-6xl mb-4">😕</div>
                <h1 className="text-3xl font-bold mb-2">User not found</h1>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8">
                    Profile does not exist or was deleted.
                </p>
                <button onClick={() => navigate('/')} className="btn-primary">
                    На головну
                </button>
            </div>
        );
    }

    const initials = profile
        ? [profile.name, profile.surname].filter(Boolean).map(s => s[0].toUpperCase()).join('')
        : '?';

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Шапка профілю */}
            <div className="glass-card p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {isLoadingProfile ? (
                    <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse shrink-0" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg">
                        {initials}
                    </div>
                )}

                <div className="flex flex-col items-center sm:items-start gap-2 grow">
                    {isLoadingProfile ? (
                        <>
                            <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                            <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                        </>
                    ) : profile ? (
                        <>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                                {profile.name} {profile.surname}
                            </h1>


                            {/* Статистика */}
                            <div className="flex gap-6 mt-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Tag className="w-4 h-4 text-primary-500" />
                                    <span className="font-semibold text-zinc-900 dark:text-white">{profile.createdOffersCount}</span>
                                    <span className="text-zinc-500 dark:text-zinc-400">пропозицій</span>
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Пропозиції користувача */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Tag className="w-6 h-6 text-primary-500" />
                        Пропозиції
                    </h2>
                </div>

                {isLoadingOffers ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => <OfferSkeletonCard key={i} />)}
                    </div>
                ) : offers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {offers.map(offer => (
                            <Link key={offer.id} to={`/offers/${offer.id}`}>
                                <OfferCard offer={offer} />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="glass-card p-12 text-center">
                        <div className="text-5xl mb-4">📭</div>
                        <h3 className="text-xl font-bold mb-2">Ще немає пропозицій</h3>
                        <p className="text-zinc-500 dark:text-zinc-400">
                            Цей користувач ще не додав жодної пропозиції.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}
