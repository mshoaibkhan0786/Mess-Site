import React, { useState } from 'react';
import { UtensilsCrossed, Search, X, Map, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = ({ searchTerm, setSearchTerm }) => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showRestaurantsModal, setShowRestaurantsModal] = useState(false);

    const restaurants = [
        { name: "Taco House", phone: "+91 7795815315" },
        { name: "Hungry House", phone: "+91 9820243177" },
        { name: "MFC", phone: "+91 7338334970" },
        { name: "Hit&Run", phone: "+91 7406330088" },
        { name: "Janani Canteen", phone: "+91 8660138488" },
        { name: "Dollar Cafe", phone: "+91 8105306109" },
        { name: "Kamath Cafe", phone: "+91 8217044886" },
        { name: "Aditya Mess", phone: "+91 7483644586" },
        { name: "Apoorva Mess", phone: "+91 9108888320" },
        { name: "FC 2", phone: "+91 8861953102" },
        { name: "Poornima", phone: "+91 70906 41985" },
        { name: "Nom Nom cafe", phone: "+91 7619422026" },
        { name: "Ashraya", phone: "+91 6361201519" },
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo & Title - Hidden when search is open on mobile */}
                        <AnimatePresence mode="wait">
                            {(!isSearchOpen || window.innerWidth >= 768) && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Link to="/" className="flex items-center gap-2">
                                        {/* Desktop Icon - Part of Home Link */}
                                        <div className="hidden md:block p-2 bg-orange-500 rounded-lg text-white">
                                            <UtensilsCrossed size={24} />
                                        </div>
                                        {/* Mobile Icon - Links to Admin */}
                                        <Link to="/admin" className="md:hidden p-2 bg-orange-500 rounded-lg text-white" onClick={(e) => e.stopPropagation()}>
                                            <UtensilsCrossed size={24} />
                                        </Link>
                                        <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                            MIT Mess
                                        </span>
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Desktop Search Bar */}
                        {setSearchTerm && (
                            <div className="hidden md:flex flex-1 max-w-md mx-8 relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-200/50 rounded-full leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 sm:text-sm shadow-sm transition-all duration-300 hover:bg-white/80 focus:bg-white"
                                    placeholder="Search messes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Mobile Search Bar - Replaces Logo when open */}
                        <AnimatePresence>
                            {isSearchOpen && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: '100%' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="absolute inset-0 flex items-center px-4 bg-white md:hidden z-20"
                                >
                                    <Search className="text-gray-400 mr-2" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setIsSearchOpen(false)}
                                        className="p-2 text-gray-500 hover:text-orange-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Mobile Search Icon - Visible when search is closed */}
                            {setSearchTerm && !isSearchOpen && (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="md:hidden p-2 text-gray-600 hover:text-orange-600 transition-colors"
                                >
                                    <Search size={20} />
                                </button>
                            )}

                            {/* Restaurant Icon - Mobile Only */}
                            <button
                                onClick={() => setShowRestaurantsModal(true)}
                                className="md:hidden p-2 text-gray-600 hover:text-orange-600 transition-colors"
                                title="Restaurants"
                            >
                                <Store size={20} />
                            </button>

                            {/* Map Icon Link */}
                            <a
                                href="https://mit.nakshatramaps.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-600 hover:text-orange-600 transition-colors"
                                title="Campus Map"
                            >
                                <Map size={20} />
                            </a>

                            <button
                                onClick={() => setShowRestaurantsModal(true)}
                                className="hidden md:block px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                            >
                                Restaurants
                            </button>
                            <Link to="/admin">
                                <button className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-red-500 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
                                    Admin Login
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Restaurants Modal */}
            <AnimatePresence>
                {showRestaurantsModal && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowRestaurantsModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-2xl font-bold">Nearby Restaurants</h3>
                                    <p className="text-white/80 text-sm">Tap a card to call</p>
                                </div>
                                <button onClick={() => setShowRestaurantsModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {restaurants.map((restaurant, index) => (
                                        <a
                                            key={index}
                                            href={`tel:${restaurant.phone}`}
                                            className="block p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all duration-300 group"
                                        >
                                            <h4 className="font-bold text-gray-800 group-hover:text-orange-600 transition-colors mb-1">{restaurant.name}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                {restaurant.phone}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
