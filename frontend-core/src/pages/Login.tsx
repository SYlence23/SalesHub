import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const Login = () => {
    return (

        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <LoginForm />
        </div>
    );
};

export default Login;