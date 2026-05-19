import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Tag, Bookmark, Settings, Trash2, Edit, Eye, EyeOff, Check, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import OfferCard, { type Offer } from '../components/Offer/OfferCard';
import OfferSkeletonCard from '../components/Offer/OfferSkeletonCard';

type Tab = 'my-offers' | 'saved' | 'settings';

interface UserProfile {
    id: number;
    name: string;
    surname: string;
    email: string;
    category: string;
    createdOffersCount: number;
    savedOffersCount: number;
}

export default function UserProfilePage() {
    const { firstName, lastName, userEmail, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('my-offers');

    // Профіль
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Пропозиції
    const [myOffers, setMyOffers] = useState<Offer[]>([]);
    const [savedOffers, setSavedOffers] = useState<Offer[]>([]);
    const [isLoadingMyOffers, setIsLoadingMyOffers] = useState(false);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);

    // Форма редагування профілю
    const [editName, setEditName] = useState('');
    const [editSurname, setEditSurname] = useState('');
    const [editIsStudent, setEditIsStudent] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Форма зміни пароля
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    // ── Завантаження профілю ─────────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get<UserProfile>('/User/profile');
                setProfile(res.data);
                setEditName(res.data.name);
                setEditSurname(res.data.surname);
                setEditIsStudent(res.data.category === 'Student');
            } catch {
                // Помилка автентифікації — axios interceptor перенаправить
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    // ── Завантаження "Мої пропозиції" ────────────────────────────────────────
    const fetchMyOffers = useCallback(async () => {
        setIsLoadingMyOffers(true);
        try {
            const res = await api.get<Offer[]>('/User/my-offers');
            setMyOffers(res.data);
        } catch {
            setMyOffers([]);
        } finally {
            setIsLoadingMyOffers(false);
        }
    }, []);

    // ── Завантаження "Збережені" ─────────────────────────────────────────────
    const fetchSavedOffers = useCallback(async () => {
        setIsLoadingSaved(true);
        try {
            const res = await api.get<Offer[]>('/User/saved-offers');
            setSavedOffers(res.data);
        } catch {
            setSavedOffers([]);
        } finally {
            setIsLoadingSaved(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'my-offers') fetchMyOffers();
        if (activeTab === 'saved') fetchSavedOffers();
    }, [activeTab, fetchMyOffers, fetchSavedOffers]);

    // ── Видалення пропозиції ─────────────────────────────────────────────────
    const handleDeleteOffer = async (offerId: number) => {
        if (!confirm('Ви впевнені, що хочете видалити цю пропозицію?')) return;
        try {
            await api.delete(`/User/my-offers/${offerId}`);
            setMyOffers(prev => prev.filter(o => o.id !== offerId));
        } catch {
            alert('Не вдалося видалити пропозицію.');
        }
    };

    // ── Видалити зі збережених ───────────────────────────────────────────────
    const handleUnsaveOffer = async (offerId: number) => {
        try {
            await api.delete(`/User/saved-offers/${offerId}`);
            setSavedOffers(prev => prev.filter(o => o.id !== offerId));
        } catch {
            alert('Не вдалося видалити зі збережених.');
        }
    };

    // ── Збереження профілю ───────────────────────────────────────────────────
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        setProfileMsg(null);
        try {
            await api.put('/User/profile', { name: editName, surname: editSurname, isStudent: editIsStudent });
            setProfileMsg({ text: 'Профіль успішно оновлено.', ok: true });
            setProfile(prev => prev ? { ...prev, name: editName, surname: editSurname, category: editIsStudent ? 'Student' : 'NonStudent' } : prev);
        } catch (err: any) {
            setProfileMsg({ text: err.response?.data?.message || 'Помилка оновлення.', ok: false });
        } finally {
            setIsSavingProfile(false);
        }
    };

    // ── Зміна пароля ─────────────────────────────────────────────────────────
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingPassword(true);
        setPasswordMsg(null);
        try {
            await api.put('/User/change-password', { currentPassword, newPassword });
            setPasswordMsg({ text: 'Пароль успішно змінено.', ok: true });
            setCurrentPassword('');
            setNewPassword('');
        } catch (err: any) {
            setPasswordMsg({ text: err.response?.data?.message || 'Помилка зміни пароля.', ok: false });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // ── Ініціали ─────────────────────────────────────────────────────────────
    const displayName = profile ? `${profile.name} ${profile.surname}` : `${firstName ?? ''} ${lastName ?? ''}`.trim();
    const initials = [profile?.name ?? firstName, profile?.surname ?? lastName]
        .filter(Boolean).map(s => s![0].toUpperCase()).join('') || '?';

    // ── Таби ─────────────────────────────────────────────────────────────────
    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: 'my-offers', label: 'Мої пропозиції', icon: <Tag className="w-4 h-4" /> },
        { id: 'saved', label: 'Збережені', icon: <Bookmark className="w-4 h-4" /> },
        { id: 'settings', label: 'Налаштування', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* ── Шапка профілю ─────────────────────────────────────────────── */}
            <div className="glass-card p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-500 to-orange-400 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg">
                    {initials}
                </div>

                <div className="flex flex-col items-center sm:items-start gap-2 grow">
                    {isLoadingProfile ? (
                        <>
                            <div className="h-8 w-52 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                            <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-700 rounded-xl animate-pulse" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                                {displayName || 'Мій профіль'}
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                {profile?.email || userEmail}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2">
                                <Stat label="Пропозицій" value={profile?.createdOffersCount ?? 0} />
                                <Stat label="Збережено" value={profile?.savedOffersCount ?? 0} />
                                <span className="text-sm text-zinc-400 dark:text-zinc-500">
                                    {profile?.category === 'Student' ? '🎓 Студент' : '👤 Користувач'}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-zinc-500 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400 transition-colors shrink-0"
                >
                    <LogOut className="w-4 h-4" />
                    Вийти
                </button>
            </div>

            {/* ── Таби ──────────────────────────────────────────────────────── */}
            <div className="flex gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-700">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all -mb-px ${
                            activeTab === tab.id
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Вміст таба: Мої пропозиції ────────────────────────────────── */}
            {activeTab === 'my-offers' && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Мої пропозиції</h2>
                        <Link to="/offers/create" className="btn-primary text-sm px-4 py-2">
                            + Додати пропозицію
                        </Link>
                    </div>

                    {isLoadingMyOffers ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => <OfferSkeletonCard key={i} />)}
                        </div>
                    ) : myOffers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {myOffers.map(offer => (
                                <div key={offer.id} className="relative group">
                                    <OfferCard offer={offer} />
                                    {/* Кнопки управління */}
                                    <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => navigate(`/offers/edit/${offer.id}`)}
                                            className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-md hover:bg-primary-50 dark:hover:bg-zinc-700 transition-colors"
                                            title="Редагувати"
                                        >
                                            <Edit className="w-4 h-4 text-primary-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteOffer(offer.id)}
                                            className="p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-md hover:bg-red-50 dark:hover:bg-zinc-700 transition-colors"
                                            title="Видалити"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            emoji="📝"
                            title="Ще немає пропозицій"
                            description="Ви ще не додали жодної пропозиції."
                            action={{ label: 'Створити першу', onClick: () => navigate('/offers/create') }}
                        />
                    )}
                </section>
            )}

            {/* ── Вміст таба: Збережені ─────────────────────────────────────── */}
            {activeTab === 'saved' && (
                <section>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Збережені пропозиції</h2>

                    {isLoadingSaved ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => <OfferSkeletonCard key={i} />)}
                        </div>
                    ) : savedOffers.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {savedOffers.map(offer => (
                                <div key={offer.id} className="relative group">
                                    <OfferCard offer={offer} />
                                    <button
                                        onClick={() => handleUnsaveOffer(offer.id)}
                                        className="absolute top-3 left-3 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-md hover:bg-red-50 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Видалити зі збережених"
                                    >
                                        <X className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            emoji="🔖"
                            title="Немає збережених"
                            description="Зберігайте пропозиції, щоб не загубити їх."
                            action={{ label: 'Переглянути пропозиції', onClick: () => navigate('/offers') }}
                        />
                    )}
                </section>
            )}

            {/* ── Вміст таба: Налаштування ──────────────────────────────────── */}
            {activeTab === 'settings' && (
                <section className="space-y-8 max-w-xl">

                    {/* Редагування профілю */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">
                            Особисті дані
                        </h2>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ім'я</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    required
                                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Прізвище</label>
                                <input
                                    type="text"
                                    value={editSurname}
                                    onChange={e => setEditSurname(e.target.value)}
                                    required
                                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 py-2">
                                <button
                                    type="button"
                                    onClick={() => setEditIsStudent(v => !v)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${editIsStudent ? 'bg-primary-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editIsStudent ? 'translate-x-6' : ''}`} />
                                </button>
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">Я студент</span>
                            </div>

                            {profileMsg && (
                                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${profileMsg.ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {profileMsg.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {profileMsg.text}
                                </div>
                            )}
                            <button type="submit" disabled={isSavingProfile} className="btn-primary w-full py-3 disabled:opacity-60">
                                {isSavingProfile ? 'Збереження...' : 'Зберегти зміни'}
                            </button>
                        </form>
                    </div>

                    {/* Зміна пароля */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">
                            Зміна пароля
                        </h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <PasswordField
                                label="Поточний пароль"
                                value={currentPassword}
                                onChange={setCurrentPassword}
                                show={showCurrent}
                                onToggle={() => setShowCurrent(v => !v)}
                            />
                            <PasswordField
                                label="Новий пароль"
                                value={newPassword}
                                onChange={setNewPassword}
                                show={showNew}
                                onToggle={() => setShowNew(v => !v)}
                            />

                            {passwordMsg && (
                                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${passwordMsg.ok ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {passwordMsg.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                    {passwordMsg.text}
                                </div>
                            )}
                            <button type="submit" disabled={isSavingPassword} className="btn-primary w-full py-3 disabled:opacity-60">
                                {isSavingPassword ? 'Збереження...' : 'Змінити пароль'}
                            </button>
                        </form>
                    </div>

                </section>
            )}
        </div>
    );
}

// ── Допоміжні компоненти ──────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center gap-1 text-sm">
            <span className="font-bold text-zinc-900 dark:text-white">{value}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
        </div>
    );
}

function PasswordField({
    label, value, onChange, show, onToggle
}: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full p-3 pr-12 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
}

function EmptyState({ emoji, title, description, action }: {
    emoji: string; title: string; description: string;
    action?: { label: string; onClick: () => void };
}) {
    return (
        <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">{emoji}</div>
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-white">{title}</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">{description}</p>
            {action && (
                <button onClick={action.onClick} className="btn-primary">
                    {action.label}
                </button>
            )}
        </div>
    );
}
