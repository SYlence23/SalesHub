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
import UserProfilePage from './pages/UserProfilePage';
import PublicProfilePage from './pages/PublicProfilePage';
import SingleOfferPage from './pages/SingleOfferPage';
import GoodDealsPage from './pages/GoodDealsPage';
import GoodDealCreatePage from './pages/GoodDealCreatePage';
import GoodDealDetailsPage from './pages/GoodDealDetailsPage';

function App() {
    ``
    const location = useLocation();
    const isMapPage = location.pathname === '/map';

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="grow pt-15">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/offers" element={<OfferPage />} />
                    <Route path="/offers/create" element={
                        <ProtectedRoute>
                            <OfferCreatePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/offers/:id" element={<SingleOfferPage />} />
                    <Route path="/places" element={<PlacesPage />} />
                    <Route path="/places/:id" element={<PlaceDetailsPage />} />
                    <Route path="/map" element={<Map />} />
                    {/* Профіль */}
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <UserProfilePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/profile/:id" element={<PublicProfilePage />} />
                    <Route path="/good-deals" element={<GoodDealsPage />} />
                    <Route path="/good-deals/create" element={
                        <ProtectedRoute>
                            <GoodDealCreatePage />
                        </ProtectedRoute>
                    } />
                    <Route path="/good-deals/:id" element={<GoodDealDetailsPage />} />
                </Routes>
            </main>

            {!isMapPage && (
                <footer className="py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm mt-auto border-t border-zinc-200 dark:border-zinc-800">
                    <p>&copy; {new Date().getFullYear()} SalesHub. Усі права захищені.</p>
                </footer>
            )}
        </div>
    );
}

export default App;