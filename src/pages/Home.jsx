import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import MessCard from '../components/MessCard';
import { messes } from '../data/menuData';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredMesses = messes.filter(mess => {
        const searchLower = searchTerm.toLowerCase();
        // Search by mess name
        if (mess.name.toLowerCase().includes(searchLower)) return true;

        // Search by menu items (deep search)
        return Object.values(mess.menu).some(dayMenu =>
            Object.values(dayMenu).some(item =>
                item.toLowerCase().includes(searchLower)
            )
        );
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
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
                    >
                        {sortedMesses.map((mess) => (
                            <MessCard key={mess.id} mess={mess} />
                </footer>
            </main>
        </div>
    );
};

export default Home;
