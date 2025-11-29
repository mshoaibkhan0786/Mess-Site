import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Shield, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const SystemReset = () => {
    const [accessCode, setAccessCode] = useState('');
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [message, setMessage] = useState('');

    const handleReset = async (e) => {
        e.preventDefault();
        if (!accessCode) return;

        setStatus('processing');
        setMessage('Starting system reset...');

        try {
            // 1. Wipe all users from Firestore
            setMessage('Removing existing user roles...');
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);

            const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // 2. Create Super Admin in Firestore
            setMessage('Creating Super Admin privileges...');
            // Sanitize code for email: trim, replace spaces with underscores, and lowercase
            const sanitizedCode = accessCode.trim().replace(/\s+/g, '_').toLowerCase();
            const email = `${sanitizedCode}@mitmess.com`;

            await setDoc(doc(db, 'users', email), {
                email: email,
                role: 'super_admin',
                createdAt: new Date().toISOString()
            });

            // 3. Attempt to create Auth user
            setMessage('Setting up authentication...');
            try {
                // Use original code as password, sanitized email as identifier
                await createUserWithEmailAndPassword(auth, email, accessCode);
                setMessage('System reset complete! Super Admin created.');
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    setMessage('System reset complete! (Admin account already existed, permissions restored).');
                } else {
                    throw authError;
                }
            }

            setStatus('success');
        } catch (error) {
            console.error("Reset failed:", error);
            setStatus('error');
            setMessage(`Failed: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
                <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-red-900">System Reset</h1>
                        <p className="text-red-600 text-sm">Emergency Recovery Tool</p>
                    </div>
                </div>

                <div className="p-6">
                    <p className="text-gray-600 mb-6 text-sm">
                        This tool will <strong>delete all existing user roles</strong> from the database and allow you to create a new Super Admin account.
                        <br /><br />
                        Use this if you have lost access to the Super Admin account.
                    </p>

                    {status === 'success' ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Reset Successful</h3>
                            <p className="text-gray-600 mb-6">{message}</p>
                            <a
                                href="/admin"
                                className="inline-block w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
                            >
                                Go to Login
                            </a>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    New Super Admin Access Code
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                                        placeholder="Enter new code (e.g. admin123)"
                                        required
                                        disabled={status === 'processing'}
                                    />
                                </div>
                            </div>

                            {status === 'error' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                                    {message}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={status === 'processing' || !accessCode}
                                className="w-full py-3 px-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {status === 'processing' ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset System & Create Admin'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemReset;
