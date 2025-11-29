import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, Loader2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [messes, setMesses] = useState([]);
    const [selectedMess, setSelectedMess] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, processing, success
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/admin');
            }
        });

        const fetchMesses = async () => {
            const querySnapshot = await getDocs(collection(db, "messes"));
            const messesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMesses(messesData);
            if (messesData.length > 0) {
                setSelectedMess(messesData[0].id);
            }
        };
        fetchMesses();

        return () => unsubscribe();
    }, [navigate]);

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

    const handleUpload = (file) => {
        setUploadStatus('uploading');

        // Simulate upload and AI processing
        setTimeout(async () => {
            setUploadStatus('processing');

            // SIMULATED AI PARSING RESULT (For Demo)
            // In a real app, this would come from the backend/AI service
            const newMenu = {
                Monday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Tuesday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Wednesday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Thursday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Friday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Saturday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" },
                Sunday: { Breakfast: "Updated Item 1", Lunch: "Updated Item 2", Snacks: "Updated Item 3", Dinner: "Updated Item 4" }
            };

            try {
                const messRef = doc(db, "messes", selectedMess);
                await updateDoc(messRef, { menu: newMenu });
                setUploadStatus('success');
            } catch (error) {
                console.error("Error updating menu:", error);
                setUploadStatus('idle'); // Reset on error
                alert("Failed to update menu");
            }
        }, 1500);
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
                    <div className="p-8 border-b border-gray-100">
                        <h1 className="text-3xl font-bold text-gray-900">Menu Dashboard</h1>
                        <p className="text-gray-500 mt-2">Update weekly menus using AI-powered image recognition</p>
                    </div>

                    <div className="p-8">
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Mess</label>
                            <select
                                value={selectedMess}
                                onChange={(e) => setSelectedMess(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white/50"
                            >
                                {messes.map(mess => (
                                    <option key={mess.id} value={mess.id}>{mess.name}</option>
                                ))}
                            </select>
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
                                    <button className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm">
                                        Browse Files
                                    </button>
                                </motion.div>
                            )}

                            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="border rounded-2xl p-12 text-center bg-white/50"
                                >
                                    <div className="relative w-24 h-24 mx-auto mb-6">
                                        <div className="absolute inset-0 border-4 border-orange-100 rounded-full"></div>
                                        <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {uploadStatus === 'uploading' ? (
                                                <Upload className="text-orange-500 animate-pulse" size={32} />
                                            ) : (
                                                <FileText className="text-orange-500 animate-pulse" size={32} />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {uploadStatus === 'uploading' ? 'Uploading Image...' : 'AI Processing...'}
                                    </h3>
                                    <p className="text-gray-500">
                                        {uploadStatus === 'uploading'
                                            ? 'Sending to server'
                                            : 'Extracting menu items from image'}
                                    </p>
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
                        </AnimatePresence>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default AdminDashboard;
