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

    const handleUpload = async (file) => {
        setUploadStatus('uploading');

        try {
            // 1. Convert file to Base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];

                setUploadStatus('processing');
