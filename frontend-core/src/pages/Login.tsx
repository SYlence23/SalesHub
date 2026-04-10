import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const Login = () => {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
            <div className="grow grid grid-cols-1 md:grid-cols-5 items-center">
                <div className="hidden md:flex md:col-span-2 min-h-[500px] items-center justify-center relative p-10 overflow-hidden">
                    <div className="absolute inset-0 opacity-15 dark:opacity-10 bg-[radial-gradient(circle_at_center,var(--color-primary-500)_0%,transparent_70%)]"></div>
                    <div className="relative z-10 text-center flex flex-col items-center gap-4">
                        <h1 className="text-5xl font-extrabold animated-gradient leading-tight">
                            Ласкаво просимо до SalesHub
                        </h1>
                        <p className="text-zinc-600 dark:text-zinc-400 max-w-sm">
                            Увійдіть у свій акаунт, щоб продовжити
                        </p>
                    </div>
                </div>
                <div className="md:col-span-3 flex flex-col items-center justify-center p-6 md:p-12">
                    <div className="w-full max-w-xl md:ml-10">
                        <LoginForm />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;