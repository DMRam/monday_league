import { useState, useEffect } from 'react';
import { FaVolleyballBall, FaSignOutAlt, FaGlobe } from 'react-icons/fa';
import { db } from '../services/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useDashboard } from '../hooks/useDashboard';
import type { Match, Team } from '../interfaces/Dashboards';
import { AdminTab } from './components/AdminTab';
import { ActiveTabsRenderer } from './components/ActiveTabs';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { VolleyballLoader } from './components/VolleyballLoader';

export const Dashboard = () => {
    const {
        addPlayerToTeamForm,
        addTeam,
        canEditScore,
        generateMatches,
        removePlayerFromTeamForm,
        saveMatchResults,
        updateMatchScore,
        sortMatches
    } = useDashboard();

    const { user, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const navigate = useNavigate();

    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState('matches');
    const [selectedTeam, setSelectedTeam] = useState<Team>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Simple week calculation based on fixed start date
    const getCurrentWeek = (): number => {
        const leagueStartDate = new Date(2025, 8, 22); // September 22, 2025 (month is 0-indexed)
        const today = new Date();

        // Calculate difference in milliseconds
        const diffTime = today.getTime() - leagueStartDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7) + 1; // +1 because week 1 started on Sept 22

        return Math.max(1, diffWeeks); // Ensure at least week 1
    };

    const [currentWeek, setCurrentWeek] = useState(getCurrentWeek());

    // Admin form state
    const [newTeamName, setNewTeamName] = useState('');
    const [newCoach, setNewCoach] = useState('');
    const [newPlayers, setNewPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newTeamPool, setNewTeamPool] = useState('A');

    // Match creation state
    const [showMatchCreation, setShowMatchCreation] = useState(false);
    const [weeksToGenerate, setWeeksToGenerate] = useState(1);

    useEffect(() => {
        setLoading(true);

        const teamsRef = collection(db, 'teams');
        const unsubscribeTeams = onSnapshot(teamsRef, (snapshot) => {
            const fetchedTeams: Team[] = snapshot.docs
                .filter(doc => {
                    const data = doc.data();
                    const isValid = data.name && data.coach;
                    if (!isValid) {
                        console.warn(`Skipping invalid team document: ${doc.id}`);
                    }
                    return isValid;
                })
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        totalPoints: data.totalPoints || 0,
                        pool: data.pool || 'Unassigned',
                        coach: data.coach,
                        players: data.players || [],
                        currentDayPoints: data.currentDayPoints || 0,
                        secondPeriodPoints: data.secondPeriodPoints || 0,
                        weeklyStats: data.weeklyStats || []
                    } as Team;
                })
                .sort((a, b) => b.totalPoints - a.totalPoints);

            setTeams(fetchedTeams);
            setSaving(false);
        });

        // --- Real-time sync for MATCHES ---
        const matchesRef = collection(db, 'matches');
        const unsubscribeMatches = onSnapshot(matchesRef, (snapshot) => {
            const fetchedMatches: Match[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Match));

            setMatches(sortMatches(fetchedMatches));
            setLoading(false);
        });

        // Clean up on unmount
        return () => {
            unsubscribeTeams();
            unsubscribeMatches();
            setSaving(false);
        };
    }, [currentWeek]);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'fr' : 'en');
    };

    // Week navigation
    const nextWeek = () => setCurrentWeek(currentWeek + 1);
    const prevWeek = () => setCurrentWeek(Math.max(1, currentWeek - 1));

    // Sorting
    const sortedTeams = teams ? [...teams].sort((a, b) => b.totalPoints - a.totalPoints) : [];
    const premierPool = sortedTeams.slice(0, 3);
    const secondaryPool = sortedTeams.slice(3);
    const currentWeekMatches = matches.filter(match => match.week === currentWeek);
    const standings = teams ? [...teams].sort((a, b) => b.totalPoints - a.totalPoints) : [];

    const renderContent = () => {
        // Show loading state for initial load
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20">
                    <VolleyballLoader size="large" />
                    <p className="mt-4 text-gray-600 text-lg">{t.dashboard.loading}</p>
                </div>
            );
        }

        if (activeTab === 'admin') {
            return (
                <AdminTab
                    addPlayerToTeamForm={addPlayerToTeamForm}
                    addTeam={addTeam}
                    generateMatches={generateMatches}
                    matches={matches}
                    newCoach={newCoach}
                    newPlayerName={newPlayerName}
                    newPlayers={newPlayers}
                    newTeamName={newTeamName}
                    newTeamPool={newTeamPool}
                    removePlayerFromTeamForm={removePlayerFromTeamForm}
                    setMatches={setMatches}
                    setNewCoach={setNewCoach}
                    setNewPlayerName={setNewPlayerName}
                    setNewPlayers={setNewPlayers}
                    setNewTeamName={setNewTeamName}
                    setNewTeamPool={setNewTeamPool}
                    setShowMatchCreation={setShowMatchCreation}
                    setTeams={setTeams}
                    setWeeksToGenerate={setWeeksToGenerate}
                    showMatchCreation={showMatchCreation}
                    teams={teams}
                    weeksToGenerate={weeksToGenerate}
                    t={t.dashboard}
                />
            );
        }

        return (
            <ActiveTabsRenderer
                activeTab={activeTab}
                canEditScore={canEditScore}
                currentWeek={currentWeek}
                currentWeekMatches={currentWeekMatches}
                matches={matches}
                nextWeek={nextWeek}
                prevWeek={prevWeek}
                premierPool={premierPool}
                saveMatchResults={saveMatchResults}
                secondaryPool={secondaryPool}
                selectedTeam={selectedTeam}
                setActiveTab={setActiveTab}
                setMatches={setMatches}
                setSelectedTeam={setSelectedTeam}
                setTeams={setTeams}
                standings={standings}
                teams={teams}
                updateMatchScore={updateMatchScore}
                user={user}
                t={t.dashboard}
                setSaving={setSaving}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gray-100 relative">
            {/* Global Saving Overlay */}
            {saving && (
                <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all duration-300">
                    <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center space-y-4 min-w-[200px]">
                        <VolleyballLoader size="medium" />
                        <p className="text-gray-700 font-medium text-lg">{t.dashboard.saving}</p>
                        <p className="text-gray-500 text-sm text-center">
                            {t.dashboard.savingDescription || "Please wait while we save your changes..."}
                        </p>
                    </div>
                </div>
            )}

            <header className="bg-blue-800 text-white shadow-lg relative z-10">
                <div className="container mx-auto px-4 py-3">
                    {/* Top row - logo and user actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex items-center">
                            <FaVolleyballBall className="text-2xl text-orange-400 mr-2" />
                            <h1 className="text-2xl font-bold">{t.title}</h1>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleLanguage}
                                    className="flex items-center space-x-1 text-white hover:text-orange-300 transition-colors px-3 py-1 rounded-full border border-white/30 hover:border-orange-300 text-sm"
                                    aria-label={language === 'en' ? 'Switch to French' : 'Passer en anglais'}
                                >
                                    <FaGlobe className="text-xs" />
                                    <span className="font-medium">{language === 'en' ? 'FR' : 'EN'}</span>
                                </button>
                                <span className="text-sm sm:text-base whitespace-nowrap">
                                    {t.dashboard.welcome}, {user?.name}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="bg-blue-700 hover:bg-blue-600 px-3 py-2 rounded-lg flex items-center justify-center transition text-sm sm:text-base w-full sm:w-auto"
                            >
                                <FaSignOutAlt className="mr-2" />
                                {t.dashboard.logout}
                            </button>
                        </div>
                    </div>

                    {/* Tab navigation */}
                    <div className="mt-4">
                        <div className="flex overflow-x-auto space-x-2 pb-1">
                            <button
                                onClick={() => setActiveTab('matches')}
                                className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${activeTab === 'matches'
                                    ? 'bg-white text-blue-800 font-semibold'
                                    : 'text-blue-200 hover:bg-blue-700'
                                    }`}
                            >
                                {t.dashboard.matches}
                            </button>
                            <button
                                onClick={() => setActiveTab('dashboard')}
                                className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${activeTab === 'dashboard'
                                    ? 'bg-white text-blue-800 font-semibold'
                                    : 'text-blue-200 hover:bg-blue-700'
                                    }`}
                            >
                                {t.dashboard.dashboard}
                            </button>
                            <button
                                onClick={() => setActiveTab('teams')}
                                className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${activeTab === 'players'
                                    ? 'bg-white text-blue-800 font-semibold'
                                    : 'text-blue-200 hover:bg-blue-700'
                                    }`}
                            >
                                {t.dashboard.teams}
                            </button>

                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`px-4 py-2 rounded-t-lg transition whitespace-nowrap ${activeTab === 'admin'
                                    ? 'bg-white text-blue-800 font-semibold'
                                    : user?.role === 'admin'
                                        ? 'text-blue-200 hover:bg-blue-700'
                                        : 'text-gray-400 cursor-not-allowed'
                                    }`}
                                disabled={user?.role !== 'admin'}
                            >
                                {t.dashboard.admin}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {renderContent()}
            </div>
        </div>
    );
};