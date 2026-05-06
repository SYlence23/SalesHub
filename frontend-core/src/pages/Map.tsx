import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface MapMarker {
    id: number;
    title: string;
    newPrice: number;
    latitude: number;
    longitude: number;
}

interface Suggestion {
    place_id: string;
    description: string;
}
const StreetSearch: React.FC<{
    onSelect: (coords: { lat: number, lng: number }) => void,
    mapRef: React.MutableRefObject<google.maps.Map | null>
}> = ({ onSelect, mapRef }) => {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            locationBias: { lat: 49.8397, lng: 24.0297, radius: 10000 },
        },
        debounce: 300,
    });

    const goToAddress = async (address: string, placeId?: string) => {
        setValue(address, false);
        clearSuggestions();

        if (!mapRef.current) return;

        try {
            let lat: number, lng: number;

            if (placeId) {
                const service = new google.maps.places.PlacesService(mapRef.current);
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
                    throw new Error("Could not get details from PlacesService");
                }
            } else {
                const results = await getGeocode({ address });
                const coords = await getLatLng(results[0]);
                lat = coords.lat;
                lng = coords.lng;
            }

            onSelect({ lat, lng });

            if (mapRef.current) {
                mapRef.current.setCenter({ lat, lng });
                mapRef.current.setZoom(17);
                mapRef.current.panTo({ lat, lng });
                console.log("Фокус переміщено на:", address);
            }
        } catch (error) {
            console.error("Помилка при отриманні координат:", error);
            alert("Не вдалося знайти розташування. Спробуйте вибрати адресу зі списку.");
        }
    };

    const handleButtonClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.length > 0) {
            goToAddress(data[0].description, data[0].place_id);
        } else if (value) {
            goToAddress(value);
        }
    };

    return (
        <div className="absolute top-20 left-4 z-[100] w-80">
            <form onSubmit={handleButtonClick} className="flex gap-2">
                <div className="relative flex-grow">
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        placeholder={ready ? "Введіть вулицю або адресу..." : "Завантаження..."}
                        className="w-full p-2.5 px-4 rounded-xl shadow-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all text-black"
                    />

                    {status === "OK" && (
                        <ul className="absolute left-0 w-full bg-white dark:bg-zinc-800 mt-2 rounded-xl shadow-2xl border border-zinc-200 overflow-hidden z-[9999] list-none p-0 m-0">
                            {data.map(({ place_id, description }: Suggestion) => (
                                <li
                                    key={place_id}
                                    onClick={() => goToAddress(description, place_id)}
                                    className="p-3 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm border-b last:border-0 border-zinc-100 dark:border-zinc-700 text-black dark:text-white bg-white dark:bg-zinc-800"
                                >
                                    {description}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </form>
        </div>
    );
};

const MapPage: React.FC = () => {

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        libraries: ['places'],
        language: 'uk',
        region: 'UA'
    });

    // States 
    const [center, setCenter] = useState({ lat: 49.8397, lng: 24.0297 });
    const [zoom, setZoom] = useState(14);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
    const [offerDetails, setOfferDetails] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const mapRef = useRef<google.maps.Map | null>(null);


    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const lat = query.get('lat');
        const lng = query.get('lng');
        if (lat && lng) {
            const initialPos = { lat: parseFloat(lat.replace(',', '.')), lng: parseFloat(lng.replace(',', '.')) };
            setCenter(initialPos);
            setUserLocation(initialPos);
            setZoom(16);
        }
    }, []);

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

    const openDiscount = async (id: number) => {
        setIsDetailLoading(true);
        try {
            const response = await fetch(`/api/Map/offer/${id}`);
            if (response.ok) {
                const data = await response.json();
                setOfferDetails(data);
                setIsModalOpen(true);
            }
        } catch (error) {
            console.error('Error fetching discount details:', error);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleStreetSelect = useCallback(({ lat, lng }: { lat: number, lng: number }) => {
        setCenter({ lat, lng });
        setZoom(17);
    }, []);

    const shareLocation = () => {
        if (!navigator.geolocation) {
            alert('Геолокація не підтримується вашим браузером.');
            return;
        }
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            setCenter({ lat: latitude, lng: longitude });
            setZoom(16);
            setUserLocation({ lat: latitude, lng: longitude });
            if (mapRef.current) mapRef.current.panTo({ lat: latitude, lng: longitude });
        });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setOfferDetails(null);
    };

    useEffect(() => {
        document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    }, [isModalOpen]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => { if (event.key === 'Escape') closeModal(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return isLoaded ? (
        <div className="w-full flex-grow relative min-h-[calc(100vh-60px)]">

            <StreetSearch onSelect={handleStreetSelect} mapRef={mapRef} />

            <button
                onClick={shareLocation}
                className="absolute bottom-5 right-16 z-10 bg-zinc-500 hover:bg-zinc-600 text-white p-2.5 px-4 text-sm rounded-full shadow-xl transition-colors flex items-center gap-2"
            >
                📍 Моя локація
            </button>

            <GoogleMap
                mapContainerClassName="absolute inset-0 w-full h-full"
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onIdle={fetchMarkers}
            >
                {userLocation && (
                    <Marker
                        position={userLocation}
                        icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                    />
                )}

                {markers.map(marker => (
                    <Marker
                        key={marker.id}
                        position={{ lat: marker.latitude, lng: marker.longitude }}
                        onClick={() => setSelectedMarker(marker)}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.latitude, lng: selectedMarker.longitude }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="text-black p-2 min-w-[150px]">
                            <h3 className="font-bold mb-1">{selectedMarker.title}</h3>
                            <p className="text-emerald-600 font-semibold">{selectedMarker.newPrice} грн</p>
                            <button
                                onClick={() => openDiscount(selectedMarker.id)}
                                className="w-full bg-blue-600 text-white py-1.5 rounded text-sm mt-2 hover:bg-blue-700 transition-colors"
                            >
                                {isDetailLoading ? 'Завантаження...' : 'Відкрити знижку'}
                            </button>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* Modal - відображення оферу */}
            {isModalOpen && offerDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
                        <button onClick={closeModal} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-black/20 hover:bg-black/40 text-white rounded-full transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        {offerDetails.allImages?.[0] && (
                            <div className="w-full h-48 bg-zinc-200">
                                <img src={offerDetails.allImages[0]} alt={offerDetails.title} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="p-6">
                            <h2 className="text-2xl font-bold dark:text-white mb-1">{offerDetails.title}</h2>
                            <p className="text-blue-600 font-medium mb-4">{offerDetails.storeName}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <span className="text-2xl font-bold text-emerald-600">{offerDetails.newPrice} грн</span>
                                <span className="text-sm text-gray-500">До {new Date(offerDetails.validTo).toLocaleDateString()}</span>
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