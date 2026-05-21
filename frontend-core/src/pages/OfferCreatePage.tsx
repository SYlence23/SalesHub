import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
//import axios from 'axios';
import { ImagePlus, MapPin, Loader2, Plus, ChevronLeft, X, Search, Tag, Sparkles } from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { useJsApiLoader } from '@react-google-maps/api';
import { type Category } from '../components/Offer/OfferFilters';
import localforage from 'localforage';

interface PlaceDTO {
    id: number;
    name: string;
    description: string;
    isOnline: boolean;
    offerUrl: string;
}

interface PlaceCreateDTO {
    name: string;
    description: string;
    isOnline: boolean;
    offerUrl: string;
    latitude: number;
    longitude: number;
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



interface OfferDataForm {
    title: string;
    description: string;
    newPrice: number | string;
    oldPrice: number | string;
    validFrom: string;
    validTo: string;
    placeId: number | string;
    categoryId: number | string;
}

interface OfferDataDTO {
    title: string;
    description: string;
    newPrice: number;
    oldPrice: number;
    validFrom: string | null;
    validTo: string | null;
    placeId: number;
    categoryId: number;
    imageUrls: string[] | null;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ['places'];

const AddressAutocomplete: React.FC<{
    onSelect: (coords: { lat: number, lng: number }, address: string) => void;
    onChange: (address: string) => void;
    isLoaded: boolean;
    onError?: (msg: string | null) => void;
}> = ({ onSelect, onChange, isLoaded, onError }) => {
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
                // Use PlacesService as it's more likely to be enabled than Geocoding API
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
                    // Fallback to geocode if PlacesService fails
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

            // Expanded Lviv Region validation
            if (lat < 47.50 || lat > 51.50 || lng < 21.50 || lng > 26.50) {
                if (onError) onError("Unfortunately, offers can only be created within the Lviv region.");
                return;
            }

            if (onError) onError(null);
            onSelect({ lat, lng }, address);
        } catch (error) {
            console.error("Error geocoding address:", error);
            if (onError) onError("Your API key might need 'Geocoding API' enabled. Please select an address from the dropdown.");
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative">
                <input
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    disabled={!ready}
                    placeholder={ready ? "Enter address (street, house...)" : "Loading..."}
                    className="w-full px-4 py-2 pl-10 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            </div>

            {status === "OK" && (
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
            {status === "ZERO_RESULTS" && (
                <div className="absolute left-0 w-full bg-white dark:bg-zinc-800 mt-2 p-4 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 z-[100] text-sm text-zinc-500">
                    No addresses found. Try being more specific (e.g., add 'Lviv').
                </div>
            )}
        </div>
    );
};

export default function OfferCreatePage() {
    const navigate = useNavigate();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        libraries,
        language: 'uk',
        region: 'UA'
    });

    const localOfferData = JSON.parse(localStorage.getItem('offerData') || '{}');
    const localPlaceData = JSON.parse(localStorage.getItem('placeData') || '{}');

    const [offerForm, setOfferForm] = useState<OfferDataForm>({
        title: localOfferData.title || '',
        description: localOfferData.description || '',
        newPrice: localOfferData.newPrice || '',
        oldPrice: localOfferData.oldPrice || '',
        validFrom: localOfferData.validFrom || '',
        validTo: localOfferData.validTo || '',
        placeId: localOfferData.placeId || '',
        categoryId: localOfferData.categoryId || '',
    })

    const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setOfferForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }



    const [placeForm, setPlaceForm] = useState<PlaceForm>({
        name: localPlaceData.name || '',
        description: localPlaceData.description || '',
        isOnline: localPlaceData.isOnline || false,
        offerUrl: localPlaceData.offerUrl || '',
        latitude: localPlaceData.latitude || 0,
        longitude: localPlaceData.longitude || 0,
        address: localPlaceData.address || '',
    })

    const handlePlaceFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const target = e.target;
        const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
        const name = target.name;
        setPlaceForm(prev => ({
            ...prev,
            [name]: value,
        }));
    }

    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);




    // Place State
    const [places, setPlaces] = useState<PlaceDTO[]>([]);
    const [selectedPlaceId, setSelectedPlaceId] = useState('');
    const [isNewPlace, setIsNewPlace] = useState(false);



    // Fetching / Meta State
    const [categories, setCategories] = useState<Category[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);



    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [catsResponse, placesResponse] = await Promise.all([
                    api.get<Category[]>('/Discounts/categories'),
                    api.get<PlaceDTO[]>('/Places')
                ]);
                setCategories(catsResponse.data);

                // Filter unique places by name
                const uniquePlaces = placesResponse.data.reduce((acc: PlaceDTO[], current) => {
                    const x = acc.find(item => item.name === current.name);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setPlaces(uniquePlaces);
            } catch (err) {
                console.error("Failed to load initial data", err);
                setError("Could not load categories or places. Please try refreshing.");
            }
        };

        const loadOfferImages = async () => {
            const temp = await localforage.getItem('offerImages') || [];
            setImagePreviews((temp as File[]).map((image: File) => URL.createObjectURL(image)));
        }


        loadOfferImages();
        fetchDependencies();
    }, []);




    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newPreviews = [...imagePreviews];
        const draggedItem = newPreviews[draggedIndex];

        newPreviews.splice(draggedIndex, 1);
        newPreviews.splice(index, 0, draggedItem);

        setImagePreviews(newPreviews);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };




    const [isImageLoading, setIsImageLoading] = useState(false);
    const [imageQuantity, setImageQuantity] = useState(0);
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && imagePreviews.length + e.target.files.length > 8) {
            setError("You can only upload up to 8 images");
            return;
        }

        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);

            setIsImageLoading(true);
            setImageQuantity(prev => prev + files.length);

            try {
                const uploadedImages = (await localforage.getItem<File[]>('offerImages')) || [];
                const newImages = [...uploadedImages, ...files];
                await localforage.setItem('offerImages', newImages);

                const previews = newImages.map(file => URL.createObjectURL(file));
                setImagePreviews(previews);

            } catch (err) {
                console.error("Failed to upload images", err);
                setError("Could not upload images. Please try refreshing.");
            } finally {
                setIsImageLoading(false);
                setImageQuantity(0);
                e.target.value = "";
            }

        }
    };

    const removeImage = async (keyToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== keyToRemove));
        const uploadedImages = (await localforage.getItem<File[]>('offerImages')) || [];
        localforage.setItem('offerImages', uploadedImages.filter((_, index) => index !== keyToRemove));
    };

    const removeAllImages = async () => {
        await localforage.removeItem('offerImages');
        setImagePreviews([]);
    }

    useEffect(() => {
        localStorage.setItem('offerData', JSON.stringify(offerForm));
        localStorage.setItem('placeData', JSON.stringify(placeForm));
    }, [offerForm, placeForm])

    useEffect(() => {
        const timer = setTimeout(() => {
            removeAllImages();
            localStorage.removeItem('offerData');
            localStorage.removeItem('placeData');
        }, 180000);
        return () => clearTimeout(timer);
    }, [offerForm, placeForm])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            let finalPlaceId = selectedPlaceId;

            // 1. Validate Place creation
            if (isNewPlace) {
                let currentLat = placeForm.latitude;
                let currentLng = placeForm.longitude;

                // Try manual geocoding if coordinates are missing but address is present
                if (!placeForm.isOnline && (currentLat === 0 || currentLng === 0)) {
                    if (!placeForm.address) {
                        throw new Error("Please enter an address for the store.");
                    }

                    try {
                        if (typeof google === 'undefined') {
                            throw new Error("Google Maps API not loaded yet.");
                        }

                        const results = await getGeocode({
                            address: placeForm.address,
                            componentRestrictions: { country: 'UA' }
                        });

                        if (!results || results.length === 0) {
                            throw new Error("No results found");
                        }

                        const { lat, lng } = await getLatLng(results[0]);

                        // Validation
                        if (lat < 47.50 || lat > 51.50 || lng < 21.50 || lng > 26.50) {
                            throw new Error("Unfortunately, the entered address is outside the Lviv region.");
                        }

                        currentLat = lat;
                        currentLng = lng;
                    } catch (e: any) {
                        console.error("Geocoding failed:", e);
                        throw new Error(`Could not find coordinates for "${placeForm.address}". Please select an address from the dropdown suggestions to be sure.`);
                    }
                }

                if (!placeForm.isOnline && (currentLat === 0 || currentLng === 0)) {
                    throw new Error("Please select a valid address from the dropdown to get location coordinates.");
                }

                const placeData: PlaceCreateDTO = {
                    name: placeForm.name,
                    description: placeForm.description,
                    isOnline: placeForm.isOnline,
                    offerUrl: placeForm.offerUrl,
                    latitude: currentLat,
                    longitude: currentLng,
                };

                const placeRes = await api.post<{ id: number }>('/Places', placeData);
                finalPlaceId = placeRes.data.id.toString();
            }

            if (!finalPlaceId) {
                throw new Error("Please select or create a place.");
            }

            if (!offerForm.categoryId) {
                throw new Error("Please select a category.");
            }

            const imageFiles = (await localforage.getItem<File[]>('offerImages') || []);
            let imageUrls: string[] = [];
            if (imageFiles.length > 0) {
                const objectUrls = Promise.all(imageFiles.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    const response = await api.post<{ message: string, url: string, fileName: string, prefix: string }>('/File/uploadImage?prefix=offer-images', formData);
                    return response.data.url;
                }))
                imageUrls = await objectUrls;
            }
            console.log(imageUrls);
            // 2. Create Offer
            const offerData: OfferDataDTO = {
                ...offerForm,
                newPrice: parseFloat(offerForm.newPrice.toString()),
                oldPrice: offerForm.oldPrice ? parseFloat(offerForm.oldPrice.toString()) : 0,
                validFrom: offerForm.validFrom ? new Date(offerForm.validFrom).toISOString() : null,
                validTo: offerForm.validTo ? new Date(offerForm.validTo).toISOString() : null,
                placeId: parseInt(finalPlaceId),
                categoryId: parseInt(offerForm.categoryId.toString()),
                imageUrls: imageUrls
            };

            await api.post('/Discounts', offerData);

            localStorage.removeItem('offerData');
            localStorage.removeItem('placeData');
            localforage.removeItem('offerImages');

            navigate('/offers');
        } catch (err: any) {
            console.error("Error creating offer:", err);
            const backendError = err.response?.data;
            let errorMessage = "An unexpected error occurred.";

            if (typeof backendError === 'string') {
                errorMessage = backendError;
            } else if (backendError?.message) {
                errorMessage = backendError.message;
            } else if (backendError?.detail) {
                errorMessage = backendError.detail;
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
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
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
                    Створити <span className="text-primary-500">пропозицію</span>
                </h1>
                {/* Type Toggle */}
                <div className="inline-flex bg-zinc-100 dark:bg-zinc-800 rounded-2xl p-1 gap-1 mb-3">
                    <button
                        type="button"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 bg-primary-500 text-white shadow-md"
                    >
                        <Tag className="w-4 h-4" />
                        Знижка
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/good-deals/create')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                        <Sparkles className="w-4 h-4" />
                        Хороша пропозиція
                    </button>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">
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

                    {(imagePreviews.length > 0 || isImageLoading) && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">

                            {imagePreviews.map((preview, index) => (
                                <div
                                    key={index}
                                    className={`relative aspect-square rounded-lg overflow-hidden border ${draggedIndex === index ? 'border-primary-500 opacity-50 scale-95' : 'border-zinc-200 dark:border-zinc-700'} cursor-move transition-all duration-200`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover pointer-events-none" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full transition-colors backdrop-blur-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    {index === 0 && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-500/90 text-white text-xs font-bold rounded shadow-sm backdrop-blur-md">
                                            Main
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isImageLoading && Array.from({ length: imageQuantity }).map((_, i) => (
                                <div key={`loading-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 flex flex-col items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                                    <span className="text-xs text-zinc-500 font-medium">Uploading...</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center w-full">
                        {(imagePreviews.length < 8) && (<label className={`flex flex-col items-center justify-center w-full border-2 border-zinc-300 border-dashed rounded-lg cursor-pointer bg-zinc-50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:border-zinc-700 transition-all ${imagePreviews.length > 0 ? 'h-32' : 'h-64'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <ImagePlus className={`${imagePreviews.length > 0 ? 'w-6 h-6 mb-2' : 'w-10 h-10 mb-3'} text-zinc-400`} />
                                <p className={`mb-2 text-zinc-500 dark:text-zinc-400 ${imagePreviews.length > 0 ? 'text-sm' : ''}`}>
                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                </p>
                                {!imagePreviews.length && <p className="text-xs text-zinc-500 dark:text-zinc-400">PNG, JPG or WEBP (MAX. 800x400px)</p>}
                            </div>
                            <input type="file" className="hidden" accept='image/*' multiple onChange={handleImageChange} />
                        </label>)}

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
                            name="title"
                            value={offerForm.title}
                            onChange={handleOfferFormChange}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            placeholder="e.g. 50% Off Summer Collection"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Description</label>
                        <textarea
                            name="description"
                            value={offerForm.description}
                            onChange={handleOfferFormChange}
                            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all min-h-[100px] resize-x"
                            placeholder="Describe your offer..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Category *</label>
                            <select
                                required
                                name="categoryId"
                                value={offerForm.categoryId}
                                onChange={handleOfferFormChange}
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
                                name="newPrice"
                                value={offerForm.newPrice}
                                onChange={handleOfferFormChange}
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
                                name="oldPrice"
                                value={offerForm.oldPrice}
                                onChange={handleOfferFormChange}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valid From</label>
                            <input
                                type="datetime-local"
                                name="validFrom"
                                value={offerForm.validFrom}
                                onChange={handleOfferFormChange}
                                className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Valid To</label>
                            <input
                                type="datetime-local"
                                name="validTo"
                                value={offerForm.validTo}
                                onChange={handleOfferFormChange}
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
                                    name='name'
                                    value={placeForm.name}
                                    onChange={handlePlaceFormChange}
                                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="e.g. Mega Store Downtown"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Store Description</label>
                                <input
                                    type="text"
                                    name="description"
                                    value={placeForm.description}
                                    onChange={handlePlaceFormChange}
                                    className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    placeholder="Brief description..."
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                <input
                                    type="checkbox"
                                    name="isOnline"
                                    checked={placeForm.isOnline}
                                    onChange={handlePlaceFormChange}
                                    className="w-5 h-5 rounded border-zinc-300 text-primary-500 focus:ring-primary-500"
                                />
                                <div>
                                    <p className="font-medium">Online Store</p>
                                    <p className="text-sm text-zinc-500">This offer is valid online only.</p>
                                </div>
                            </label>

                            {placeForm.isOnline ? (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Offer URL</label>
                                    <input
                                        type="url"
                                        name="offerUrl"
                                        value={placeForm.offerUrl}
                                        onChange={handlePlaceFormChange}
                                        className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 p-4 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-200 dark:border-zinc-800/50">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-2">
                                        <MapPin className="w-4 h-4" />
                                        <span className="text-sm font-medium">Store Location</span>
                                    </div>

                                    <AddressAutocomplete
                                        isLoaded={isLoaded}
                                        onError={setError}
                                        onChange={(address) => {
                                            setPlaceForm(prev => ({
                                                ...prev,
                                                address: address,
                                                // Reset coordinates if address changes manually
                                                latitude: 0,
                                                longitude: 0
                                            }));
                                        }}
                                        onSelect={(coords, address) => {
                                            setPlaceForm(prev => ({
                                                ...prev,
                                                address: address,
                                                latitude: coords.lat,
                                                longitude: coords.lng
                                            }));
                                        }}
                                    />


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
