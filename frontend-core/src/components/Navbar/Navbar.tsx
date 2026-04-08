import { Link, useLocation } from 'react-router-dom';
import { Home, Tag, Map as MapIcon } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();

    const navLinks = [
        {
            name: "Home",
            path: "/",
            icon: Home
        },
        {
            name: "Offers",
            path: "/offers",
            icon: Tag
        },
        {
            name: "Map",
            path: "/map",
            icon: MapIcon
        }
    ];

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 glass">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="justify-between flex grow h-15">

                        {/* Logo */}
                        <div className="shrink-0 flex items-center">
                            <Link to="/" className="flex items-center gap-2 group">
                                <span className="font-bold text-3xl tracking-tight animated-gradient">
                                    Sales <span className="text-zinc-800 dark:text-zinc-300">Hub</span>
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-6">
                            <nav className="flex items-center">
                                {/* Center Navigation - Desktop */}
                                <div className="hidden sm:flex items-center gap-4">
                                    {navLinks.map((link) => {
                                        const isActive = location.pathname === link.path;
                                        return (
                                            <Link key={link.name} to={link.path} className={`nav-button ${isActive ? 'text-primary-500 dark:text-primary-400' : ''}`}>
                                                {link.name}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </nav>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-3">
                            <button className="flex btn-primary text-sm px-4 py-2">
                                Log In
                            </button>
                            <button className="hidden sm:flex btn-secondary text-sm px-4 py-2">
                                Sign Up
                            </button>
                        </div>

                    </div>
                </div>
            </header>

            {/* Bottom Navigation - Mobile */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-zinc-200 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = location.pathname === link.path;
                        return (
                            <Link key={link.name} to={link.path} className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive ? 'text-primary-500' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-sm' : ''} />
                                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{link.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
