import { Link } from 'react-router-dom';
import { Tag, User } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass ">
            <div className="max-w-7xl mx-auto px-4  sm:px-6 lg:px-8 ">
                <div className="justify-between flex grow h-15">

                    {/* Logo */}
                    <div className="shrink-0  flex  items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-primary-500 text-white p-2 rounded-xl group-hover:bg-primary-600 group-hover:shadow-lg transition-all duration-500 shadow-md">
                                <Tag className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-3xl tracking-tight animated-gradient">
                                Sales <span className="text-zinc-800 dark:text-zinc-300">Hub</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="flex items-center">
                            {/* Center Navigation - Desktop */}
                            <div className="hidden md:flex items-center gap-8">
                                <Link to="/" className="nav-button">
                                    Home
                                </Link>
                                <Link to="/offers" className="nav-button">
                                    Offers
                                </Link>
                                <Link to="/map" className="nav-button">
                                    Map
                                </Link>
                            </div>
                        </nav>

                        <span className="text-zinc-600 dark:text-zinc-300 text-2xl select-none">|</span>

                        {/* Right actions */}
                        <div className="flex  items-center space-x-4">
                            <button className="hidden sm:flex btn-primary">
                                <User className="w-4 h-4 mr-2" />
                                Sign In
                            </button>
                        </div>
                    </div>


                </div>

            </div>
        </header>
    );
}
