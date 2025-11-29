import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { X, Shield, UserPlus, AlertTriangle, Trash2, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const AccessCodeManager = ({ onClose }) => {
    const [messes, setMesses] = useState([]);
    const [users, setUsers] = useState([]);
    const [newCode, setNewCode] = useState('');
    const [newName, setNewName] = useState('');
    const [selectedRole, setSelectedRole] = useState('mess_admin');
    const [selectedMess, setSelectedMess] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null); // For detail view

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Messes
            const messSnapshot = await getDocs(collection(db, "messes"));
            const messesData = messSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMesses(messesData);
            if (messesData.length > 0) setSelectedMess(messesData[0].id);

            // Fetch Users
            fetchUsers();
        };
        fetchData();
    }, []);

    const fetchUsers = async () => {
        const userSnapshot = await getDocs(collection(db, "users"));
        const usersData = userSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(user => !user.deleted); // Filter out soft-deleted users
        setUsers(usersData);
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newCode || !newName) return;

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
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    // Account exists in Auth. Check if we can reactivate/update it.
                    const userDocRef = doc(db, "users", email);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        // Reactivate and update details
                        await updateDoc(userDocRef, {
                            name: newName,
                            role: selectedRole,
                            messId: selectedRole === 'mess_admin' ? selectedMess : null,
                            deleted: false, // Reactivate
                            accessCode: newCode // Ensure code matches (it should if email matches)
                        });
                        alert(`Account "${newCode}" already existed. It has been reactivated and updated with the new details. You will now be logged out.`);
                    } else {
                        // Auth exists but Doc missing (Legacy/Broken state) - Recreate Doc
                        await setDoc(userDocRef, {
                            email: email,
                            name: newName,
                            accessCode: newCode,
                            role: selectedRole,
                            messId: selectedRole === 'mess_admin' ? selectedMess : null,
                            createdAt: new Date().toISOString(),
                            deleted: false
                        });
                        alert(`Account "${newCode}" existed in Auth but was missing profile data. It has been repaired. You will now be logged out.`);
                    }

                    // We need to sign out because we might be logged in as Super Admin, 
                    // but we just modified another user's data. 
                    // Actually, if we didn't create a NEW user, we are still logged in as Super Admin.
                    // But to be consistent with the flow (and force a clean state), let's logout.
                    await signOut(auth);
                    window.location.reload();
                    return;
                } else {
                    throw authError; // Re-throw other errors
                }
            }

            // 2. Create Firestore User Doc (If creation succeeded)
            await setDoc(doc(db, "users", email), {
                email: email,
                name: newName,
                accessCode: newCode, // Storing password for superadmin visibility
                role: selectedRole,
                messId: selectedRole === 'mess_admin' ? selectedMess : null,
                createdAt: new Date().toISOString(),
                deleted: false
            });

            alert(`Success! Access Code "${newCode}" created for "${newName}". You will now be logged out.`);
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

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete admin "${userName}"? They will no longer be able to log in.`)) {
            return;
        }

        try {
            // Soft delete: Mark as deleted in Firestore.
            await updateDoc(doc(db, "users", userId), { deleted: true });
            setUsers(users.filter(user => user.id !== userId));
            setSelectedUser(null); // Close modal if open
            alert(`Admin "${userName}" deleted successfully.`);
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Failed to delete user: " + err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-8"
            >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <Shield className="text-orange-600" size={24} />
                        <h3 className="text-xl font-bold text-gray-900">Manage Admins</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Create New Admin */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <UserPlus size={20} /> Create New Admin
                        </h4>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
                            <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                            <p className="text-sm text-yellow-800">
                                Creating a new code will <strong>log you out</strong>. You'll need to sign back in with your Super Admin code afterwards.
                            </p>
                        </div>

                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="e.g. Rahul (Mess Manager)"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Access Code (Password)</label>
                                <input
                                    type="text"
                                    value={newCode}
                                    onChange={(e) => setNewCode(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="e.g. SecretCode123"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">This will be used to log in.</p>
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

                    {/* Right Column: Existing Admins List */}
                    <div className="border-t lg:border-t-0 lg:border-l border-gray-200 pt-8 lg:pt-0 lg:pl-8">
                        <h4 className="text-lg font-semibold text-gray-800 mb-4">Existing Admins</h4>
                        <div className="overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                            <div className="space-y-3">
                                {users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => setSelectedUser(user)}
                                        className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h5 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{user.name || "Unnamed Admin"}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {user.role === 'super_admin' ? 'Super Admin' : 'Mess Admin'}
                                                    </span>
                                                    {user.messId && (
                                                        <span className="text-xs text-gray-500">
                                                            • {messes.find(m => m.id === user.messId)?.name || user.messId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-gray-400">
                                                <ArrowRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <p className="text-gray-500 text-center py-8">No admins found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-900">Admin Profile</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                                <p className="text-lg font-medium text-gray-900">{selectedUser.name || "N/A"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</label>
                                    <p className="text-sm font-medium text-gray-900 capitalize">{selectedUser.role.replace('_', ' ')}</p>
                                </div>
                                {selectedUser.messId && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mess</label>
                                        <p className="text-sm font-medium text-gray-900">{messes.find(m => m.id === selectedUser.messId)?.name || selectedUser.messId}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Access Code (Password)</label>
                                <div className="flex items-center gap-2">
                                    <Lock size={14} className="text-orange-500" />
                                    <p className="font-mono text-lg font-bold text-gray-900">{selectedUser.accessCode}</p>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 break-all">{selectedUser.email}</p>
                            </div>

                            {selectedUser.accessCode === "LALA HI LALA" ? (
                                <div className="bg-purple-50 text-purple-700 p-3 rounded-lg text-sm text-center font-medium border border-purple-100">
                                    👑 Owner Account (Protected)
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleDeleteUser(selectedUser.id, selectedUser.name)}
                                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} /> Delete Admin
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AccessCodeManager;
