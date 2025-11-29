import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { X, Shield, UserPlus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const AccessCodeManager = ({ onClose }) => {
    const [messes, setMesses] = useState([]);
    const [newCode, setNewCode] = useState('');
    const [selectedRole, setSelectedRole] = useState('mess_admin');
    const [selectedMess, setSelectedMess] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMesses = async () => {
            const querySnapshot = await getDocs(collection(db, "messes"));
            const messesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMesses(messesData);
            if (messesData.length > 0) setSelectedMess(messesData[0].id);
        };
        fetchMesses();
    }, []);

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newCode) return;

        if (!window.confirm("WARNING: Creating a new account requires logging out of the current session. You will need to log back in as Super Admin afterwards. Continue?")) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Sanitize code for email: trim, replace spaces with underscores, and lowercase
            const sanitizedCode = newCode.trim().replace(/\s+/g, '_').toLowerCase();
            const email = `${sanitizedCode}@mitmess.com`;
            const password = newCode;

            // 1. Create Auth User (This logs us in as the new user)
            await createUserWithEmailAndPassword(auth, email, password);

            // 2. Create Firestore User Doc
            await setDoc(doc(db, "users", email), {
                email: email,
                role: selectedRole,
                messId: selectedRole === 'mess_admin' ? selectedMess : null,
                createdAt: new Date().toISOString()
            });

            alert(`Success! Access Code "${newCode}" created. You will now be logged out.`);
            await signOut(auth);
            window.location.reload(); // Force reload to go to login screen

        } catch (err) {
            console.error("Creation Error:", err);
            setError(err.message);
            setLoading(false);
            // If we got logged out or in a weird state, try to sign out
            await signOut(auth);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Shield className="text-orange-600" size={24} />
                        <h3 className="text-xl font-bold text-gray-900">Create Access Code</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
                        <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                        <p className="text-sm text-yellow-800">
                            Creating a new code will <strong>log you out</strong>. You'll need to sign back in with your Super Admin code afterwards.
                        </p>
                    </div>

                    <form onSubmit={handleCreateAccount} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Access Code</label>
                            <input
                                type="text"
                                value={newCode}
                                onChange={(e) => setNewCode(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="e.g. AdityaBoss123"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">This will be both the login code and password.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                            >
                                <option value="mess_admin">Mess Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                        </div>

                        {selectedRole === 'mess_admin' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Mess</label>
                                <select
                                    value={selectedMess}
                                    onChange={(e) => setSelectedMess(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    {messes.map(mess => (
                                        <option key={mess.id} value={mess.id}>{mess.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {error && <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>Create & Logout <UserPlus size={20} /></>}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default AccessCodeManager;
