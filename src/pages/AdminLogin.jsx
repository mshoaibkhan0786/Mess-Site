import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AdminLogin = () => {
    const [email, setEmail] = useState('admin@mitmess.com');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Start with loading true to check auth
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Double check if user still exists in DB (in case they were deleted while logged in)
                const userDoc = await getDoc(doc(db, "users", user.email));
                if (userDoc.exists() && userDoc.data().deleted) {
                    await signOut(auth);
                    setLoading(false);
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                setLoading(false); // Only show form if no user
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await setPersistence(auth, browserLocalPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if user document exists
            const userDocRef = doc(db, "users", userCredential.user.email);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Self-healing: If Auth exists but Firestore doc is missing, recreate it.
                // This handles cases where creation write failed or legacy accounts.
                console.warn("User document missing. Recreating...");

                const isOwner = password === "LALA HI LALA"; // Hardcoded recovery for owner
                const newUserData = {
                    email: userCredential.user.email,
                    name: isOwner ? "M Shoaib Khan" : "Recovered Admin",
                    accessCode: password,
                    role: isOwner ? "super_admin" : "mess_admin", // Default to mess_admin for safety
                    messId: null,
                    createdAt: new Date().toISOString(),
                    deleted: false,
                    recovered: true
                };

                await setDoc(userDocRef, newUserData);
            } else if (userDoc.data().deleted) {
                // Soft Delete Check
                // Emergency Bypass for Owner
                if (password === "LALA HI LALA") {
                    console.log("Owner account was deleted. Reactivating...");
                    await updateDoc(userDocRef, { deleted: false });
                    // Continue to login...
                } else {
                    await signOut(auth);
                    throw new Error("Access Denied: Account has been revoked.");
                }
            }

            // Navigation handled by useEffect
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message === "Access Denied: Account has been revoked." ? err.message : 'Invalid password');
            setLoading(false);
        }
    };

    const handleBackgroundClick = (e) => {
        // Only redirect on mobile (width < 768px) and if clicking the background directly
        if (window.innerWidth < 768 && e.target === e.currentTarget) {
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative flex flex-col">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <Navbar />

            <div
                className="flex-1 flex items-center justify-center relative z-10 px-4 cursor-pointer md:cursor-default"
                onClick={handleBackgroundClick}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 cursor-default"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="text-center mb-8">
                        <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-orange-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Admin Login</h2>
                        <p className="text-gray-500 mt-2">Enter your password to access the dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Access Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        // Email is derived from code: code@mitmess.com (sanitized)
                                        const sanitizedCode = e.target.value.trim().replace(/\s+/g, '_').toLowerCase();
                                        setEmail(`${sanitizedCode}@mitmess.com`);
                                    }}
                                    className="w-full pl-10 pr-10 px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white/50"
                                    placeholder="Enter your secret code"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Access Dashboard <ArrowRight size={20} /></>}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminLogin;
