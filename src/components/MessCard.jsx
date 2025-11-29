import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const MessCard = ({ mess }) => {
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayMenu = mess.menu[selectedDay] || mess.menu['Monday'];

    const getSpecialItem = (menu) => {
        const specialKeywords = ['chicken', 'paneer', 'egg', 'sewaiya', 'kebab', 'ice cream'];
        const excludedKeywords = ['chapati', 'steam rice', 'steamed rice', 'rice'];

        const checkItem = (itemStr) => {
            if (!itemStr) return null;
            const items = itemStr.split(',').map(i => i.trim());

            // First pass: Look for special keywords
            for (const item of items) {
                const lowerItem = item.toLowerCase();
                if (specialKeywords.some(keyword => lowerItem.includes(keyword))) {
                    return item;
                }
            }

            // Second pass: Fallback to first non-excluded item
            for (const item of items) {
                const lowerItem = item.toLowerCase();
                if (!excludedKeywords.some(keyword => lowerItem.includes(keyword))) {
                    return item;
                }
            }

            return items[0]; // Ultimate fallback
        };

        // Check Lunch then Dinner for specials
        const lunchSpecial = checkItem(menu.Lunch);
        const dinnerSpecial = checkItem(menu.Dinner);

        // If lunch has a "special" keyword match, prioritize it. 
        // Otherwise if dinner has one, use that.
        // Else fallback to lunch's best item.

        const isSpecial = (item) => {
            if (!item) return false;
            return specialKeywords.some(k => item.toLowerCase().includes(k));
        };

        if (isSpecial(lunchSpecial)) return lunchSpecial;
        if (isSpecial(dinnerSpecial)) return dinnerSpecial;

        return lunchSpecial || dinnerSpecial || "Special Meal";
    };

    const colorMap = {
        'from-orange-500 to-red-500': { text: 'text-orange-600', shadow: 'hover:shadow-orange-500/40', bg: 'bg-orange-50' },
        'from-blue-500 to-cyan-500': { text: 'text-blue-600', shadow: 'hover:shadow-blue-500/40', bg: 'bg-blue-50' },
        'from-green-500 to-emerald-500': { text: 'text-green-600', shadow: 'hover:shadow-green-500/40', bg: 'bg-green-50' },
        'from-purple-500 to-pink-500': { text: 'text-purple-600', shadow: 'hover:shadow-purple-500/40', bg: 'bg-purple-50' },
        'from-pink-500 to-rose-500': { text: 'text-pink-600', shadow: 'hover:shadow-pink-500/40', bg: 'bg-pink-50' }
    };

    const theme = colorMap[mess.color] || colorMap['from-orange-500 to-red-500'];

    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
    return (
        <Link to={`/mess/${mess.id}`} className="h-auto md:h-[32rem] block">
            <motion.div
                layout
                whileHover={{ y: -5, transition: { duration: 0.1 } }}
                className={clsx(
                    "relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-100 cursor-pointer group h-full flex flex-col min-h-[32rem] md:min-h-0",
                    theme.shadow
                )}
            >
                {/* Header */}
                <div className={clsx("px-5 py-3 bg-gradient-to-r text-white transition-all duration-300", mess.color)}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold group-hover:scale-105 transition-transform duration-300">{mess.name}</h3>
                        <div className="p-1.5 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors">
                            <ArrowRight size={16} />
                        </div>
                    </div>
                    <p className="mt-1 text-white/90 text-xs flex items-center gap-1">
                        <Clock size={12} />
                        Today's Special: {(() => {
                            const getStartOfWeek = () => {
                                const now = new Date();
                                const day = now.getDay();
                                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                                const monday = new Date(now.setDate(diff));
                                monday.setHours(0, 0, 0, 0);
                                return monday;
                            };
                            const lastUpdated = mess.lastUpdated ? new Date(mess.lastUpdated) : null;
                            const startOfWeek = getStartOfWeek();
                            const isExpired = !lastUpdated || lastUpdated < startOfWeek;
                            const hasMenu = mess.menu && Object.keys(mess.menu).some(day => {
                                const dayMenu = mess.menu[day];
                                if (!dayMenu) return false;
                                return Object.values(dayMenu).some(meal => meal && meal !== "N/A" && meal.trim() !== "");
                            });

                            if (isExpired || !hasMenu) return "N/A";
                            return toTitleCase(getSpecialItem(currentDayMenu));
                        })()}
                    </p>
                </div>



                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    {(() => {
                        // Helper to get the start of the current week (Monday)
                        const getStartOfWeek = () => {
                            const now = new Date();
                            const day = now.getDay();
                            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
                            const monday = new Date(now.setDate(diff));
                            monday.setHours(0, 0, 0, 0);
                            return monday;
                        };

                        const lastUpdated = mess.lastUpdated ? new Date(mess.lastUpdated) : null;
                        const startOfWeek = getStartOfWeek();
                        const isExpired = !lastUpdated || lastUpdated < startOfWeek;
                        const hasMenu = mess.menu && Object.keys(mess.menu).some(day => {
                            const dayMenu = mess.menu[day];
                            if (!dayMenu) return false;
                            return Object.values(dayMenu).some(meal => meal && meal !== "N/A" && meal.trim() !== "");
                        });

                        if (isExpired || !hasMenu) {
                            return (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                                    <div className={clsx("text-lg font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r", mess.color)}>Menu Not Uploaded</div>
                                    <p className="text-xs text-gray-400">Check back later</p>
                                </div>
                            );
                        }

                        return (
                            <>
                                {/* Day Selector */}
                                <div className="flex justify-between items-center w-full mb-3" onClick={(e) => e.preventDefault()}>
                                    {days.map(day => (
                                        <button
                                            key={day}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedDay(day);
                                            }}
                                            className={clsx(
                                                "px-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
                                                selectedDay === day
                                                    ? "bg-gray-800 text-white shadow-md"
                                                    : "bg-white/50 text-gray-600 hover:bg-white/80"
                                            )}
                                        >
                                            {day.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>

                                {/* Daily Menu Preview */}
                                <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar scrollbar-hide">
                                    <style jsx>{`
                                        .scrollbar-hide::-webkit-scrollbar {
                                            display: none;
                                        }
                                        .scrollbar-hide {
                                            -ms-overflow-style: none;
                                            scrollbar-width: none;
                                        }
                                    `}</style>
                                    <div className="p-3 rounded-xl bg-white/60 border border-white/40 flex-1 min-h-0 shrink-0">
                                        <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Breakfast</h4>
                                        <p className="text-gray-800 font-medium text-xs leading-tight">{toTitleCase(currentDayMenu.Breakfast)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/60 border border-white/40 flex-1 min-h-0 shrink-0">
                                        <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Lunch</h4>
                                        <p className="text-gray-800 font-medium text-xs leading-tight">{toTitleCase(currentDayMenu.Lunch)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/60 border border-white/40 flex-1 min-h-0 shrink-0">
                                        <h4 className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-0.5">Snacks</h4>
                                        <p className="text-gray-800 font-medium text-xs leading-tight">{toTitleCase(currentDayMenu.Snacks)}</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/60 border border-white/40 flex-1 min-h-0 shrink-0">
                                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Dinner</h4>
                                        <p className="text-gray-800 font-medium text-xs leading-tight">{toTitleCase(currentDayMenu.Dinner)}</p>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </motion.div>
        </Link >
    );
};

export default MessCard;
