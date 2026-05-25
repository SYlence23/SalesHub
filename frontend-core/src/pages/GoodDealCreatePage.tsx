import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ImagePlus, MapPin, Loader2, Plus, ChevronLeft, X, Search, Tag, Sparkles, Users } from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';
import { type Category } from '../components/Offer/OfferFilters';
import { AudienceBadge } from '../components/Offer/GoodDealCard';
import localforage from 'localforage';

const AUDIENCES = ['Молодь', 'Студенти', 'Учні'];

type CreateMode = 'discount' | 'good-deal';

interface PlaceDTO {
    id: number;
    name: string;
    description: string;
    isOnline: boolean;
    offerUrl: string;
}

interface PlaceForm {
    name: string;
    description: string;
    isOnline: boolean;
    offerUrl: string;
    latitude: number;
    longitude: number;
    address: string;
}

interface GoodDealForm {
    title: string;
    description: string;
    validFrom: string;
    validTo: string;
    categoryId: number | string;
}

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

const AddressAutocomplete: React.FC<{
    onSelect: (coords: { lat: number; lng: number }, address: string) => void;
    onChange: (address: string) => void;
    isLoaded: boolean;
    onError?: (msg: string | null) => void;
}> = ({ onSelect, onChange, onError }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            locationBias: { lat: 49.8397, lng: 24.0297, radius: 50000 },
            componentRestrictions: { country: 'ua' },
        },
        debounce: 300,
    });

    const handleSelect = async (address: string, placeId?: string) => {
        setValue(address, false);
        clearSuggestions();
        try {
            let lat: number, lng: number;
            if (placeId) {
                const mapDiv = document.createElement('div');
                const service = new google.maps.places.PlacesService(mapDiv);
                const result = await new Promise<google.maps.places.PlaceResult | null>((resolve) => {
                    service.getDetails({ placeId, fields: ['geometry'] }, (place, status) => {
                        if (status === google.maps.places.PlacesServiceStatus.OK) resolve(place);
                        else resolve(null);
                    });
                });
                if (result?.geometry?.location) {
                    lat = result.geometry.location.lat();
                    lng = result.geometry.location.lng();
                } else {
                    const results = await getGeocode({ placeId });
                    const coords = await getLatLng(results[0]);
                    lat = coords.lat;
                    lng = coords.lng;
                }
            } else {
                const results = await getGeocode({ address });
                const coords = await getLatLng(results[0]);
                lat = coords.lat;
                lng = coords.lng;
            }
            if (lat < 47.50 || lat > 51.50 || lng < 21.50 || lng > 26.50) {
                if (onError) onError('Unfortunately, offers can only be created within the Lviv region.');
                return;
            }
            if (onError) onError(null);
            onSelect({ lat, lng }, address);
        } catch (error) {
            console.error('Error geocoding address:', error);
            if (onError) onError("Your API key might need 'Geocoding API' enabled. Please select the address from the dropdown.");
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    value={value}
                    onChange={(e) => { setValue(e.target.value); onChange(e.target.value); }}
                    disabled={!ready}
                    placeholder={ready ? 'Введіть адресу (вулиця, будинок...)' : 'Завантаження...'}
                    className="w-full px-4 py-2 pl-10 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            </div>
            {status === 'OK' && (
                <ul className="absolute left-0 w-full bg-white dark:bg-zinc-800 mt-2 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-[100] list-none p-0 m-0">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description, place_id)}
                            className="p-3 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm border-b last:border-0 border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-white"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default function GoodDealCreatePage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<CreateMode>('good-deal');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        libraries,
        language: 'uk',
        region: 'UA',
    });

    const [gdForm, setGdForm] = useState<GoodDealForm>(() => {
        const saved = localStorage.getItem('gdData');
        return saved ? JSON.parse(saved) : {
            title: '',
            description: '',
            validFrom: '',
            validTo: '',
            categoryId: '',
        };
    });

    const [placeForm, setPlaceForm] = useState<PlaceForm>(() => {
        const saved = localStorage.getItem('gdPlaceData');
        return saved ? JSON.parse(saved) : {
            name: '',
            description: '',
            isOnline: false,
            offerUrl: '',
            latitude: 0,
            longitude: 0,
            address: '',
        };
    });

    const [places, setPlaces] = useState<PlaceDTO[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [isNewPlace, setIsNewPlace] = useState(false);

    const [placeSearchInput, setPlaceSearchInput] = useState('');
    const [isPlaceDropdownOpen, setIsPlaceDropdownOpen] = useState(false);
    const placeDropdownRef = useRef<HTMLDivElement>(null);

    // Initial load sync of placeSearchInput
    useEffect(() => {
        if (selectedPlaceId && places.length > 0) {
            const found = places.find(p => p.id.toString() === selectedPlaceId);
            if (found) setPlaceSearchInput(found.name);
        }
    }, [selectedPlaceId, places]);

    // Click outside handler for searchable dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (placeDropdownRef.current && !placeDropdownRef.current.contains(event.target as Node)) {
                setIsPlaceDropdownOpen(false);
                if (selectedPlaceId) {
                    const found = places.find(p => p.id.toString() === selectedPlaceId);
                    if (found) setPlaceSearchInput(found.name);
                } else {
                    setPlaceSearchInput('');
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedPlaceId, places]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageQuantity, setImageQuantity] = useState(0);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catsRes, placesRes] = await Promise.all([
                    api.get<Category[]>('/Discounts/categories'),
                    api.get<PlaceDTO[]>('/Places'),
                ]);
                setCategories(catsRes.data);
                const uniquePlaces = placesRes.data.reduce((acc: PlaceDTO[], current) => {
                    if (!acc.find(item => item.name === current.name)) return [...acc, current];
                    return acc;
                }, []);
                setPlaces(uniquePlaces);
            } catch (err) {
                console.error('Failed to load initial data', err);
            }
        };
        const loadImages = async () => {
            const temp = (await localforage.getItem('gdImages')) || [];
            setImagePreviews((temp as File[]).map((f: File) => URL.createObjectURL(f)));
        };
        fetchData();
        loadImages();
    }, []);

    useEffect(() => {
        localStorage.setItem('gdData', JSON.stringify(gdForm));
        localStorage.setItem('gdPlaceData', JSON.stringify(placeForm));
    }, [gdForm, placeForm]);

    const removeAllImages = async () => {
        await localforage.removeItem('gdImages');
        setImagePreviews([]);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            removeAllImages();
            localStorage.removeItem('gdData');
            localStorage.removeItem('gdPlaceData');
        }, 180000);
        return () => clearTimeout(timer);
    }, [gdForm, placeForm]);

    const handleGdFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setGdForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
        setPlaceForm(prev => ({ ...prev, [target.name]: value }));
    };

    const toggleAudience = (audience: string) => {
        setSelectedAudiences(prev =>
            prev.includes(audience) ? prev.filter(a => a !== audience) : [...prev, audience]
        );
    };

    // Drag & drop images
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newPreviews = [...imagePreviews];
        const item = newPreviews[draggedIndex];
        newPreviews.splice(draggedIndex, 1);
        newPreviews.splice(index, 0, item);
        setImagePreviews(newPreviews);
        setDraggedIndex(index);
    };
    const handleDragEnd = () => setDraggedIndex(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && imagePreviews.length + e.target.files.length > 8) {
            setError('You can only upload up to 8 images');
            return;
        }
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            setIsImageLoading(true);
            setImageQuantity(files.length);
            try {
                const existing = (await localforage.getItem<File[]>('gdImages')) || [];
                const newImages = [...existing, ...files];
                await localforage.setItem('gdImages', newImages);
                setImagePreviews(newImages.map(f => URL.createObjectURL(f)));
            } catch {
                setError('Could not upload images. Please try refreshing.');
            } finally {
                setIsImageLoading(false);
                setImageQuantity(0);
                e.target.value = '';
            }
        }
    };

    const removeImage = async (keyToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== keyToRemove));
        const existing = (await localforage.getItem<File[]>('gdImages')) || [];
        await localforage.setItem('gdImages', existing.filter((_, i) => i !== keyToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            let finalPlaceId = selectedPlaceId;

            if (isNewPlace) {
                let currentLat = placeForm.latitude;
                let currentLng = placeForm.longitude;

                if (!placeForm.isOnline && (currentLat === 0 || currentLng === 0)) {
                    if (!placeForm.address) throw new Error('Please enter an address for the store.');
                    try {
                        if (typeof google === 'undefined') throw new Error('Google Maps API not loaded yet.');
                        const results = await getGeocode({ address: placeForm.address, componentRestrictions: { country: 'UA' } });
                        if (!results || results.length === 0) throw new Error('No address found');
                        const { lat, lng } = await getLatLng(results[0]);
                        if (lat < 47.50 || lat > 51.50 || lng < 21.50 || lng > 26.50)
                            throw new Error('Unfortunately, the entered address is outside the Lviv region.');
                        currentLat = lat;
                        currentLng = lng;
                    } catch (geocodeErr: any) {
                        throw new Error(`Could not find coordinates for "${placeForm.address}". Please select a valid address from the dropdown to get location coordinates.`);
                    }
                }

                // Create new place via standard Places endpoint
                const placeRes = await api.post<{ id: number }>('/Places', {
                    name: placeForm.name,
                    description: placeForm.description,
                    isOnline: placeForm.isOnline,
                    offerUrl: placeForm.offerUrl,
                    latitude: currentLat,
                    longitude: currentLng,
                });
                finalPlaceId = placeRes.data.id.toString();
            }

            if (!finalPlaceId) throw new Error('Please select or create a place.');
            if (!gdForm.categoryId) throw new Error('Please select a category.');

            // Upload images
            const imageFiles = (await localforage.getItem<File[]>('gdImages')) || [];
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                imageUrls = await Promise.all(imageFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await api.post<{ url: string }>('/File/uploadImage?prefix=good-deal-images', formData);
                    return res.data.url;
                }));
            }

            await api.post('/GoodDeals', {
                title: gdForm.title,
                description: gdForm.description,
                validFrom: gdForm.validFrom ? new Date(gdForm.validFrom).toISOString() : null,
                validTo: gdForm.validTo ? new Date(gdForm.validTo).toISOString() : null,
                placeId: parseInt(finalPlaceId),
                categoryId: parseInt(gdForm.categoryId.toString()),
                imageUrls,
                targetAudiences: selectedAudiences,
            });

            await localforage.removeItem('gdImages');
            localStorage.removeItem('gdData');
            localStorage.removeItem('gdPlaceData');
            navigate('/good-deals');
        } catch (err: any) {
            const backendError = err.response?.data;
            let msg = 'An unexpected error occurred.';
            if (typeof backendError === 'string') msg = backendError;
            else if (backendError?.message) msg = backendError.message;
            else if (backendError?.detail) msg = backendError.detail;
            else if (err.message) msg = err.message;
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass = 'w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all';

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/good-deals')}
                className="flex items-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Назад до пропозицій
            </button>

            {/* Type Toggle */}
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                    Створити <span className="text-orange-500">пропозицію</span>
                </h1>
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => navigate('/offers/create')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                            mode === 'discount'
                                ? 'bg-primary-500 text-white shadow-md'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Tag className="w-4 h-4" />
                        Знижка
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('good-deal')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                            mode === 'good-deal'
                                ? 'bg-orange-500 text-white shadow-md'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                        }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Студентська вигода
                    </button>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 mt-3 text-sm">
                    Студентська вигода — цікава акція чи подія без вказання ціни.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-8 border border-red-200 dark:border-red-800/30">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Images */}
                <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4">Зображення</h2>
                    {(imagePreviews.length > 0 || isImageLoading) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                            {imagePreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    className={`relative aspect-square rounded-lg overflow-hidden border ${draggedIndex === index ? 'border-orange-500 opacity-50 scale-95' : 'border-zinc-200 dark:border-zinc-700'} cursor-move transition-all duration-200`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover pointer-events-none" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-orange-500/90 text-white text-xs font-bold rounded shadow-sm">
                                            Головне
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isImageLoading && Array.from({ length: imageQuantity }).map((_, i) => (
                                <div key={`loading-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-2" />
                                    <span className="text-xs text-zinc-500">Завантаження...</span>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-center w-full">
                        {imagePreviews.length < 8 && (
                            <label className={`flex flex-col items-center justify-center w-full border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:border-zinc-700 transition-all ${imagePreviews.length > 0 ? 'h-32' : 'h-64'}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <ImagePlus className={`${imagePreviews.length > 0 ? 'w-6 h-6 mb-2' : 'w-10 h-10 mb-3'} text-zinc-400`} />
                                    <p className={`mb-2 text-zinc-500 dark:text-zinc-400 ${imagePreviews.length > 0 ? 'text-sm' : ''}`}>
                                        <span className="font-semibold">Натисніть для завантаження</span> або перетягніть
                                    </p>
                                    {!imagePreviews.length && <p className="text-xs text-zinc-500">PNG, JPG або WEBP (макс. 8 фото)</p>}
                                </div>
                                <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Основна інформація</h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">Назва *</label>
                        <input
                            type="text"
                            required
                            name="title"
                            value={gdForm.title}
                            onChange={handleGdFormChange}
                            className={inputClass}
                            placeholder="Наприклад: Безкоштовна дегустація кави"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Опис</label>
                        <textarea
                            name="description"
                            value={gdForm.description}
                            onChange={handleGdFormChange}
                            className={`${inputClass} min-h-[100px] resize-y`}
                            placeholder="Опишіть пропозицію..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Категорія *</label>
                        <select
                            required
                            name="categoryId"
                            value={gdForm.categoryId}
                            onChange={handleGdFormChange}
                            className={`${inputClass} appearance-none`}
                        >
                            <option value="" disabled>Оберіть категорію</option>
                            {categories
                                .filter(c => ['Розваги', 'Транспорт', 'Відпочинок', 'Освіта'].includes(c.name))
                                .filter((c, index, self) => self.findIndex(t => t.name === c.name) === index)
                                .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
                                .map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))
                            }
                        </select>
                    </div>
                </div>

                {/* Audience */}
                <div className="glass-card p-6 rounded-2xl space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-orange-500" />
                            Для кого ця пропозиція
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Оберіть одну або кілька груп. Це допоможе знайти пропозицію потрібним людям.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {AUDIENCES.map(a => {
                            const isSelected = selectedAudiences.includes(a);
                            return (
                                <button
                                    key={a}
                                    type="button"
                                    onClick={() => toggleAudience(a)}
                                    className={`transition-all duration-150 rounded-full border-2 ${isSelected ? 'border-orange-500 scale-105 shadow-sm' : 'border-transparent'}`}
                                >
                                    <AudienceBadge label={a} />
                                </button>
                            );
                        })}
                    </div>
                    {selectedAudiences.length > 0 && (
                        <p className="text-xs text-zinc-400">
                            Обрано: {selectedAudiences.join(', ')}
                        </p>
                    )}
                </div>

                {/* Dates */}
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Термін дії</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Дійсно з</label>
                            <input
                                type="datetime-local"
                                name="validFrom"
                                value={gdForm.validFrom}
                                onChange={handleGdFormChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Дійсно до</label>
                            <input
                                type="datetime-local"
                                name="validTo"
                                value={gdForm.validTo}
                                onChange={handleGdFormChange}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                <div className={`glass-card p-6 rounded-2xl space-y-6 border-2 transition-all duration-300 ${
                    isNewPlace 
                        ? 'border-orange-400 !bg-orange-50/70 dark:!bg-orange-950/20' 
                        : 'border-orange-500'
                }`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Заклад / Місце</h2>
                        <button
                            type="button"
                            onClick={() => setIsNewPlace(!isNewPlace)}
                            className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1"
                        >
                            {isNewPlace ? 'Обрати існуючий' : <><Plus className="w-4 h-4" />Додати новий</>}
                        </button>
                    </div>

                    {!isNewPlace ? (
                        <div className="relative" ref={placeDropdownRef}>
                            <label className="block text-sm font-medium mb-2">Оберіть заклад *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Шукати існуючий заклад..."
                                    value={placeSearchInput}
                                    onChange={(e) => {
                                        setPlaceSearchInput(e.target.value);
                                        setIsPlaceDropdownOpen(true);
                                        const exactMatch = places.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                                        if (exactMatch) {
                                            setSelectedPlaceId(exactMatch.id.toString());
                                        } else {
                                            setSelectedPlaceId('');
                                        }
                                    }}
                                    onFocus={() => setIsPlaceDropdownOpen(true)}
                                    className={inputClass}
                                />
                                {selectedPlaceId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedPlaceId('');
                                            setPlaceSearchInput('');
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500"
                                    >
                                        <X className="w-4.5 h-4.5" />
                                    </button>
                                )}
                            </div>

                            {isPlaceDropdownOpen && (
                                <ul className="absolute left-0 w-full bg-white dark:bg-zinc-800 mt-2 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-[100] max-h-60 overflow-y-auto list-none p-0 m-0">
                                    {places
                                        .filter(p => p.name.toLowerCase().includes(placeSearchInput.toLowerCase()))
                                        .map(p => (
                                            <li
                                                key={p.id}
                                                onClick={() => {
                                                    setSelectedPlaceId(p.id.toString());
                                                    setPlaceSearchInput(p.name);
                                                    setIsPlaceDropdownOpen(false);
                                                }}
                                                className={`p-3 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm border-b last:border-0 border-zinc-100 dark:border-zinc-700 text-zinc-900 dark:text-white flex justify-between items-center ${
                                                    selectedPlaceId === p.id.toString() ? 'bg-orange-50 dark:bg-orange-950/20 font-semibold text-orange-600 dark:text-orange-400' : ''
                                                }`}
                                            >
                                                <span>{p.name}</span>
                                                {p.isOnline && (
                                                    <span className="text-[10px] bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                        Онлайн
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    {places.filter(p => p.name.toLowerCase().includes(placeSearchInput.toLowerCase())).length === 0 && (
                                        <li className="p-4 text-center text-sm text-zinc-500">
                                            Закладів не знайдено. Спробуйте додати новий.
                                        </li>
                                    )}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div>
                                <label className="block text-sm font-medium mb-2">Назва закладу *</label>
                                <input
                                    type="text"
                                    required={isNewPlace}
                                    name="name"
                                    value={placeForm.name}
                                    onChange={handlePlaceFormChange}
                                    className={inputClass}
                                    placeholder="Наприклад: Кав'ярня «Арабіка»"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Опис закладу</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={placeForm.description}
                                    onChange={handlePlaceFormChange}
                                    className={inputClass}
                                    placeholder="Короткий опис..."
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="isOnline"
                                    checked={placeForm.isOnline}
                                    onChange={handlePlaceFormChange}
                                    className="w-5 h-5 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                                />
                                <div>
                                    <p className="font-medium">Онлайн заклад</p>
                                    <p className="text-sm text-zinc-500">Ця пропозиція доступна лише онлайн.</p>
                                </div>
                            </label>

                            {placeForm.isOnline ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2">URL пропозиції</label>
                                    <input
                                        type="url"
                                        name="offerUrl"
                                        value={placeForm.offerUrl}
                                        onChange={handlePlaceFormChange}
                                        className={inputClass}
                                        placeholder="https://..."
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Адреса закладу</span>
                                    </div>
                                    <AddressAutocomplete
                                        isLoaded={isLoaded}
                                        onError={setError}
                                        onChange={(address) => setPlaceForm(prev => ({ ...prev, address, latitude: 0, longitude: 0 }))}
                                        onSelect={(coords, address) => setPlaceForm(prev => ({ ...prev, address, latitude: coords.lat, longitude: coords.lng }))}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center px-10 py-3 rounded-xl font-medium text-lg text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Публікую...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" />
                                Опублікувати пропозицію
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
