'use client';

import { useState } from 'react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 flex items-center justify-center p-4'>
           <div className='bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md'>
            {/* Logo and Title */}
                <div className='text-center mb-8'>
                    <div className='flex items-center justify-center mb-4'>
                        <div className='w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center mr-3'>
                            <div className="w-5 h-5 border-2 border-white rounded transform rotate-45"></div>
                        </div>
                        <h1 className='text-2xl font-bold text-gray-900'>Fluxora</h1>
                    </div>
                </div>

                {/* Campo Usuario */}
                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <svg className='h-5 w-5 text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <input type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='Usuario'
                            className='w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors'
                            required
                        />
                    </div>

                    {/* Campo Contraseña */}
                    <div className='relative'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <svg className='h-5 w-5 text-gray-400' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                            </svg>
                        </div>
                        <input type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='Contraseña'
                            className='w-full pl-10 pr-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors'
                            required
                        />
                    </div>

                    <button type='submit' className='w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'>
                        Iniciar Sesión
                    </button>
                </form>

                {/* Enlace olvido contraseña */}
                <div className='text-center mt-6'>
                    <a href="#" className='text-blue-600 hover:text-blue-800 text-sm transition-colors'>¿Olvidaste tu contraseña?</a>
                </div>
            </div> 
        </div>
    )
}