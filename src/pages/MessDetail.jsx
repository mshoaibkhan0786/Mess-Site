import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import { ArrowLeft, Clock, UtensilsCrossed, X } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

const MessDetail = () => {
    const { id } = useParams();
    const [mess, setMess] = useState(null);
    const [loading, setLoading] = useState(true);
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const transformComponentRef = React.useRef(null);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    const [showTodayModal, setShowTodayModal] = React.useState(false);

    useEffect(() => {
        const fetchMess = async () => {
            try {
                const docRef = doc(db, "messes", id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setMess({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching mess:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMess();
    }, [id]);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);

        // Save last viewed mess
        if (id) {
            localStorage.setItem('lastViewedMess', id);
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (!mess) {
        return <div className="min-h-screen flex items-center justify-center">Mess not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <Navbar />

            <main className="relative z-10 pt-20 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-[calc(100vh-20px)] flex flex-col">
                <Link to="/" className="inline-flex items-center text-gray-600 hover:text-orange-600 mb-2 transition-colors text-sm">
                    <ArrowLeft size={16} className="mr-1" />
                    Back
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/50 flex flex-col flex-1 min-h-0"
                >
                    <div className={clsx("px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r text-white shrink-0", mess.color)}>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
                            <h1 className="text-xl md:text-2xl font-bold">
                                {mess.name}
                            </h1>
                            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => transformComponentRef.current?.resetTransform()}
                                    className="flex-1 md:flex-none justify-center px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[10px] md:text-xs font-medium transition-colors backdrop-blur-sm border border-white/20 flex items-center gap-1 cursor-pointer"
                                    title="Click to reset view"
                                >
                                    <Clock size={12} />
                                    Weekly Menu
                                </button>
                                <button
                                    onClick={() => setShowTodayModal(true)}
                                    className="flex-1 md:flex-none justify-center px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-[10px] md:text-xs font-medium transition-colors backdrop-blur-sm border border-white/20 flex items-center gap-1"
                                >
                                    <UtensilsCrossed size={12} />
                                    Today's Menu
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={clsx("flex-1 relative bg-gray-50/50", isMobile ? "overflow-hidden" : "overflow-auto")}>
                        {isMobile ? (
                            <TransformWrapper
                                ref={transformComponentRef}
                                initialScale={1}
                                minScale={0.5}
                                maxScale={3}
                                centerOnInit={false}
                                wheel={{ step: 0.1 }}
                                limitToBounds={false}
                            >
                                <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full">
                                    <MenuTable days={days} mess={mess} />
                                </TransformComponent>
                            </TransformWrapper>
                        ) : (
                            <MenuTable days={days} mess={mess} />
                        )}
                    </div>
                </motion.div>
            </main>

            {/* Today's Menu Modal */}
            <AnimatePresence>
                {showTodayModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowTodayModal(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className={clsx("p-4 bg-gradient-to-r text-white flex justify-between items-center", mess.color)}>
                                <h3 className="text-lg font-bold">Today's Menu ({new Date().toLocaleDateString('en-US', { weekday: 'long' })})</h3>
                                <button onClick={() => setShowTodayModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {(() => {
                                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                    const todayMenu = mess.menu[today] || mess.menu['Monday'];
                                    return (
                                        <>
                                            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                                                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Breakfast</h4>
                                                <p className="text-gray-800 text-sm">{todayMenu.Breakfast}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                                                <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Lunch</h4>
                                                <p className="text-gray-800 text-sm">{todayMenu.Lunch}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                                <h4 className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Snacks</h4>
                                                <p className="text-gray-800 text-sm">{todayMenu.Snacks}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Dinner</h4>
                                                <p className="text-gray-800 text-sm">{todayMenu.Dinner}</p>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MenuTable = ({ days, mess }) => (
    <table className="w-full text-left border-collapse min-w-[600px] bg-white origin-top-left h-full">
        <thead className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-10">
            <tr className="border-b border-gray-200">
                <th className="py-2 px-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Day</th>
                <th className="py-2 px-3 font-bold text-orange-600 uppercase tracking-wider text-[10px]">Breakfast</th>
                <th className="py-2 px-3 font-bold text-green-600 uppercase tracking-wider text-[10px]">Lunch</th>
                <th className="py-2 px-3 font-bold text-yellow-600 uppercase tracking-wider text-[10px]">Snacks</th>
                <th className="py-2 px-3 font-bold text-blue-600 uppercase tracking-wider text-[10px]">Dinner</th>
            </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
            {days.map(day => (
                <tr key={day} id={`row-${day}`} className="hover:bg-gray-50 transition-colors group duration-300">
                    <td className="py-1.5 px-3 font-bold text-gray-800 text-[10px]">{day}</td>
                    <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Breakfast}</td>
                    <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Lunch}</td>
                    <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Snacks}</td>
                    <td className="py-1.5 px-3 text-gray-600 group-hover:text-gray-900 text-[10px] leading-tight">{mess.menu[day]?.Dinner}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default MessDetail;
