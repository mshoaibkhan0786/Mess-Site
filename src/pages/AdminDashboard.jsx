import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Loader2, FileText, Plus, Trash2, X, History, Clock, UserPlus, LogOut, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc, getDoc, query, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import AccessCodeManager from '../components/AccessCodeManager';

const AdminDashboard = () => {
    const [messes, setMesses] = useState([]);
    const [selectedMess, setSelectedMess] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success, error
    const [errorMessage, setErrorMessage] = useState('');
    const [userRole, setUserRole] = useState(null); // 'super_admin' | 'mess_admin'
    const [assignedMessId, setAssignedMessId] = useState(null);
    const [adminName, setAdminName] = useState(''); // Store logged-in admin's name

    // New State for Add Mess
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMessName, setNewMessName] = useState('');
    const [newMessColor, setNewMessColor] = useState('from-orange-500 to-red-500'); // Default color

    // History State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Access Code Manager State
    const [showAccessManager, setShowAccessManager] = useState(false);

    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/admin');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    const logAction = async (action, details, messId = null) => {
        try {
            await addDoc(collection(db, "audit_logs"), {
                timestamp: new Date().toISOString(),
                action,
                details,
                messId,
                adminEmail: auth.currentUser?.email || 'unknown',
                adminName: adminName || 'Unknown Admin'
            });
        } catch (error) {
            console.error("Failed to log action:", error);
        }
    };

    const fetchMesses = async () => {
        const querySnapshot = await getDocs(collection(db, "messes"));
        const messesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMesses(messesData);

        // If mess admin, auto-select their mess
        if (assignedMessId) {
            setSelectedMess(assignedMessId);
        } else if (messesData.length > 0 && !selectedMess) {
            setSelectedMess(messesData[0].id);
        }
    };

    const fetchUserRole = async (user) => {
        if (!user) return;
        try {
            const userDoc = await getDoc(doc(db, "users", user.email));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserRole(userData.role);
                setAssignedMessId(userData.messId);
                setAdminName(userData.name || 'Unknown Admin'); // Set admin name
                if (userData.role === 'mess_admin' && userData.messId) {
                    setSelectedMess(userData.messId);
                }
            } else {
                // Default to mess_admin if not found (safety fallback, or handle as unauthorized)
                // For now, let's assume if not in DB, they might be legacy admin (super) or restricted.
                // Better to be restrictive:
                console.warn("User not found in users collection, defaulting to restricted access.");
                setUserRole('mess_admin');
                setAdminName('Unknown Admin');
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
        }
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAuditLogs(logs);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };
    // ... (lines 108-587)
    <div className="space-y-4">
        {auditLogs.map(log => (
            <div key={log.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="mt-1">
                    <div className="bg-white p-2 rounded-full shadow-sm">
                        <Clock size={16} className="text-gray-500" />
                    </div>
                </div>
                <div>
                    <p className="font-medium text-gray-900">{log.details}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="font-semibold text-orange-600">{log.adminName || log.adminEmail}</span>
                        {log.adminName && <span className="text-gray-400">({log.adminEmail})</span>}
                        <span>•</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        ))}
    </div>

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                navigate('/admin');
            } else {
                await fetchUserRole(user);
                fetchMesses();
            }
        });
        return () => unsubscribe();
    }, [navigate, assignedMessId]); // Re-fetch messes if assignedMessId changes

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleUpload(files[0]);
        }
    };

    const handleAddMess = async (e) => {
        e.preventDefault();
        if (!newMessName) return;

        try {
            const emptyMenu = {
                Monday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Tuesday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Wednesday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Thursday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Friday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Saturday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Sunday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" }
            };

            const docRef = await addDoc(collection(db, "messes"), {
                name: newMessName,
                color: newMessColor,
                menu: emptyMenu,
                lastUpdated: new Date().toISOString()
            });

            await logAction("CREATE_MESS", `Created mess: ${newMessName}`, docRef.id);

            setNewMessName('');
            setShowAddModal(false);
            await fetchMesses();
            setSelectedMess(docRef.id);
            alert("Mess added successfully!");
        } catch (error) {
            console.error("Error adding mess: ", error);
            alert("Failed to add mess.");
        }
    };

    const handleDeleteMess = async () => {
        if (!selectedMess) return;
        if (window.confirm("Are you sure you want to delete this mess? This action cannot be undone.")) {
            try {
                const messName = messes.find(m => m.id === selectedMess)?.name || selectedMess;
                await deleteDoc(doc(db, "messes", selectedMess));
                await logAction("DELETE_MESS", `Deleted mess: ${messName}`, selectedMess);

                await fetchMesses();
                if (messes.length > 1) {
                    setSelectedMess(messes[0].id === selectedMess ? messes[1].id : messes[0].id);
                } else {
                    setSelectedMess('');
                }
                alert("Mess deleted successfully.");
            } catch (error) {
                console.error("Error deleting mess: ", error);
                alert("Failed to delete mess.");
            }
        }
    };

    const handleUpload = async (file) => {
        setUploadStatus('uploading');
        setErrorMessage('');

        try {
            // 1. Convert file to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];

                setUploadStatus('processing');

                try {
                    // 2. Call Gemini API with Timeout
                    console.log("VERSION: GEMINI-2.0-FLASH-FINAL"); // Version Check
                    const { GoogleGenerativeAI } = await import("@google/generative-ai");
                    const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
                    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

                    const prompt = `
                    Extract the weekly menu from this image and return it as a strictly valid JSON object.
                    
                    CRITICAL INSTRUCTION: You must extract EVERY SINGLE DISH listed for each meal. 
                    - Do NOT summarize. 
                    - Do NOT truncate. 
                    - List all items separated by commas exactly as they appear in the image.
                    - If there are multiple items (e.g., "Rice, Dal, Curd"), include ALL of them.
                    - **IMPORTANT: Format all text in Sentence case (e.g., "Paneer butter masala", "Mix veg paratha"). Do NOT use ALL CAPS.**

                    The JSON structure must be exactly like this:
                    {
                        "Monday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Tuesday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Wednesday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Thursday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Friday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Saturday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." },
                        "Sunday": { "Breakfast": "...", "Lunch": "...", "Snacks": "...", "Dinner": "..." }
                    }
                    If a meal is missing, use "N/A".
                    Do not include any markdown formatting (like \`\`\`json), just the raw JSON string.
                    `;

                    // Timeout Promise
                    const timeout = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Request timed out (30s)")), 30000)
                    );

                    // API Call Promise
                    const apiCall = model.generateContent([
                        prompt,
                        {
                            inlineData: {
                                data: base64Data,
                                mimeType: file.type
                            }
                        }
                    ]);

                    const result = await Promise.race([apiCall, timeout]);

                    const response = await result.response;
                    const text = response.text();
                    console.log("Gemini Response:", text); // Debug log

                    // Clean up the response if it contains markdown code blocks
                    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();

                    let newMenu;
                    try {
                        newMenu = JSON.parse(cleanJson);
                    } catch (jsonError) {
                        console.error("JSON Parse Error:", jsonError);
                        throw new Error("AI returned invalid data. Try a clearer image.");
                    }

                    // 3. Update Firestore
                    const messRef = doc(db, "messes", selectedMess);
                    await updateDoc(messRef, {
                        menu: newMenu,
                        lastUpdated: new Date().toISOString()
                    });

                    const messName = messes.find(m => m.id === selectedMess)?.name || selectedMess;
                    await logAction("UPDATE_MENU", `Updated menu for ${messName}`, selectedMess);

                    setUploadStatus('success');
                } catch (innerError) {
                    console.error("Gemini/Firestore Error:", innerError);
                    setUploadStatus('error');
                    setErrorMessage(innerError.message || "Unknown error occurred");
                }
            };
        } catch (error) {
            console.error("File Reading Error:", error);
            setUploadStatus('error');
            setErrorMessage("Failed to read the file.");
        }
    };

    const handleAutoSync = async () => {
        if (!selectedMess) return;
        setUploadStatus('processing'); // Reuse upload status for UI feedback
        setErrorMessage('');

        try {
            // 1. Fetch from FC2 API using a CORS Proxy
            // We use api.allorigins.win to bypass CORS restrictions on the client side.
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const targetUrl = 'https://tikm.coolstuff.work/api/menu';

            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            if (!response.ok) throw new Error("Failed to fetch from FC2 API");

            const data = await response.json();
            if (!data.menu) throw new Error("Invalid data received from FC2 API");

            // 2. Map API Data to Our Schema
            const newMenu = {
                Monday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Tuesday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Wednesday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Thursday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Friday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Saturday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" },
                Sunday: { Breakfast: "N/A", Lunch: "N/A", Snacks: "N/A", Dinner: "N/A" }
            };

            // Iterate over dates in the response
            Object.values(data.menu).forEach(dayData => {
                const dayName = dayData.day; // e.g., "Monday"
                if (newMenu[dayName]) {
                    // Helper to join items
                    const joinItems = (items) => Array.isArray(items) ? items.join(", ") : (items || "N/A");

                    newMenu[dayName] = {
                        Breakfast: joinItems(dayData.meals?.breakfast?.items),
                        Lunch: joinItems(dayData.meals?.lunch?.items),
                        Snacks: joinItems(dayData.meals?.snacks?.items),
                        Dinner: joinItems(dayData.meals?.dinner?.items)
                    };
                }
            });

            // 3. Update Firestore
            const messRef = doc(db, "messes", selectedMess);
            await updateDoc(messRef, {
                menu: newMenu,
                lastUpdated: new Date().toISOString()
            });

            const messName = messes.find(m => m.id === selectedMess)?.name || selectedMess;
            await logAction("AUTO_SYNC_MENU", `Auto-synced menu from FC2 for ${messName}`, selectedMess);

            setUploadStatus('success');

        } catch (error) {
            console.error("Auto Sync Error:", error);
            setUploadStatus('error');
            setErrorMessage(error.message || "Failed to sync with FC2.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute top-0 -left-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            </div>

            <Navbar />

            <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden"
                >
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Menu Dashboard</h1>
                            <p className="text-gray-500 mt-2">Update weekly menus using AI-powered image recognition</p>
                        </div>
                        <div className="flex gap-2">
                            {userRole === 'super_admin' && (
                                <>
                                    <button
                                        onClick={() => setShowAccessManager(true)}
                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
                                        title="Manage Access Codes"
                                    >
                                        <UserPlus size={24} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowHistoryModal(true);
                                            fetchHistory();
                                        }}
                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all"
                                        title="View History"
                                    >
                                        <History size={24} />
                                    </button>
                                </>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                title="Logout"
                            >
                                <LogOut size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8 flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Mess</label>
                                <select
                                    value={selectedMess}
                                    onChange={(e) => setSelectedMess(e.target.value)}
                                    disabled={userRole === 'mess_admin'}
                                    className={`w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white/50 ${userRole === 'mess_admin' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {messes.map(mess => (
                                        <option key={mess.id} value={mess.id}>{mess.name}</option>
                                    ))}
                                </select>
                            </div>
                            {userRole === 'super_admin' && (
                                <>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="p-3 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                        title="Add New Mess"
                                    >
                                        <Plus size={24} />
                                    </button>
                                    <button
                                        onClick={handleDeleteMess}
                                        className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        title="Delete Selected Mess"
                                    >
                                        <Trash2 size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {uploadStatus === 'idle' && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className={`border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${isDragging ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Upload className="text-orange-600" size={40} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Drag & Drop Menu Image
                                    </h3>
                                    <p className="text-gray-500 mb-6">or click to browse files</p>
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files.length > 0) handleUpload(e.target.files[0]);
                                        }}
                                        accept="image/*"
                                    />
                                    <div className="flex flex-col items-center gap-4">
                                        <label
                                            htmlFor="file-upload"
                                            className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                                        >
                                            Browse Files
                                        </label>

                                        {(messes.find(m => m.id === selectedMess)?.name?.toLowerCase().includes('food court 2') ||
                                            messes.find(m => m.id === selectedMess)?.name?.toLowerCase().includes('fc2')) && (
                                                <>
                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                        <span className="h-px w-12 bg-gray-200"></span>
                                                        <span>OR</span>
                                                        <span className="h-px w-12 bg-gray-200"></span>
                                                    </div>
                                                    <button
                                                        onClick={handleAutoSync}
                                                        className="px-6 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg font-medium hover:bg-blue-100 transition-colors shadow-sm flex items-center gap-2"
                                                    >
                                                        <RefreshCw size={18} /> Sync with FC2
                                                    </button>
                                                </>
                                            )}
                                    </div>
                                </motion.div>
                            )}

                            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="border rounded-2xl p-12 text-center bg-white/50"
                                >
                                    <div className="w-24 h-24 mx-auto mb-6 rounded-full skeleton-loader"></div>
                                    <div className="h-8 w-48 mx-auto mb-4 rounded skeleton-loader"></div>
                                    <div className="h-4 w-64 mx-auto rounded skeleton-loader"></div>
                                </motion.div>
                            )}

                            {uploadStatus === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border border-green-200 bg-green-50/50 rounded-2xl p-12 text-center"
                                >
                                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="text-green-600" size={40} />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Menu Updated Successfully!
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        The menu for <span className="font-semibold">{messes.find(m => m.id === selectedMess)?.name}</span> has been updated.
                                    </p>
                                    <button
                                        onClick={() => setUploadStatus('idle')}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
                                    >
                                        Upload Another
                                    </button>
                                </motion.div>
                            )}

                            {uploadStatus === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border border-red-200 bg-red-50/50 rounded-2xl p-8 text-center"
                                >
                                    <h3 className="text-xl font-semibold text-red-900 mb-2">
                                        Upload Failed
                                    </h3>
                                    <p className="text-red-600 mb-6 font-mono text-sm bg-red-100 p-3 rounded">
                                        {errorMessage}
                                    </p>
                                    <button
                                        onClick={() => setUploadStatus('idle')}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div >
                </motion.div >
            </main >

            {/* Add Mess Modal */}
            < AnimatePresence >
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Add New Mess</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddMess} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mess Name</label>
                                    <input
                                        type="text"
                                        value={newMessName}
                                        onChange={(e) => setNewMessName(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="e.g., New Hostel Mess"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                                    <select
                                        value={newMessColor}
                                        onChange={(e) => setNewMessColor(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                        <option value="from-orange-500 to-red-500">Orange (Default)</option>
                                        <option value="from-blue-500 to-cyan-500">Blue</option>
                                        <option value="from-green-500 to-emerald-500">Green</option>
                                        <option value="from-purple-500 to-pink-500">Purple</option>
                                        <option value="from-pink-500 to-rose-500">Pink</option>
                                    </select>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                                    >
                                        Create Mess
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* History Modal */}
            < AnimatePresence >
                {showHistoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-2">
                                    <History className="text-orange-600" size={24} />
                                    <h3 className="text-xl font-bold text-gray-900">Activity History</h3>
                                </div>
                                <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {loadingHistory ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="mt-1">
                                                    <div className="w-8 h-8 rounded-full skeleton-loader"></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="h-4 w-3/4 mb-2 rounded skeleton-loader"></div>
                                                    <div className="h-3 w-1/2 rounded skeleton-loader"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : auditLogs.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No activity recorded yet.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {auditLogs.map(log => (
                                            <div key={log.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="mt-1">
                                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                                        <Clock size={16} className="text-gray-500" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{log.details}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <span className="font-semibold text-orange-600">{log.adminName || log.adminEmail}</span>
                                                        {log.adminName && <span className="text-gray-400">({log.adminEmail})</span>}
                                                        <span>•</span>
                                                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >

            {/* Access Code Manager Modal */}
            < AnimatePresence >
                {showAccessManager && (
                    <AccessCodeManager onClose={() => setShowAccessManager(false)} />
                )}
            </AnimatePresence >
        </div >
    );
};

export default AdminDashboard;
