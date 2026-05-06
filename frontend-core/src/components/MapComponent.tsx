import { useJsApiLoader } from "@react-google-maps/api";

export const useGoogleMapsLoader = () => {
    return useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
        libraries: ['places'],
        language: 'uk',
        region: 'UA'
    });
};