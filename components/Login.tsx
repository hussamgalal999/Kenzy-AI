import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { SparklesIcon } from './icons';

const Login: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            // The onAuthChange listener in AuthContext will handle the redirect.
        } catch (error: any) {
            console.error("Login failed:", error);
            if (error.code === 'auth/popup-closed-by-user') {
                 setError("Login cancelled. Please try again.");
            } else if (error.message.includes("Firebase not configured")) {
                 setError("This app is running in offline demo mode. Please configure Firebase to enable login.");
            }
            else {
                setError("An error occurred during sign-in. Please try again.");
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4 text-center">
            <div className="w-24 h-24 bg-brand-yellow/20 rounded-full flex items-center justify-center mb-6">
                <SparklesIcon className="w-12 h-12 text-brand-yellow" />
            </div>
            <h1 className="text-4xl font-extrabold text-brand-blue dark:text-white">Welcome to Kenzy AI Storybook</h1>
            <p className="text-brand-purple dark:text-white/70 mt-2 mb-8 max-w-md">
                Sign in to create, save, and explore your own magical AI-powered stories.
            </p>

            <button
                onClick={handleLogin}
                disabled={isLoading}
                className="flex items-center justify-center gap-3 bg-white dark:bg-brand-blue/30 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow disabled:opacity-50"
            >
                <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span className="font-semibold text-brand-blue dark:text-white">{isLoading ? "Signing in..." : "Sign in with Google"}</span>
            </button>
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default Login;
