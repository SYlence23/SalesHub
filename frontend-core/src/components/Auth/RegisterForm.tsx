import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

interface RegisterFormProps {
    onSwitchMode?: () => void;
    onClose?: () => void;
}

interface RegisterDto {
    name: string;
    surname: string;
    email: string;
    password: string;
    isStudent: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchMode }) => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        const registerData: RegisterDto = {
            name,
            surname,
            email,
            password,
            isStudent: false
        };
        try {
            await api.post('/Auth/register', registerData);
            setSuccess(true);
            setTimeout(() => {
                if (onSwitchMode) {
                    onSwitchMode();
                } else {
                    navigate('/login');
                }
            }, 2000);
        } catch (err: any) {
            if (err.response?.data?.errors) {
                const firstError = Object.values(err.response.data.errors)[0] as string[];
                setError(firstError[0] || 'Validation error');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (typeof err.response?.data === 'string') {
                setError(err.response.data);
            } else {
                setError('An error occurred during registration');
            }
        }
    };

    return (
        <form
            className="glass-card flex flex-col gap-6 p-8 w-full max-w-xl shadow-glass dark:shadow-glass-dark"
            onSubmit={handleSubmit}
        >
            <h2 className="text-2xl font-bold text-center animated-gradient">
                Створити аккаунт
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">Реєстрація успішна!</span>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium ml-1 text-zinc-700 dark:text-zinc-300">Ім'я</label>
                <input type="text"
                    placeholder="Іван"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium ml-1 text-zinc-700 dark:text-zinc-300">Прізвище</label>
                <input type="text"
                    placeholder="Іванов"
                    className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                />
            </div>

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
            </div>


            <button type="submit" className="btn-primary w-full text-base py-3 mt-2">Зареєструватися</button>

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
                Вже є аккаунт?{' '}
                {onSwitchMode ? (
                    <span onClick={onSwitchMode} className="text-primary-600 hover:underline cursor-pointer">Увійти</span>
                ) : (
                    <Link to="/login" className="text-primary-600 hover:underline cursor-pointer">Увійти</Link>
                )}
            </p>
        </form>
    );
};

export default RegisterForm;
