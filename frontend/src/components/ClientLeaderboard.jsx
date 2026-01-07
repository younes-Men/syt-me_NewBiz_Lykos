import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ClientLeaderboard = ({ isOpen, onClose, projet, adminKey }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [totalRdv, setTotalRdv] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentDate, setCurrentDate] = useState('');
    const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
            updateDateDisplay();
        }
    }, [isOpen, projet, viewMode]);

    const updateDateDisplay = () => {
        const date = new Date();
        if (viewMode === 'day') {
            setCurrentDate(date.toLocaleDateString('fr-FR'));
        } else {
            const month = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
            setCurrentDate(month.charAt(0).toUpperCase() + month.slice(1));
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/entreprise/stats/leaderboard`,
                {
                    params: { projet, period: viewMode, groupBy: 'client_of' },
                    headers: adminKey ? { 'x-admin-key': adminKey } : {}
                }
            );

            if (response.data.success) {
                setLeaderboardData(response.data.leaderboard);
                setTotalRdv(response.data.total);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du classement clients:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderProfileCircle = (name, sizeClasses = "w-10 h-10", textClasses = "text-sm") => {
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return (
            <div className={`${sizeClasses} rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]`}>
                <span className={`${textClasses} font-bold text-blue-300`}>{initial}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl bg-[#0a0a1a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 flex justify-between items-center bg-[#0f0f25] border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-3">
                        <span className="text-blue-500">📊</span>
                        Classement Clients {viewMode === 'day' ? 'du Jour' : 'du Mois'}
                    </h2>

                    <div className="flex gap-4 items-center">
                        {/* Filtre Période */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-gray-700 flex p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'day'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Aujourd'hui
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${viewMode === 'month'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Ce Mois
                            </button>
                        </div>

                        <div className="bg-[#1a1a2e] px-4 py-1.5 rounded-lg border border-gray-700">
                            <span className="text-blue-400 font-bold text-lg">{totalRdv} RDV</span>
                        </div>

                        <button
                            onClick={onClose}
                            className="ml-2 text-gray-400 hover:text-white transition-colors p-1"
                        >
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#050510]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-[#0f0f20] rounded-xl overflow-hidden shadow-lg border border-gray-800">
                                <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 bg-[#15152a]">
                                    <div className="col-span-1 pl-2">Rang</div>
                                    <div className="col-span-8">Client / Organisme</div>
                                    <div className="col-span-3 text-right pr-4">Rendez-vous</div>
                                </div>

                                <div className="divide-y divide-gray-800">
                                    {leaderboardData.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                            <div className="col-span-1 pl-2 font-bold text-blue-400">#{idx + 1}</div>
                                            <div className="col-span-8 flex items-center gap-4">
                                                {renderProfileCircle(item.name)}
                                                <span className="font-semibold text-gray-200 text-lg uppercase">{item.name}</span>
                                            </div>
                                            <div className="col-span-3 text-right pr-4 font-bold text-blue-400 text-2xl group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                                                {item.count}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {leaderboardData.length === 0 && (
                                <div className="text-center py-20 text-gray-500">
                                    <p className="text-xl">Aucun rendez-vous enregistré pour cette période.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClientLeaderboard;
