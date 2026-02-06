import React, { useState } from 'react';

const ExportModal = ({ isOpen, onClose, onExport, projet }) => {
    const [viewMode, setViewMode] = useState('day'); // 'day' | '15days' | 'month' | 'year' | 'custom'
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    if (!isOpen) return null;

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    const handleExport = () => {
        onExport({
            period: viewMode,
            month: selectedMonth,
            year: selectedYear
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-[#0a0a1a] rounded-[2rem] border border-newbiz-purple/30 shadow-[0_0_50px_rgba(255,0,255,0.2)] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 bg-[#0f0f25] border-b border-gray-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <span className="text-blue-500">📥</span>
                        Exporter en Excel
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 bg-[#050510]">
                    <p className="text-gray-300 text-sm">
                        Sélectionnez la période pour laquelle vous souhaitez exporter les entreprises traitées dans le projet <span className="text-newbiz-cyan font-bold">{projet}</span>.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setViewMode('day')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${viewMode === 'day'
                                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                                }`}
                        >
                            <span className="text-2xl">📅</span>
                            <span className="font-semibold text-sm">Aujourd'hui</span>
                        </button>

                        <button
                            onClick={() => setViewMode('15days')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${viewMode === '15days'
                                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                                }`}
                        >
                            <span className="text-2xl">🕒</span>
                            <span className="font-semibold text-sm">Derniers 15 jours</span>
                        </button>

                        <button
                            onClick={() => setViewMode('month')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${viewMode === 'month'
                                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15_rgba(59,130,246,0.2)]'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                                }`}
                        >
                            <span className="text-2xl">📊</span>
                            <span className="font-semibold text-sm">Ce Mois</span>
                        </button>

                        <button
                            onClick={() => setViewMode('year')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${viewMode === 'year'
                                    ? 'border-blue-500 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                                    : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700'
                                }`}
                        >
                            <span className="text-2xl">🗓️</span>
                            <span className="font-semibold text-sm">Cette Année</span>
                        </button>
                    </div>

                    <div
                        className={`p-4 rounded-xl border-2 transition-all space-y-4 ${viewMode === 'custom'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-gray-800 bg-gray-900/50'
                            }`}
                        onClick={() => setViewMode('custom')}
                    >
                        <div className="flex items-center gap-3 cursor-pointer">
                            <span className="text-2xl">🔍</span>
                            <span className={`font-semibold text-sm ${viewMode === 'custom' ? 'text-white' : 'text-gray-400'}`}>Mois Spécifique</span>
                        </div>

                        {viewMode === 'custom' && (
                            <div className="flex gap-4">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="flex-1 bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                >
                                    {months.map((m, i) => (
                                        <option key={m} value={i + 1}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="flex-1 bg-black border border-gray-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#0f0f25] border-t border-gray-800 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:bg-white/5 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        <span>📥</span> Télécharger
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
