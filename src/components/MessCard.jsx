import React, { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

const MessCard = ({ mess }) => {
    const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Determine which menu to show based on 10-day cycle
    const getActiveMenu = () => {
        if (!mess.menuStartDate || !mess.nextWeekMenu) return mess.menu;

        const startDate = new Date(mess.menuStartDate);
        const today = new Date();
        const diffTime = Math.abs(today - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If we are past the first 7 days, check if we have next week's data
        if (diffDays > 7 && Object.keys(mess.nextWeekMenu).length > 0) {
            // Merge next week's available days into the main menu structure
            // This ensures we fallback to main menu if a day is missing in nextWeekMenu (though ideally it shouldn't be)
            return { ...mess.menu, ...mess.nextWeekMenu };
        }
        return mess.menu;
    };

    const activeMenu = getActiveMenu();
    const currentDayMenu = activeMenu[selectedDay] || activeMenu['Monday'];

    const getSpecialItem = (menu) => {
        // Priority check for Theme Dinner
        if (menu.Dinner?.toLowerCase().includes('theme dinner')) {
            return "Theme Dinner";
        }

        // Priority check for Month End Dinner
        const allItems = [menu.Breakfast, menu.Lunch, menu.Snacks, menu.Dinner].join(' ').toLowerCase();
        if (allItems.includes('month end dinner')) {
            return "Month End Dinner";
        }

        const specialKeywords = ['chicken', 'paneer', 'egg', 'sewaiya', 'kebab', 'ice cream', 'semiyan', 'kheer', 'swiss roll', 'gulab jamun'];
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

    const getTheme = (colorStr) => {
        if (!colorStr) return colorMap['from-orange-500 to-red-500'];

        if (colorStr.includes('blue') || colorStr.includes('cyan')) return colorMap['from-blue-500 to-cyan-500'];
        if (colorStr.includes('green') || colorStr.includes('emerald')) return colorMap['from-green-500 to-emerald-500'];
        if (colorStr.includes('purple')) return colorMap['from-purple-500 to-pink-500'];
        if (colorStr.includes('pink') || colorStr.includes('rose')) return colorMap['from-pink-500 to-rose-500'];

        return colorMap['from-orange-500 to-red-500'];
    };

    const theme = getTheme(mess.color);

    const toTitleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <Link to={`/mess/${mess.id}`} className="h-full block">
            <motion.div
                layout
                whileHover={{ y: -5, transition: { duration: 0.1 } }}
                className={clsx(
                    "relative overflow-hidden rounded-2xl bg-white/40 backdrop-blur-lg border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-100 cursor-pointer group h-full flex flex-col",
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
                            const hasMenu = activeMenu && Object.keys(activeMenu).some(day => {
                                const dayMenu = activeMenu[day];
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
                        const hasMenu = activeMenu && Object.keys(activeMenu).some(day => {
                            const dayMenu = activeMenu[day];
                            if (!dayMenu) return false;
                            return Object.values(dayMenu).some(meal => meal && meal !== "N/A" && meal.trim() !== "");
                        });

                        if (isExpired || !hasMenu) {
                            return (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 min-h-[200px]">
                                    <div className={clsx("text-lg font-bold mb-1", theme.text)}>Menu Not Uploaded</div>
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

                                {/* Daily Menu Preview - Grid Stack for Stable Height */}
                                <div className="grid grid-cols-1 flex-1 min-h-0">
                                    {days.map(day => {
                                        const dayMenu = activeMenu[day] || activeMenu['Monday'];
                                        const isSelected = selectedDay === day;

                                        return (
                                            <div
                                                key={day}
                                                className={clsx(
                                                    "flex flex-col gap-2.5 overflow-y-auto pr-1 pb-2 custom-scrollbar scrollbar-hide transition-opacity duration-200",
                                                    isSelected ? "opacity-100 z-10 pointer-events-auto" : "opacity-0 z-0 pointer-events-none"
                                                )}
                                                style={{ gridArea: "1 / 1 / 2 / 2" }}
                                            >
                                                <style jsx>{`
                                                    .scrollbar-hide::-webkit-scrollbar {
                                                        display: none;
                                                    }
                                                    .scrollbar-hide {
                                                        -ms-overflow-style: none;
                                                        scrollbar-width: none;
                                                    }
                                                `}</style>
                                                <div className="p-3 rounded-xl bg-white/60 border border-white/40 shrink-0">
                                                    <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Breakfast</h4>
                                                    <p className="text-gray-800 font-medium text-xs leading-tight break-words">{toTitleCase(dayMenu.Breakfast)}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/60 border border-white/40 shrink-0">
                                                    <h4 className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Lunch</h4>
                                                    <p className="text-gray-800 font-medium text-xs leading-tight break-words">{toTitleCase(dayMenu.Lunch)}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/60 border border-white/40 shrink-0">
                                                    <h4 className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider mb-0.5">Snacks</h4>
                                                    <p className="text-gray-800 font-medium text-xs leading-tight break-words">{toTitleCase(dayMenu.Snacks)}</p>
                                                </div>
                                                <div className="p-3 rounded-xl bg-white/60 border border-white/40 shrink-0 mb-4">
                                                    <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Dinner</h4>
                                                    <p className="text-gray-800 font-medium text-xs leading-tight break-words">{toTitleCase(dayMenu.Dinner)}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
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
