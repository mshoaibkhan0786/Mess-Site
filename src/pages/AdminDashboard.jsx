import React, { useState, useEffect } from 'react';
                                    </p >
    <button
        onClick={() => setUploadStatus('idle')}
        className="px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
    >
        Try Again
    </button>
                                </motion.div >
                            )}
                        </AnimatePresence >
                    </div >
                </motion.div >
            </main >
        </div >
    );
};

export default AdminDashboard;
