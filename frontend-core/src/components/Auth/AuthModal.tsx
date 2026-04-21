import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
        }
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-xl">
                <button 
                    onClick={onClose}
                    className="absolute -top-4 -right-4 sm:-right-8 sm:-top-8 text-white hover:text-zinc-300 transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full cursor-pointer z-[101]"
                >
                    <X size={24} />
                </button>
                {mode === 'login' ? (
                    <LoginForm 
                        onSwitchMode={() => setMode('register')} 
                        onClose={onClose}
                    />
                ) : (
                    <RegisterForm 
                        onSwitchMode={() => setMode('login')} 
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthModal;
