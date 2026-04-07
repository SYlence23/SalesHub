import { Link } from 'react-router-dom';
import { Tag, MapPin, User } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 ">
                <div className="justify-between flex grow">

                    {/* Logo */}
                    <div className="shrink-0  flex  items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-500 text-white p-2 rounded-xl group-hover:bg-primary-600 transition-colors shadow-md">
                                <Tag className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-3xl tracking-tight bg-gradient-to-l from-primary-600 to-primary-500 bg-clip-text text-transparent dark:bg-gradient-to-r dark:from-primary-500 dark:to-primary-300 dark:bg-clip-text dark:text-transparent"> {/*Need to implement logo for dark mode*/}
                                Sales Hub {/*Removed span tag here*/}
                            </span>
                        </Link>
                    </div>

                    <nav className="flex items-center h-20">
                        {/* Center Navigation - Desktop */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link to="/offers" className="text-zinc-600 hover:text-primary-500 dark:text-zinc-300 dark:hover:text-primary-400 font-medium transition-colors">
                                Offers
                            </Link>
                            <div className="flex items-center text-zinc-600 hover:text-primary-500 dark:text-zinc-300 dark:hover:text-primary-400 font-medium transition-colors cursor-pointer">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span>Cities</span>
                            </div>
                        </div>
                    </nav>

                    {/* Right actions */}
                    <div className="flex  items-center space-x-4">
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
