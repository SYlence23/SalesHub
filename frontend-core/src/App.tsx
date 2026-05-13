import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/HomePage';
import OfferPage from './pages/OfferPage';
import Login from './pages/Login';
import Register from './pages/Register';
import OfferCreatePage from './pages/OfferCreatePage';
import ProtectedRoute from './components/ProtectedRoute';
import Map from './pages/Map';
import PlacesPage from './pages/PlacesPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';


function App() {
    
    const location = useLocation();
    // Перевіряємо, чи ми зараз на сторінці карти
    const isMapPage = location.pathname === '/map';
    
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow pt-15">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/offers" element={<OfferPage />} />
                    <Route path="/offers/create" element={
                        <ProtectedRoute>
                            <OfferCreatePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<HomePage />} />
                    <Route path="/places" element={<PlacesPage />} />
                    <Route path="/places/:id" element={<PlaceDetailsPage />} />
                    <Route path="/map" element={<Map />} />
                </Routes>
            </main>

            {!isMapPage && (
                <footer className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm mt-auto border-t border-zinc-200 dark:border-zinc-800">
                    <p>&copy; {new Date().getFullYear()} SalesHub. All rights reserved.</p>
                </footer>
            )}
        </div>
    )
}

export default App;