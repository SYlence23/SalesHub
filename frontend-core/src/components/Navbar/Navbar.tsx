import { Link } from 'react-router-dom';
import { Tag, MapPin, Search, User } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-500 text-white p-2 rounded-xl group-hover:bg-primary-600 transition-colors shadow-md">
                                <Tag className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white">
                                Sales<span className="text-primary-500">Hub</span>
                            </span>
                        </Link>
                    </div>

                    {/* Center Navigation - Desktop */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/offers" className="text-zinc-600 hover:text-primary-500 dark:text-zinc-300 dark:hover:text-primary-400 font-medium transition-colors">
                            Offers
                        </Link>
                        <div className="flex items-center text-zinc-600 hover:text-primary-500 dark:text-zinc-300 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>Cities</span>
                        </div>
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-zinc-600 hover:text-primary-500 dark:text-zinc-300 dark:hover:text-primary-400 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="hidden sm:flex btn-primary">
                            <User className="w-4 h-4 mr-2" />
                            Sign In
                        </button>
                    </div>

                </div>
            </div>
        </header>
    );
}
