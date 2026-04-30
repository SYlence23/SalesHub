import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ImagePlus, MapPin, Loader2, Plus, ChevronLeft, X } from 'lucide-react';
import { type Category } from '../components/Offer/OfferFilters';

interface Place {
    id: number;
    name: string;
    description: string;
    isOnline: boolean;
    offerUrl: string;
}

interface OfferData {
    title: string;
    description: string;
    newPrice: number;
    oldPrice: number;
    validFrom: string | null;
    validTo: string;
    placeId: number;
    categoryId: number;
    imageUrls: { url: string, fileName: string, prefix: string }[];
}

export default function OfferCreatePage() {
    const navigate = useNavigate();

    const { localTitle, localDescription, localNewPrice, localOldPrice, localValidFrom, localValidTo, localPlaceId, localCategoryId, localImageUrls } = JSON.parse(localStorage.getItem('offerData') || '{}');


    // Core Form State
    const [title, setTitle] = useState(localTitle || '');
    const [description, setDescription] = useState(localDescription || '');
    const [newPrice, setNewPrice] = useState(localNewPrice || '');
    const [oldPrice, setOldPrice] = useState(localOldPrice || '');
    const [validFrom, setValidFrom] = useState(localValidFrom || '');
    const [validTo, setValidTo] = useState(localValidTo || '');
    const [categoryId, setCategoryId] = useState(localCategoryId || '');
    const [imagePreviews, setImagePreviews] = useState<{ url: string, fileName: string, prefix: string }[]>(localImageUrls || []);

    // Place State
    const [places, setPlaces] = useState<Place[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState(localPlaceId || '');
    const [isNewPlace, setIsNewPlace] = useState(false);

    // New Place Form State
    const [placeName, setPlaceName] = useState('');
    const [placeDescription, setPlaceDescription] = useState('');
    const [isOnline, setIsOnline] = useState(false);
    const [offerUrl, setOfferUrl] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    // Fetching / Meta State
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [catsResponse, placesResponse] = await Promise.all([
                    axios.get<Category[]>('/api/Discounts/categories'),
                    axios.get<Place[]>('/api/Places')
                ]);
                setCategories(catsResponse.data);
                setPlaces(placesResponse.data);
            } catch (err) {
                console.error("Failed to load initial data", err);
                setError("Could not load categories or places. Please try refreshing.");
            }
        };
        fetchDependencies();
    }, []);


    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            try {
                const newPreviews = await Promise.all(files.map(async file => {
                    const formData = new FormData();
                    formData.append('file', file);
                    const { data } = await axios.post<{ message: string, url: string, fileName: string, prefix: string }>("/api/File/uploadImage?prefix=offer-images", formData);
                    return { url: data.url, fileName: data.fileName, prefix: data.prefix };
                }));
                setImagePreviews([...imagePreviews, ...newPreviews]);
            } catch (err) {
                console.error("Failed to upload images", err);
                setError("Could not upload images. Please try refreshing.");
            } finally {
                e.target.value = "";
            }

        }
    };

    const removeImage = async (keyToRemove: string) => {
        setImagePreviews(prev => prev.filter((preview) => `${preview.prefix}/${preview.fileName}` !== keyToRemove));
        await axios.delete(`/api/File?prefix=${keyToRemove}`);
    };

    const removeAllImages = async () => {
        imagePreviews.forEach(async (preview) => {
            await removeImage(`${preview.prefix}/${preview.fileName}`);
        });
    }

    useEffect(() => {
        localStorage.setItem('offerData', JSON.stringify({
            localTitle: title,
            localDescription: description,
            localNewPrice: newPrice,
            localOldPrice: oldPrice,
            localValidFrom: validFrom,
            localValidTo: validTo,
            localPlaceId: selectedPlaceId,
            localCategoryId: categoryId,
            localImageUrls: imagePreviews
        }));
        new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
                removeAllImages();
                localStorage.removeItem('offerData');
            }, 180000);
        });
    }, [title, description, newPrice, oldPrice, validFrom, validTo, selectedPlaceId, categoryId, imagePreviews])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            let finalPlaceId = selectedPlaceId;

            // 1. Create Place if needed
            if (isNewPlace) {
                const placeData = {
                    name: placeName,
                    description: placeDescription,
                    isOnline,
                    offerUrl: offerUrl || null,
                    latitude: latitude ? parseFloat(latitude) : null,
                    longitude: longitude ? parseFloat(longitude) : null,
                };

                const placeRes = await axios.post<{ id: number }>('/api/Places', placeData);
                finalPlaceId = placeRes.data.id.toString();
            }

            if (!finalPlaceId) {
                throw new Error("Please select or create a place.");
            }

            if (!categoryId) {
                throw new Error("Please select a category.");
            }

            // 2. Create Offer
            const offerData: OfferData = {
                title,
                description,
                newPrice: parseFloat(newPrice),
                oldPrice: parseFloat(oldPrice),
                validFrom: validFrom ? new Date(validFrom).toISOString() : null,
                validTo: new Date(validTo).toISOString(),
                placeId: parseInt(finalPlaceId),
                categoryId: parseInt(categoryId),
                imageUrls: imagePreviews
            };

            await axios.post('/api/Discounts', offerData);

            // Cloud Image upload is left for future development as requested
            // if (imageFile) { /* Handle external image upload here in the future */ }

            navigate('/offers');
        } catch (err: any) {
            console.error("Error creating offer:", err);
            setError(err.response?.data?.message || err.message || "An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button
                onClick={() => navigate('/offers')}
                className="flex items-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 mb-6 transition-colors"
            >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Offers
            </button>

            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                    Create New <span className="text-primary-500">Offer</span>
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Fill in the details to publish a new discount or deal.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-8 border border-red-200 dark:border-red-800/30">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* --- IMAGE UPLOAD (UI ONLY) --- */}
                <div className="glass-card p-6 rounded-2xl">
                    <h2 className="text-xl font-semibold mb-4">Offer Images</h2>

                    {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                            {imagePreviews.map((preview) => (
                                <div key={`${preview.prefix}/${preview.fileName}`} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                    <img src={preview.url} alt={`Preview ${preview.fileName}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(`${preview.prefix}/${preview.fileName}`)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center w-full">
                        <label className={`flex flex-col items-center justify-center w-full border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:border-zinc-700 transition-all ${imagePreviews.length > 0 ? 'h-32' : 'h-64'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImagePlus className={`${imagePreviews.length > 0 ? 'w-6 h-6 mb-2' : 'w-10 h-10 mb-3'} text-zinc-400`} />
                                <p className={`mb-2 text-zinc-500 dark:text-zinc-400 ${imagePreviews.length > 0 ? 'text-sm' : ''}`}>
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                {!imagePreviews.length && <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG or WEBP (MAX. 800x400px)</p>}
                            </div>
                            <input type="file" className="hidden" accept='image/*' multiple onChange={handleImageChange} />
                        </label>
                    </div>
                </div>

                {/* --- BASIC INFO --- */}
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Basic Details</h2>

                    <div>
                        <label className="block text-sm font-medium mb-2">Title *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g. 50% Off Summer Collection"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all min-h-[100px] resize-x"
                            placeholder="Describe your offer..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Category *</label>
                            <select
                                required
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none"
                            >
                                <option value="" disabled>Select a category</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* --- PRICING & DATES --- */}
                <div className="glass-card p-6 rounded-2xl space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Pricing & Dates</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">New Price *</label>
                            <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Old Price (Optional)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={oldPrice}
                                onChange={(e) => setOldPrice(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valid From</label>
                            <input
                                type="datetime-local"
                                value={validFrom}
                                onChange={(e) => setValidFrom(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valid To</label>
                            <input
                                type="datetime-local"
                                value={validTo}
                                onChange={(e) => setValidTo(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* --- PLACE DETAILS --- */}
                <div className="glass-card p-6 rounded-2xl space-y-6 border-2 border-primary-500">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Store / Place</h2>
                        <button
                            type="button"
                            onClick={() => setIsNewPlace(!isNewPlace)}
                            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-1"
                        >
                            {isNewPlace ? (
                                <>Select Existing Place</>
                            ) : (
                                <><Plus className="w-4 h-4" /> Add New Place</>
                            )}
                        </button>
                    </div>

                    {!isNewPlace ? (
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Place *</label>
                            <select
                                required={!isNewPlace}
                                value={selectedPlaceId}
                                onChange={(e) => setSelectedPlaceId(e.target.value)}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all appearance-none"
                            >
                                <option value="" disabled>Select an existing store</option>
                                {places.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div>
                                <label className="block text-sm font-medium mb-2">Store Name *</label>
                                <input
                                    type="text"
                                    required={isNewPlace}
                                    value={placeName}
                                    onChange={(e) => setPlaceName(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="e.g. Mega Store Downtown"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Store Description</label>
                                <input
                                    type="text"
                                    value={placeDescription}
                                    onChange={(e) => setPlaceDescription(e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="Brief description..."
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isOnline}
                                    onChange={(e) => setIsOnline(e.target.checked)}
                                    className="w-5 h-5 rounded border-zinc-300 text-primary-500 focus:ring-primary-500"
                                />
                                <div>
                                    <p className="font-medium">Online Store</p>
                                    <p className="text-sm text-zinc-500">This offer is valid online only.</p>
                                </div>
                            </label>

                            {isOnline ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Offer URL</label>
                                    <input
                                        type="url"
                                        value={offerUrl}
                                        onChange={(e) => setOfferUrl(e.target.value)}
                                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                                    <div className="col-span-full flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Physical Location Coordinates</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={latitude}
                                            onChange={(e) => setLatitude(e.target.value)}
                                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            placeholder="48.8566"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={longitude}
                                            onChange={(e) => setLongitude(e.target.value)}
                                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                            placeholder="2.3522"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full sm:w-auto px-10 py-3 text-lg relative overflow-hidden"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Publishing...
                            </span>
                        ) : (
                            "Publish Offer"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
