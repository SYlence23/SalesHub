import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LoginFormProps {
    onSwitchMode?: () => void;
    onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchMode, onClose }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    return (
        <form 
            className="glass-card flex flex-col gap-6 p-8 w-full max-w-xl shadow-glass dark:shadow-glass-dark"
            onSubmit={(e) => {
                e.preventDefault();
                console.log('Login logic here', { email, password });
                if (onClose) {
                    onClose();
                } else {
                    navigate('/');
                }
            }}
        >
            <h2 className="text-2xl font-bold text-center animated-gradient">
                Вітаємо знову!
            </h2>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium ml-1 text-zinc-700 dark:text-zinc-300">Email</label>
                <input type="email"
                    placeholder="email@example.com"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium ml-1 text-zinc-700 dark:text-zinc-300">Пароль</label>
                <input type="password"
                    placeholder="••••••••"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <span className="text-xs text-primary-600 hover:underline cursor-pointer">Забули пароль?</span>
            </div>

            <button type="submit" className="btn-primary w-full text-base py-3 mt-2">Увійти</button>

            <div className="relative flex items-center justify-center my-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <span className="relative px-4 bg-white dark:bg-zinc-900 text-sm text-zinc-500 dark:text-zinc-400">або</span>
            </div>

            <button type="button" className="btn-secondary w-full py-3 flex items-center justify-center gap-3">
                <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
                Продовжити з Google
            </button>

            <p className="text-center text-sm mt-2 text-zinc-500 dark:text-zinc-400">
                Немає аккаунту?{' '}
                {onSwitchMode ? (
                    <span onClick={onSwitchMode} className="text-primary-600 hover:underline cursor-pointer">Створити</span>
                ) : (
                    <Link to="/register" className="text-primary-600 hover:underline cursor-pointer">Створити</Link>
                )}
            </p>
        </form>
    );
};

export default LoginForm;