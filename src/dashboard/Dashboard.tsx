// Dashboard.tsx
import { useState, useEffect } from 'react';
import { FaVolleyballBall, FaSignOutAlt } from 'react-icons/fa';
import { db } from '../services/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useDashboard } from '../hooks/useDashboard';
import type { Match, Team } from '../interfaces/Dashboards';
import { AdminTab } from './components/AdminTab';
import { ActiveTabsRenderer } from './components/ActiveTabs';
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext';
// import { initializeTeams } from '../admin/UpdateTeamPlayers';
// import { initializeUsers } from '../admin/CreateUsers';

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

    // const [initializationStatus, setInitializationStatus] = useState<string>('');
    // const [initializing, setInitializing] = useState(false);



    // initializeUsers()
    // initializeTeams()

    const { user, logout } = useAuth();

    console.log('User: ', user)
    const navigate = useNavigate();

    const [currentWeek, setCurrentWeek] = useState(1);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState('matches');
    const [selectedTeam, setSelectedTeam] = useState<Team>();
    const [loading, setLoading] = useState(true);

    // Admin form state
    const [newTeamName, setNewTeamName] = useState('');
    const [newCoach, setNewCoach] = useState('');
    const [newPlayers, setNewPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newTeamPool, setNewTeamPool] = useState('A');

    // Match creation state
    const [showMatchCreation, setShowMatchCreation] = useState(false);
    const [weeksToGenerate, setWeeksToGenerate] = useState(6);

    // const handleManualInitialize = async () => {
    //     if (user?.role !== 'admin') return;

    //     setInitializing(true);
    //     setInitializationStatus('Initializing...');

    //     try {
    //         const result = await initializeUsers();
    //         setInitializationStatus(result.success ? '✅ Initialization successful!' : 'ℹ️ ' + result.message);
    //     } catch (error) {
    //         setInitializationStatus('❌ Initialization failed: ' + error);
    //     } finally {
    //         setInitializing(false);
    //     }
    // };

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'teams'));
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
                            secondPeriodPoints: data.secondPeriodPoints || 0
                        } as Team;
                    });

                setTeams(fetchedTeams);
                console.log("Fetched teams:", fetchedTeams.length, fetchedTeams);
            } catch (error) {
                console.error('Error fetching teams:', error);
            }
        };

        console.log("TEAM LENGTH!!!! ", teams.length)

        const fetchMatches = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'matches'));
                const fetchedMatches: Match[] = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    } as Match))

                setMatches(sortMatches(fetchedMatches));
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchTeams(), fetchMatches()]);
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/", { replace: true });
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


    console.log("Current Week Matches: ", currentWeekMatches)
    // Reorder tabs: Matches first, then Dashboard
    const renderContent = () => {
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
            />
        );
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-blue-800 text-white shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <FaVolleyballBall className="text-2xl text-orange-400 mr-2" />
                        <h1 className="text-2xl font-bold">Volleyball League</h1>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-4">Welcome, {user?.name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center transition"
                        >
                            <FaSignOutAlt className="mr-2" /> Logout
                        </button>
                    </div>
                </div>
                <div className="container mx-auto px-4 mt-4">
                    <div className="flex overflow-x-auto space-x-2">
                        {/* Matches tab first */}
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`px-4 py-2 rounded-t-lg transition ${activeTab === 'matches' ? 'bg-white text-blue-800 font-semibold' : 'text-blue-200 hover:bg-blue-700'}`}
                        >
                            Matches
                        </button>
                        {/* Dashboard and Teams combined */}
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-4 py-2 rounded-t-lg transition ${activeTab === 'dashboard' ? 'bg-white text-blue-800 font-semibold' : 'text-blue-200 hover:bg-blue-700'}`}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveTab('teams')}
                            className={`px-4 py-2 rounded-t-lg transition ${activeTab === 'players' ? 'bg-white text-blue-800 font-semibold' : 'text-blue-200 hover:bg-blue-700'}`}
                        >
                            Teams
                        </button>

                        {/* Admin tab */}
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`px-4 py-2 rounded-t-lg transition ${activeTab === 'admin'
                                ? 'bg-white text-blue-800 font-semibold'
                                : user?.role === 'admin'
                                    ? 'text-blue-200 hover:bg-blue-700'
                                    : 'text-gray-400 cursor-not-allowed'
                                }`}
                            disabled={user?.role !== 'admin'}
                        >
                            Admin
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {renderContent()}
            </div>

            {/* {user?.role === 'admin' && (
                <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                    <button
                        onClick={handleManualInitialize}
                        disabled={initializing}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    >
                        {initializing ? 'Initializing...' : 'Initialize Users'}
                    </button>
                    {initializationStatus && (
                        <p className="mt-2 text-sm">{initializationStatus}</p>
                    )}
                </div>
            )} */}
        </div>
    );
};