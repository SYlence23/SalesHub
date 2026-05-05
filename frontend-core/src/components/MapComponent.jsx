const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    // Викликаємо ключ із файлу .env
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
});
