import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { X, Shield, UserPlus, AlertTriangle, Trash2, Lock } from 'lucide-react';
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
        const usersData = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
            await createUserWithEmailAndPassword(auth, email, password);

            // 2. Create Firestore User Doc
            await setDoc(doc(db, "users", email), {
                email: email,
                name: newName,
                accessCode: newCode, // Storing password for superadmin visibility
                role: selectedRole,
                messId: selectedRole === 'mess_admin' ? selectedMess : null,
                createdAt: new Date().toISOString()
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
            // Soft delete: Remove from Firestore. Auth user remains but login is blocked by AdminLogin check.
            await deleteDoc(doc(db, "users", userId));
            setUsers(users.filter(user => user.id !== userId));
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
                                    <div key={user.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h5 className="font-bold text-gray-900">{user.name || "Unnamed Admin"}</h5>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {user.role === 'super_admin' ? 'Super Admin' : 'Mess Admin'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.name)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Delete Admin"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Lock size={14} className="text-gray-400" />
                                                <span className="font-mono bg-gray-200 px-1.5 rounded text-xs">{user.accessCode || "Hidden"}</span>
                                            </div>
                                            {user.messId && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Mess:</span>
                                                    <span>{messes.find(m => m.id === user.messId)?.name || user.messId}</span>
                                                </div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-2">
                                                {user.email}
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
        </div>
    );
};

export default AccessCodeManager;
