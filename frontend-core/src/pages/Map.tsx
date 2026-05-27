import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { X, ChevronLeft, ChevronRight, ExternalLink, MapPin, Clock, Tag, Store, Loader2, Layers } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MapMarker {
    id: number;
    title: string;
    newPrice: number;
    oldPrice?: number;
    mainImageUrl?: string;
    storeName?: string;
    latitude: number;
    longitude: number;
    markerColor?: string;
    categoryId: number;
}

interface MarkerCluster {
    latitude: number;
    longitude: number;
    offers: MapMarker[];
    markerColor?: string;
    categoryId: number;
}

function clusterByLocation(markers: MapMarker[]): MarkerCluster[] {
    const map = new Map<string, MapMarker[]>();
    for (const m of markers) {
        const key = `${m.latitude.toFixed(6)},${m.longitude.toFixed(6)}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(m);
    }
    return Array.from(map.values()).map(offers => ({
        latitude: offers[0].latitude,
        longitude: offers[0].longitude,
        offers,
        markerColor: offers[0].markerColor,
        categoryId: offers[0].categoryId,
    }));
}

function calcDiscountFromPrices(newPrice: number, oldPrice?: number) {
    if (!oldPrice || oldPrice <= 0) return 0;
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

interface OfferDetail {
    id: number;
    title: string;
    description: string;
    isActive: boolean;
    categoryName: string;
    newPrice: number;
    oldPrice?: number;
    validFrom?: string;
    validTo?: string;
    storeName: string;
    storeDescription: string;
    address?: string;
    isOnline: boolean;
    offerUrl?: string;
    imageUrls: string[];
    saveCount: number;
    likeCount: number;
    dislikeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80';

// ─── Dark Map Styles ──────────────────────────────────────────────────────────

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#64779e' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry.stroke', stylers: [{ color: '#334e87' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'poi.park', elementType: 'geometry.fill', stylers: [{ color: '#023e58' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#3C7680' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b0d5ce' }] },
    { featureType: 'road.highway', elementType: 'labels.text.stroke', stylers: [{ color: '#023e58' }] },
    { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'transit', elementType: 'labels.text.stroke', stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'transit.line', elementType: 'geometry.fill', stylers: [{ color: '#283d6a' }] },
    { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#3a4762' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
];

// ─── Hook: detect system dark mode ────────────────────────────────────────────

function useIsDarkMode() {
    const [isDark, setIsDark] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : false,
    );

    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isDark;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('uk-UA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function calcDiscount(newPrice: number, oldPrice?: number) {
    if (!oldPrice || oldPrice <= 0) return 0;
    return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function resolveImageUrl(url: string) {
    if (!url) return FALLBACK_IMAGE;
    return url.startsWith('http') ? url : `https://localhost:7094${url}`;
}

// ─── StreetSearch ─────────────────────────────────────────────────────────────

const StreetSearch: React.FC<{
    onSelect: (coords: { lat: number; lng: number }) => void;
    mapRef: React.MutableRefObject<google.maps.Map | null>;
}> = ({ onSelect, mapRef }) => {
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
                } else throw new Error('Could not get details');
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
            }
        } catch {
            alert('Could not find location. Try choosing the address from the list.');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (data.length > 0) goToAddress(data[0].description, data[0].place_id);
        else if (value) goToAddress(value);
    };

    return (
        <div className="absolute top-4 left-4 z-[100] w-72 sm:w-80">
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={!ready}
                        placeholder={ready ? 'Введіть вулицю або адресу...' : 'Завантаження...'}
                        className="w-full p-2.5 px-4 rounded-xl shadow-2xl border border-zinc-200 bg-white dark:bg-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-400 transition-all text-black text-sm"
                    />
                    {status === 'OK' && (
                        <ul className="absolute left-0 w-full bg-white dark:bg-zinc-800 mt-2 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-[9999] list-none p-0 m-0">
                            {data.map(({ place_id, description }) => (
                                <li
                                    key={place_id}
                                    onClick={() => goToAddress(description, place_id)}
                                    className="p-3 px-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm border-b last:border-0 border-zinc-100 dark:border-zinc-700 text-black dark:text-white"
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

// ─── Hover Tooltip (desktop only) ─────────────────────────────────────────────

const MapTooltip: React.FC<{ marker: MapMarker; pos: { x: number; y: number } }> = ({
    marker,
    pos,
}) => {
    const discount = calcDiscount(marker.newPrice, marker.oldPrice);
    const imgSrc = marker.mainImageUrl
        ? resolveImageUrl(marker.mainImageUrl)
        : FALLBACK_IMAGE;

    return (
        <div
            className="fixed z-[300] pointer-events-none hidden lg:block animate-fade-in"
            style={{ left: pos.x + 18, top: pos.y, transform: 'translateY(-50%)' }}
        >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden w-56">
                {/* Image */}
                <div className="h-32 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative">
                    <img
                        src={imgSrc}
                        alt={marker.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                    {discount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow">
                            −{discount}%
                        </span>
                    )}
                </div>
                {/* Info */}
                <div className="p-3">
                    {marker.storeName && (
                        <p className="text-[11px] text-primary-500 font-semibold mb-0.5 truncate">{marker.storeName}</p>
                    )}
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-2">
                        {marker.title}
                    </h4>
                    <div className="flex items-baseline gap-2">
                        <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                            {marker.newPrice.toLocaleString('uk-UA')} ₴
                        </span>
                        {marker.oldPrice && marker.oldPrice > 0 && (
                            <span className="text-xs text-zinc-400 line-through">
                                {marker.oldPrice.toLocaleString('uk-UA')} ₴
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5">Натисніть для деталей →</p>
                </div>
            </div>
        </div>
    );
};

// ─── Panel / Bottom-sheet content ─────────────────────────────────────────────

const OfferPanelContent: React.FC<{
    offer: OfferDetail;
    onClose: () => void;
    onNavigate: () => void;
    activeImg: number;
    setActiveImg: (i: number) => void;
}> = ({ offer, onClose, onNavigate, activeImg, setActiveImg }) => {
    const discount = calcDiscount(offer.newPrice, offer.oldPrice);
    const images = offer.imageUrls?.length ? offer.imageUrls : [FALLBACK_IMAGE];
    const isExpired = offer.validTo ? new Date(offer.validTo) < new Date() : false;

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Деталі знижки</span>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    aria-label="Закрити"
                >
                    <X className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </button>
            </div>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto">

                {/* Image Gallery */}
                <div className="relative h-52 sm:h-60 bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                    <img
                        src={resolveImageUrl(images[activeImg])}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                        {discount > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                −{discount}%
                            </span>
                        )}
                        <span className={`text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md ${offer.isActive && !isExpired ? 'bg-emerald-500' : 'bg-zinc-500'}`}>
                            {offer.isActive && !isExpired ? '● Активна' : '● Завершилась'}
                        </span>
                    </div>
                    {/* Gallery nav */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={() => setActiveImg((activeImg - 1 + images.length) % images.length)}
                                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setActiveImg((activeImg + 1) % images.length)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    {/* Dot indicators */}
                    {images.length > 1 && (
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveImg(i)}
                                    className={`h-1.5 rounded-full transition-all duration-200 ${i === activeImg ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="p-4 space-y-4">

                    {/* Category + Title */}
                    <div>
                        <p className="text-xs font-bold text-primary-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                            <Tag className="w-3 h-3" /> {offer.categoryName}
                        </p>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">
                            {offer.title}
                        </h2>
                    </div>

                    {/* Price */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/70 rounded-xl p-3.5">
                        <div className="flex items-end gap-2.5 flex-wrap">
                            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
                                {offer.newPrice.toFixed(2)}
                                <span className="text-xl ml-1">₴</span>
                            </span>
                            {discount > 0 && (
                                <span className="mb-1 bg-red-100 dark:bg-red-900/30 text-red-500 text-sm font-bold px-2 py-0.5 rounded-lg">
                                    −{discount}%
                                </span>
                            )}
                        </div>
                        {offer.oldPrice && offer.oldPrice > 0 && (
                            <p className="text-zinc-400 text-sm line-through mt-0.5">
                                Було {offer.oldPrice.toFixed(2)} ₴
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    {offer.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                            {offer.description}
                        </p>
                    )}

                    {/* Store info */}
                    <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Store className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{offer.storeName}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${offer.isOnline
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                {offer.isOnline ? 'Онлайн' : 'Фізичний'}
                            </span>
                        </div>
                        {offer.address && !offer.isOnline && (
                            <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-zinc-600 dark:text-zinc-300">{offer.address}</span>
                            </div>
                        )}
                        {offer.storeDescription && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-6">
                                {offer.storeDescription}
                            </p>
                        )}
                    </div>

                    {/* Validity period */}
                    {(offer.validFrom || offer.validTo) && (
                        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span>
                                {offer.validFrom && `З ${formatDate(offer.validFrom)} `}
                                {offer.validTo && `до ${formatDate(offer.validTo)}`}
                            </span>
                        </div>
                    )}

                    {/* Ratings summary */}
                    {(offer.likeCount > 0 || offer.dislikeCount > 0) && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-emerald-500 font-semibold">👍 {offer.likeCount}</span>
                            <span className="text-red-400 font-semibold">👎 {offer.dislikeCount}</span>
                            <span className="text-zinc-400">· {offer.saveCount} збережень</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-1 pb-6">
                        <button
                            onClick={onNavigate}
                            className="w-full bg-primary-500 hover:bg-primary-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Відкрити повну сторінку
                        </button>
                        {offer.isOnline && offer.offerUrl && (
                            <a
                                href={offer.offerUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:border-primary-400 hover:text-primary-500 transition-all text-sm"
                            >
                                Перейти на сайт магазину
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Loading skeleton for panel ───────────────────────────────────────────────

const PanelLoader: React.FC = () => (
    <div className="flex flex-col items-center justify-center gap-3 p-12 h-full">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Завантаження деталей...</p>
    </div>
);

// ─── Cluster List Panel ───────────────────────────────────────────────────────

const ClusterListPanel: React.FC<{
    offers: MapMarker[];
    onSelectOffer: (marker: MapMarker) => void;
    onClose: () => void;
}> = ({ offers, onSelectOffer, onClose }) => {
    const storeName = offers[0]?.storeName ?? 'Заклад';

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0 bg-white dark:bg-zinc-900">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
                        <Layers className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{storeName}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{offers.length} пропозиції в цьому місці</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors flex-shrink-0 ml-2"
                    aria-label="Закрити"
                >
                    <X className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                </button>
            </div>

            {/* Offer list */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {offers.map((offer) => {
                    const discount = calcDiscountFromPrices(offer.newPrice, offer.oldPrice);
                    const imgSrc = offer.mainImageUrl
                        ? (offer.mainImageUrl.startsWith('http') ? offer.mainImageUrl : `https://localhost:7094${offer.mainImageUrl}`)
                        : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80';

                    return (
                        <button
                            key={offer.id}
                            onClick={() => onSelectOffer(offer)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-left group"
                        >
                            {/* Thumbnail */}
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                                <img
                                    src={imgSrc}
                                    alt={offer.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'; }}
                                />
                                {discount > 0 && (
                                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded shadow">
                                        −{discount}%
                                    </span>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: offer.markerColor ?? '#6366f1' }}
                                    />
                                </div>
                                <h4 className="font-semibold text-sm text-zinc-900 dark:text-white leading-snug line-clamp-2 mb-1.5">
                                    {offer.title}
                                </h4>
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                    <span className="text-base font-extrabold text-zinc-900 dark:text-white">
                                        {offer.newPrice.toLocaleString('uk-UA')} ₴
                                    </span>
                                    {offer.oldPrice && offer.oldPrice > 0 && (
                                        <span className="text-xs text-zinc-400 line-through">
                                            {offer.oldPrice.toLocaleString('uk-UA')} ₴
                                        </span>
                                    )}
                                </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ─── MapPage ──────────────────────────────────────────────────────────────────

const MapPage: React.FC = () => {
    const isDarkMode = useIsDarkMode();

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        libraries: ['places'],
        language: 'uk',
        region: 'UA',
    });

    const navigate = useNavigate();

    // Map core state
    const [center, setCenter] = useState({ lat: 49.8397, lng: 24.0297 });
    const [zoom, setZoom] = useState(14);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [markers, setMarkers] = useState<MapMarker[]>([]);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Hover tooltip (desktop only)
    const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    // Detail panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isPanelLoading, setIsPanelLoading] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState<OfferDetail | null>(null);
    const [activeImg, setActiveImg] = useState(0);
    const [clusterOffers, setClusterOffers] = useState<MapMarker[] | null>(null);

    // Track global mouse position for tooltip
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
            if (hoveredMarker) setTooltipPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', onMove);
        return () => window.removeEventListener('mousemove', onMove);
    }, [hoveredMarker]);

    // Lock body scroll on mobile when sheet is open
    useEffect(() => {
        const isMobile = window.innerWidth < 1024;
        document.body.style.overflow = isPanelOpen && isMobile ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isPanelOpen]);

    // ESC closes panel
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Read ?lat=&lng= from URL
    useEffect(() => {
        const q = new URLSearchParams(window.location.search);
        const lat = q.get('lat');
        const lng = q.get('lng');
        if (lat && lng) {
            const pos = {
                lat: parseFloat(lat.replace(',', '.')),
                lng: parseFloat(lng.replace(',', '.')),
            };
            setCenter(pos);
            setUserLocation(pos);
            setZoom(16);
        }
    }, []);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    // Fetch markers whenever map viewport changes
    const fetchMarkers = async () => {
        if (!mapRef.current) return;
        const bounds = mapRef.current.getBounds();
        if (!bounds) return;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        try {
            const res = await fetch(
                `/api/Map/markers?minLat=${sw.lat()}&maxLat=${ne.lat()}&minLon=${sw.lng()}&maxLon=${ne.lng()}`
            );
            if (res.ok) setMarkers(await res.json());
        } catch (err) {
            console.error('Failed to fetch markers:', err);
        }
    };

    // Hover handlers
    const handleMarkerMouseOver = (cluster: MarkerCluster) => {
        setHoveredMarker(cluster.offers[0]);
        setTooltipPos({ x: mousePos.current.x, y: mousePos.current.y });
    };
    const handleMarkerMouseOut = () => {
        setHoveredMarker(null);
        setTooltipPos(null);
    };

    // Click → open side panel / bottom sheet with full details
    const handleMarkerClick = async (marker: MapMarker) => {
        setHoveredMarker(null);
        setTooltipPos(null);
        setClusterOffers(null);
        setIsPanelOpen(true);
        setIsPanelLoading(true);
        setSelectedOffer(null);
        setActiveImg(0);
        try {
            const res = await fetch(`/api/Map/offer/${marker.id}`);
            if (res.ok) setSelectedOffer(await res.json());
        } catch (err) {
            console.error('Error fetching offer details:', err);
        } finally {
            setIsPanelLoading(false);
        }
    };

    const handleClusterClick = (cluster: MarkerCluster) => {
        setHoveredMarker(null);
        setTooltipPos(null);
        if (cluster.offers.length === 1) {
            handleMarkerClick(cluster.offers[0]);
        } else {
            setClusterOffers(cluster.offers);
            setSelectedOffer(null);
            setIsPanelOpen(true);
            setIsPanelLoading(false);
        }
    };

    const closePanel = () => {
        setIsPanelOpen(false);
        setSelectedOffer(null);
        setClusterOffers(null);
    };

    const handleStreetSelect = useCallback(({ lat, lng }: { lat: number; lng: number }) => {
        setCenter({ lat, lng });
        setZoom(17);
    }, []);

    const shareLocation = () => {
        if (!navigator.geolocation) { alert('Геолокація не підтримується.'); return; }
        navigator.geolocation.getCurrentPosition(({ coords }) => {
            const pos = { lat: coords.latitude, lng: coords.longitude };
            setCenter(pos);
            setZoom(16);
            setUserLocation(pos);
            mapRef.current?.panTo(pos);
        });
    };

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center flex-grow min-h-[calc(100vh-60px)]">
                <div className="animate-pulse text-zinc-500">Завантаження карти...</div>
            </div>
        );
    }

    // Shared panel content (used in both desktop panel and mobile sheet)
    const panelContent = isPanelLoading ? (
        <PanelLoader />
    ) : selectedOffer ? (
        <OfferPanelContent
            offer={selectedOffer}
            onClose={closePanel}
            onNavigate={() => navigate(`/offers/${selectedOffer.id}`)}
            activeImg={activeImg}
            setActiveImg={setActiveImg}
        />
    ) : clusterOffers && clusterOffers.length > 1 ? (
        <ClusterListPanel
            offers={clusterOffers}
            onSelectOffer={(marker) => handleMarkerClick(marker)}
            onClose={closePanel}
        />
    ) : null;

    return (
        <div className="w-full flex-grow flex flex-col lg:flex-row relative min-h-[calc(100vh-60px)] overflow-hidden">

            {/* ── Map area ─────────────────────────────────────────────────── */}
            <div className="relative flex-1 min-h-[55vh] lg:min-h-0">
                {/* Search bar */}
                <StreetSearch onSelect={handleStreetSelect} mapRef={mapRef} />

                {/* My Location button */}
                <button
                    onClick={shareLocation}
                    className="absolute bottom-5 right-16 z-10 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 p-2.5 px-4 text-sm rounded-full shadow-xl transition-colors flex items-center gap-2"
                >
                    📍 Моя локація
                </button>

                <GoogleMap
                    mapContainerClassName="absolute inset-0 w-full h-full"
                    center={center}
                    zoom={zoom}
                    onLoad={onMapLoad}
                    onIdle={fetchMarkers}
                    options={{
                        styles: isDarkMode ? DARK_MAP_STYLES : undefined,
                        disableDefaultUI: false,
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                        panControl: false,
                        gestureHandling: 'greedy',
                    }}
                >
                    {/* User location marker */}
                    {userLocation && (
                        <Marker
                            position={userLocation}
                            icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                        />
                    )}

                    {/* Offer markers — clustered by location */}
                    {clusterByLocation(markers).map((cluster) => {
                        const isMulti = cluster.offers.length > 1;
                        const baseColor = cluster.markerColor ?? '#6366f1';
                        return (
                            <Marker
                                key={`${cluster.latitude.toFixed(6)},${cluster.longitude.toFixed(6)}`}
                                position={{ lat: cluster.latitude, lng: cluster.longitude }}
                                onMouseOver={() => handleMarkerMouseOver(cluster)}
                                onMouseOut={handleMarkerMouseOut}
                                onClick={() => handleClusterClick(cluster)}
                                label={isMulti ? {
                                    text: cluster.offers.length.toString(),
                                    color: '#FFFFFF',
                                    fontWeight: 'bold',
                                    fontSize: '11px',
                                } : undefined}
                                icon={{
                                    path: isMulti
                                        ? 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'
                                        : 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                                    fillColor: baseColor,
                                    fillOpacity: 1,
                                    strokeWeight: isMulti ? 2.5 : 1,
                                    strokeColor: isMulti ? '#FFFFFF' : '#FFFFFF',
                                    scale: isMulti ? 1.9 : 1.5,
                                    anchor: new google.maps.Point(12, 22),
                                }}
                            />
                        );
                    })}
                </GoogleMap>
            </div>

            {/* ── Desktop side panel (lg+) ──────────────────────────────────── */}
            <div
                className={`hidden lg:flex flex-col border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-[width] duration-300 ease-in-out overflow-hidden ${isPanelOpen ? 'w-[420px]' : 'w-0'}`}
            >
                {isPanelOpen && panelContent}
            </div>

            {/* ── Mobile bottom sheet (< lg) ────────────────────────────────── */}
            {isPanelOpen && (
                <div className="lg:hidden fixed inset-0 z-[500]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                        onClick={closePanel}
                    />
                    {/* Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl max-h-[88vh] flex flex-col animate-slide-up overflow-hidden">
                        {/* Drag handle */}
                        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                        </div>
                        {/* Scrollable content */}
                        <div className="flex-1 overflow-y-auto">
                            {panelContent}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hover tooltip (desktop only, hidden when panel is open) ───── */}
            {hoveredMarker && tooltipPos && !isPanelOpen && (
                <MapTooltip marker={hoveredMarker} pos={tooltipPos} />
            )}
        </div>
    );
};

export default MapPage;