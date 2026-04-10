import React, { useState } from 'react';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    return (
        <form className="glass-card flex flex-col gap-8 p-10 w-full max-w-2xl shadow-glass dark:shadow-glass-dark">
            <h2 className="text-3xl font-bold text-center animated-gradient">
                Вітаємо знову!
            </h2>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium ml-1 text-zinc-700 dark:text-zinc-300">Email</label>                <input type="email"
                    placeholder="email@example.com"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-primary-500 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Пароль</label>                <input type="password"
                    placeholder="••••••••"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <span className="text-xs text-primary-600 hover:underline cursor-pointer">Забули пароль?</span>

            </div>

            <button type="submit" className="btn-primary w-full text-lg py-4">Увійти</button>

            <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                </div>
                <span className="relative px-4 bg-transparent text-sm text-zinc-500 dark:text-zinc-400">або</span>
            </div>

            <button type="button" className="btn-secondary w-full py-3 flex items-center justify-center gap-3">
                <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="Google" />
                Продовжити з Google
            </button>

            <button>
                <p className="text-center text-sm text-zinc-500 dark:text-zink-400">
                    Немає аккаунту? <span className="text-primary-600 hover:underline cursor-pointer">Створити</span>
                </p>
            </button>
        </form>
    );
};

export default LoginForm;