import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Import des images de profil
import IlhamImg from '../images/WhatsApp Image 2026-01-06 at 14.58.08.jpeg';
import BenzaydouneImg from '../images/WhatsApp Image 2026-01-06 at 15.08.31.jpeg';
import LabibaImg from '../images/WhatsApp Image 2026-01-06 at 15.07.11.jpeg';
import OumaimaImg from '../images/WhatsApp Image 2026-01-06 at 15.23.48.jpeg';
import AssiaImg from '../images/WhatsApp Image 2026-01-06 at 15.15.03.jpeg';
import WissalImg from '../images/WhatsApp Image 2026-01-06 at 16.26.59.jpeg';

const FUNEBOOSTER_IMAGES = {
    'ILHAM': IlhamImg,
    'BENZAYDOUNE': BenzaydouneImg,
    'LABIBA': LabibaImg,
    'OUMAIMA': OumaimaImg,
    'ASSIA': AssiaImg,
    'WISSAL': WissalImg
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Leaderboard = ({ isOpen, onClose, projet, adminKey }) => {
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
                    params: { projet, period: viewMode },
                    headers: adminKey ? { 'x-admin-key': adminKey } : {}
                }
            );

            if (response.data.success) {
                setLeaderboardData(response.data.leaderboard);
                setTotalRdv(response.data.total);
            }
        } catch (error) {
            console.error('Erreur lors du chargement du classement:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const top3 = leaderboardData.slice(0, 3);
    const rest = leaderboardData.slice(3);

    // Helper pour obtenir l'image ou l'initiale
    const renderProfileCircle = (name, sizeClasses = "w-20 h-20", textClasses = "text-3xl") => {
        const upperName = (name || '').toUpperCase();
        const imgSrc = FUNEBOOSTER_IMAGES[upperName];

        if (imgSrc) {
            return (
                <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-gray-500 shadow-lg`}>
                    <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
                </div>
            );
        }

        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return (
            <div className={`${sizeClasses} rounded-full bg-gray-700/50 flex items-center justify-center border-2 border-gray-500`}>
                <span className={`${textClasses} font-bold text-gray-300`}>{initial}</span>
            </div>
        );
    };

    // Helper spécifique pour la 1ère place
    const renderGoldProfileCircle = (name) => {
        const upperName = (name || '').toUpperCase();
        const imgSrc = FUNEBOOSTER_IMAGES[upperName];

        if (imgSrc) {
            return (
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                    <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
                </div>
            );
        }

        const initial = name ? name.charAt(0).toUpperCase() : '?';
        return (
            <div className="w-24 h-24 rounded-full bg-yellow-900/30 flex items-center justify-center border-2 border-yellow-500 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                <span className="text-4xl font-bold text-yellow-100">{initial}</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl bg-[#0a0a1a] rounded-3xl border border-gray-800 shadow-[0_0_50px_rgba(255,0,255,0.15)] overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 flex justify-between items-center bg-[#0f0f25] border-b border-gray-800">
                    <h2 className="text-3xl font-bold text-white tracking-wide">
                        Classement {viewMode === 'day' ? 'du Jour' : 'du Mois'}
                    </h2>

                    <div className="flex gap-4 items-center">
                        {/* Filtre Période */}
                        <div className="bg-[#1a1a2e] rounded-lg border border-gray-700 flex p-1">
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'day'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Aujourd'hui
                            </button>
                            <button
                                onClick={() => setViewMode('month')}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'month'
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                Ce Mois
                            </button>
                        </div>

                        <div className="bg-[#1a1a2e] px-4 py-2 rounded-lg border border-gray-700">
                            <span className="text-gray-400 text-sm block">Total RDV</span>
                            <span className="text-blue-400 font-bold text-xl">{totalRdv}</span>
                        </div>
                        <div className="bg-[#1a1a2e] px-4 py-2 rounded-lg border border-gray-700 flex items-center gap-2 min-w-[150px] justify-center">
                            <span className="text-xl">📅</span>
                            <span className="text-white font-semibold">{currentDate}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="ml-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-[#050510]">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            {/* Podium Section */}
                            {top3.length > 0 && (
                                <div className="flex justify-center items-end gap-6 mb-12 min-h-[300px]">
                                    {/* 2nd Place */}
                                    {top3[1] && (
                                        <div className="flex flex-col items-center w-1/3 max-w-[250px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                                            <div className="mb-4 relative">
                                                <span className="text-5xl drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]">🥈</span>
                                            </div>
                                            <div className="w-full bg-[#16162a] rounded-t-2xl border-t-4 border-gray-400 p-6 flex flex-col items-center shadow-[0_0_20px_rgba(192,192,192,0.1)] h-[220px] justify-center relative translate-y-4">
                                                {renderProfileCircle(top3[1].name)}
                                                <h3 className="text-xl font-bold text-white mb-1">{top3[1].name}</h3>
                                                <div className="text-4xl font-black text-blue-400 mb-1">{top3[1].count}</div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">RDVs Confirmés</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 1st Place */}
                                    {top3[0] && (
                                        <div className="flex flex-col items-center w-1/3 max-w-[280px] z-10 animate-fade-in-up">
                                            <div className="mb-4 relative">
                                                <span className="text-6xl drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]">🥇</span>
                                            </div>
                                            <div className="w-full bg-[#1e1e38] rounded-t-2xl border-t-4 border-yellow-400 p-8 flex flex-col items-center shadow-[0_0_30px_rgba(255,215,0,0.2)] h-[280px] justify-center relative">
                                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 to-transparent rounded-t-2xl pointer-events-none"></div>
                                                {renderGoldProfileCircle(top3[0].name)}
                                                <h3 className="text-2xl font-bold text-white mb-2">{top3[0].name}</h3>
                                                <div className="text-5xl font-black text-blue-400 mb-1 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">{top3[0].count}</div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">RDVs Confirmés</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3rd Place */}
                                    {top3[2] && (
                                        <div className="flex flex-col items-center w-1/3 max-w-[250px] animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                                            <div className="mb-4 relative">
                                                <span className="text-5xl drop-shadow-[0_0_10px_rgba(205,127,50,0.5)]">🥉</span>
                                            </div>
                                            <div className="w-full bg-[#16162a] rounded-t-2xl border-t-4 border-orange-700 p-6 flex flex-col items-center shadow-[0_0_20px_rgba(205,127,50,0.1)] h-[200px] justify-center relative translate-y-8">
                                                {renderProfileCircle(top3[2].name, "w-20 h-20", "text-3xl", "border-orange-800")}
                                                <h3 className="text-xl font-bold text-white mb-1">{top3[2].name}</h3>
                                                <div className="text-4xl font-black text-blue-400 mb-1">{top3[2].count}</div>
                                                <div className="text-xs text-gray-400 uppercase tracking-wider">RDVs Confirmés</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* List Section */}
                            {rest.length > 0 && (
                                <div className="bg-[#0f0f20] rounded-xl overflow-hidden shadow-lg border border-gray-800">
                                    <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 bg-[#15152a]">
                                        <div className="col-span-1 pl-4">Rang</div>
                                        <div className="col-span-8">Téléconseiller</div>
                                        <div className="col-span-3 text-right pr-4">Rendez-vous</div>
                                    </div>

                                    <div className="divide-y divide-gray-800">
                                        {rest.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                                <div className="col-span-1 pl-4 font-bold text-blue-400">#{idx + 4}</div>
                                                <div className="col-span-8 flex items-center gap-3">
                                                    {renderProfileCircle(item.name, "w-10 h-10", "text-sm")}
                                                    <span className="font-semibold text-gray-200 text-lg">{item.name}</span>
                                                </div>
                                                <div className="col-span-3 text-right pr-4 font-bold text-blue-400 text-xl group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.6)]">
                                                    {item.count}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {leaderboardData.length === 0 && (
                                <div className="text-center py-20 text-gray-500">
                                    <p className="text-xl">Aucun rendez-vous enregistré aujourd'hui.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
