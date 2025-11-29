import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const SeedRoles = () => {
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const seed = async () => {
            try {
                // Set admin@mitmess.com as Super Admin
                await setDoc(doc(db, "users", "admin@mitmess.com"), {
                    email: "admin@mitmess.com",
                    role: "super_admin",
                    messId: null // Super admin has access to all
                });
                setStatus('Success! Super Admin role created.');
            } catch (error) {
                console.error("Seeding error:", error);
                setStatus(`Error: ${error.message}`);
            }
        };
        seed();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-xl shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Role Seeding</h1>
                <p className={status.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                    {status}
                </p>
            </div>
        </div>
    );
};

export default SeedRoles;
