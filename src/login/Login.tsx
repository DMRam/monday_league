import React, { useState } from 'react';
import { FaVolleyballBall, FaEnvelope, FaLock, FaGoogle, FaFacebook } from 'react-icons/fa';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e:any) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            console.log('Login attempted with:', { email, password, rememberMe });
            setIsLoading(false);
            alert('Login functionality would be implemented here');
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row w-full max-w-4xl">
                {/* Left side - Form */}
                <div className="w-full md:w-2/3 p-5 md:p-12">
                    <div className="text-center mb-10">
                        <div className="flex justify-center items-center mb-4">
                            <FaVolleyballBall className="text-orange-500 text-4xl mr-2" />
                            <h1 className="text-3xl font-bold text-gray-800">Volleyball League</h1>
                        </div>
                        <p className="text-gray-600">Sign in to access your team dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <FaEnvelope />
                            </div>
                            <input
                                type="email"
                                id="email"
                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute left-3 top-3 text-gray-400">
                                <FaLock />
                            </div>
                            <input
                                type="password"
                                id="password"
                                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Remember me</label>
                            </div>

                            <a href="#" className="text-sm text-blue-600 hover:underline">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition flex items-center justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            <button className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm flex justify-center items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                                <FaGoogle className="text-red-500 mr-2" /> Google
                            </button>
                            <button className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm flex justify-center items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition">
                                <FaFacebook className="text-blue-600 mr-2" /> Facebook
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?
                            <a href="#" className="font-medium text-blue-600 hover:underline ml-1">Sign up</a>
                        </p>
                    </div>
                </div>

                {/* Right side - Graphics */}
                <div className="w-full md:w-1/3 bg-gradient-to-b from-blue-600 to-blue-800 text-white rounded-b-2xl md:rounded-none md:rounded-r-2xl p-8 flex flex-col items-center justify-center">
                    <div className="relative mb-6">
                        <div className="absolute -inset-4 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
                        <FaVolleyballBall className="text-6xl text-orange-400 relative animate-bounce" />
                    </div>

                    <h2 className="text-2xl font-bold mb-4 text-center">Welcome to the League</h2>
                    <p className="text-center text-blue-100 mb-6">
                        Access your team's dashboard, manage players, view schedules, and track statistics.
                    </p>

                    <div className="space-y-4 mt-8">
                        <div className="flex items-center">
                            <div className="bg-blue-500 p-2 rounded-full mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                </svg>
                            </div>
                            <span>Player Management</span>
                        </div>

                        <div className="flex items-center">
                            <div className="bg-blue-500 p-2 rounded-full mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <span>Schedule & Events</span>
                        </div>

                        <div className="flex items-center">
                            <div className="bg-blue-500 p-2 rounded-full mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                                </svg>
                            </div>
                            <span>Statistics & Analytics</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};