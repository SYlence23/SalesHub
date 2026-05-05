import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

interface MapMarker {
    id: number;
    title: string;
    newPrice: number;
    latitude: number;
    longitude: number;
}

const MapPage: React.FC = () => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        // Використовуємо VITE_ префікс для твого проекту
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        language: 'uk',
        region: 'UA'
    });

    const [center, setCenter] = useState(() => {
        const query = new URLSearchParams(window.location.search);
        const lat = query.get('lat');
        const lng = query.get('lng');
        if (lat && lng) {
            return { lat: parseFloat(lat.replace(',', '.')), lng: parseFloat(lng.replace(',', '.')) };
        }
        return { lat: 49.8397, lng: 24.0297 };
    });

    const [zoom, setZoom] = useState(() => {
        const query = new URLSearchParams(window.location.search);
        return (query.get('lat') && query.get('lng')) ? 16 : 14;
    });

    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(() => {
        const query = new URLSearchParams(window.location.search);
        const lat = query.get('lat');
        const lng = query.get('lng');
        if (lat && lng) {
            return { lat: parseFloat(lat.replace(',', '.')), lng: parseFloat(lng.replace(',', '.')) };
        }
        return null;
    });

    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [offerDetails, setOfferDetails] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const mapRef = useRef<google.maps.Map | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const fetchMarkers = async () => {
        if (!mapRef.current) return;

        const bounds = mapRef.current.getBounds();
        if (!bounds) return;

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        try {
            const response = await fetch(`/api/Map/markers?minLat=${sw.lat()}&maxLat=${ne.lat()}&minLon=${sw.lng()}&maxLon=${ne.lng()}`);
            if (response.ok) {
                const data = await response.json();
                setMarkers(data);
            }
        } catch (error) {
            console.error('Failed to fetch markers:', error);
        }
    };

    const onIdle = useCallback(() => {
        fetchMarkers();
    }, []);

    const openDiscount = async (id: number) => {
        try {
            const response = await fetch(`/api/Map/offer/${id}`);
            if (response.ok) {
                const data = await response.json();
                setOfferDetails(data);
                setIsModalOpen(true);
            } else {
                alert('Не вдалося знайти знижку.');
            }
        } catch (error) {
            console.error('Error fetching discount details:', error);
        }
    };

    const shareLocation = () => {
        if (!navigator.geolocation) {
            alert('Геолокація не підтримується вашим браузером.');
            return;
        }

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            // Center map on user and leave a marker
            setCenter({ lat: latitude, lng: longitude });
            setZoom(16);
            setUserLocation({ lat: latitude, lng: longitude });

            if (mapRef.current) {
                mapRef.current.panTo({ lat: latitude, lng: longitude });
            }

            try {
                const response = await fetch('/api/Map/share-location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ latitude, longitude })
                });

                if (response.ok) {
                    //const data = await response.json();
                    alert(`Локацію поширено!`);
                } else {
                    alert('Помилка при поширенні локації.');
                }
            } catch (error) {
                console.error('Error sharing location:', error);
            }
        }, () => {
            alert('Не вдалося отримати вашу локацію.');
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setOfferDetails(null); // Очищаємо дані
    };

    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isModalOpen]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return isLoaded ? (
        <div className="w-full flex-grow relative min-h-[calc(100vh-60px)]">
            {/* Кнопка швидкого повернення назад (UI/UX порада) */}
            <button
                onClick={() => window.history.back()}
                className="absolute top-20 left-4 z-10 bg-white dark:bg-zinc-900 p-2 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
                ← Назад
            </button>

            {/* Кнопка поширення локації */}
            <button
                onClick={shareLocation}
                className="absolute bottom-16 right-6 z-10 bg-gray-500 text-white p-1.5 px-3 text-sm rounded-full shadow-md hover:bg-gray-600 transition-colors"
            >
                📍 Поділитися локацією
            </button>

            <GoogleMap
                mapContainerClassName="absolute inset-0 w-full h-full"
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onIdle={onIdle}
            >
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{
                            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                        }}
                    />
                )}

                {markers.map(marker => (
                    marker.latitude && marker.longitude ? (
                        <Marker
                            key={marker.id}
                            position={{ lat: marker.latitude, lng: marker.longitude }}
                            onClick={() => setSelectedMarker(marker)}
                        />
                    ) : null
                ))}

                {selectedMarker && selectedMarker.latitude && selectedMarker.longitude && (
                    <InfoWindow
                        position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                        onCloseClick={() => {
                            setSelectedMarker(null);
                            setOfferDetails(null);
                        }}
                    >
                        <div className="text-black p-2 min-w-[150px] max-w-[250px]">
                            <h3 className="font-bold text-base mb-1">{selectedMarker.title}</h3>
                            <p className="text-emerald-600 font-semibold mb-3">{selectedMarker.newPrice} грн</p>

                            <button
                                onClick={() => openDiscount(selectedMarker.id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm transition-colors mt-2"
                            >
                                Відкрити знижку
                            </button>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Modal */}
            {isModalOpen && offerDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {offerDetails.allImages && offerDetails.allImages.length > 0 ? (
                            <div className="w-full h-48 bg-zinc-200 dark:bg-zinc-800 relative">
                                <img src={offerDetails.allImages[0]} alt={offerDetails.title} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-full h-32 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
                        )}

                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{offerDetails.title}</h2>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{offerDetails.storeName}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{offerDetails.newPrice} грн</p>
                                    {offerDetails.oldPrice && (
                                        <p className="text-sm text-gray-500 line-through">{offerDetails.oldPrice} грн</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                    {offerDetails.description}
                                </p>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Категорія</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{offerDetails.categoryName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Діє до</p>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(offerDetails.validTo).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                                    <p className="text-xs text-gray-500 mb-1">Адреса</p>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-start gap-2">
                                        <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {offerDetails.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    ) : (
        <div className="flex items-center justify-center flex-grow min-h-[calc(100vh-60px)]">
            <div className="animate-pulse text-zinc-500">Завантаження карти...</div>
        </div>
    );
};

export default MapPage;
