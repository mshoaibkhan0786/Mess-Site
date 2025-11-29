import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import MessCard from '../components/MessCard';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { motion } from 'framer-motion';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [messes, setMesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "messes"), (snapshot) => {
            const messesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMesses(messesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredMesses = messes.filter(mess => {
        const searchLower = searchTerm.toLowerCase();
        // Search by mess name
        if (mess.name.toLowerCase().includes(searchLower)) return true;

        // Search by menu items (deep search)
        if (mess.menu) {
            return Object.values(mess.menu).some(dayMenu =>
                Object.values(dayMenu).some(item =>
                    item && item.toLowerCase().includes(searchLower)
                )
            );
        }
        return false;
    });

    // Sort messes to put last viewed on top
    const sortedMesses = [...filteredMesses].sort((a, b) => {
        const lastViewed = localStorage.getItem('lastViewedMess');
        if (!lastViewed) return 0;
        if (a.id === lastViewed) return -1;
        if (b.id === lastViewed) return 1;
        return 0;
    });

    return (
        <div className="min-h-screen bg-gray-50 relative selection:bg-orange-200 selection:text-orange-900">
            {/* Background Elements */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <Navbar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-80px)]">
                <div className="flex-grow">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                                <div key={n} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-full flex flex-col">
                                    <div className="h-48 w-full skeleton-loader"></div>
                                    <div className="p-6 space-y-4 flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div className="h-6 w-3/4 rounded skeleton-loader"></div>
                                            <div className="h-6 w-16 rounded-full skeleton-loader"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-full rounded skeleton-loader"></div>
                                            <div className="h-4 w-5/6 rounded skeleton-loader"></div>
                                        </div>
                                        <div className="pt-4 mt-auto flex justify-between items-center">
                                            <div className="h-8 w-24 rounded-lg skeleton-loader"></div>
                                            <div className="h-8 w-8 rounded-full skeleton-loader"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            layout
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
                        >
                            {sortedMesses.map((mess) => (
                                <MessCard key={mess.id} mess={mess} />
                            ))}
                            {sortedMesses.length === 0 && (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-gray-500 text-lg">No messes found matching your search.</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                <footer className="text-center py-8 mt-8 border-t border-gray-200/50">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
                        What's on the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Menu?</span>
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto px-4">
                        Daily menus for all hostel messes. Click a card for the full weekly schedule.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Home;
