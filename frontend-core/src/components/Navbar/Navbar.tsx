import { Link } from 'react-router-dom';
import { User, HomeIcon } from 'lucide-react';

export default function Navbar() {

    const navLinks = [
        {
            name: "Home",
            path: "/",
            icon: null
        },
        {
            name: "Offers",
            path: "/offers",
            icon: null
        },
        {
            name: "Map",
            path: "/map",
            icon: null
        }
    ]

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass ">
            <div className="mx-auto px-4  sm:px-6 lg:px-8 ">
                <div className="justify-between flex grow h-15">

                    {/* Logo */}
                    <div className="shrink-0  flex  items-center">
                        <Link to="/" className="flex items-center gap-2 group">

                            <span className="font-bold  text-3xl tracking-tight animated-gradient">
                                Sales <span className="text-zinc-800 dark:text-zinc-300">Hub</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-6">
                        <nav className="flex items-center">
                            {/* Center Navigation - Desktop */}
                            <div className="hidden md:flex items-center gap-4">
                                {navLinks.map((link) => {
                                    return (
                                        <Link to={link.path} className="nav-button">
                                            {link.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* <span className="text-zinc-600 dark:text-zinc-300 text-2xl select-none">|</span> */}

                        {/* Right actions */}
                        <div className="flex  items-center space-x-4">
                            <button className="hidden sm:flex btn-primary text-sm">
                                Sign In
                            </button>
                        </div>
                    </div>


                </div>

            </div>
        </header>
    );
}
