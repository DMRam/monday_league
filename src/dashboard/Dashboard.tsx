import React, { useState, useEffect } from 'react';
import { FaVolleyballBall, FaTrophy, FaUsers, FaChartLine, FaCalendarAlt, FaSignOutAlt, FaUserFriends, FaPlus, FaMinus, FaSave } from 'react-icons/fa';

interface Team {
    id: number;
    name: string;
    totalPoints: number;
    pool: string;
    coach: string;
    players: string[];
}

interface Match {
    id: number;
    week: number;
    pool: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    completed: boolean;
}

export const Dashboard = () => {
    const [currentWeek, setCurrentWeek] = useState(1);
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [user, setUser] = useState({ name: 'Coach Anderson', team: 'Spikers' });

    // Initialize teams with sample data
    useEffect(() => {
        const sampleTeams: Team[] = [
            {
                id: 1,
                name: 'Spikers',
                totalPoints: 125,
                pool: 'A',
                coach: 'Michael Anderson',
                players: ['John Smith', 'Sarah Johnson', 'Mike Thompson', 'Lisa Rodriguez', 'David Wilson', 'Emily Brown']
            },
            {
                id: 2,
                name: 'Blockers',
                totalPoints: 142,
                pool: 'A',
                coach: 'Jessica Williams',
                players: ['Robert Davis', 'Jennifer Miller', 'Daniel Martinez', 'Amy Garcia', 'Paul Clark', 'Michelle Lewis']
            },
            {
                id: 3,
                name: 'Smashers',
                totalPoints: 118,
                pool: 'A',
                coach: 'Christopher Jones',
                players: ['Kevin White', 'Angela Harris', 'Steven Martin', 'Nancy Allen', 'Brian King', 'Karen Scott']
            },
            {
                id: 4,
                name: 'Net Kings',
                totalPoints: 98,
                pool: 'B',
                coach: 'Matthew Taylor',
                players: ['Jason Moore', 'Rebecca Young', 'Gary Walker', 'Stephanie Hall', 'Jeffrey Allen', 'Donna Wright']
            },
            {
                id: 5,
                name: 'Volley Stars',
                totalPoints: 87,
                pool: 'B',
                coach: 'Amanda Johnson',
                players: ['Timothy Green', 'Laura Baker', 'Joshua Adams', 'Melissa Nelson', 'Ryan Carter', 'Heather Mitchell']
            },
            {
                id: 6,
                name: 'Court Warriors',
                totalPoints: 73,
                pool: 'B',
                coach: 'David Brown',
                players: ['Patrick Evans', 'Ruth Turner', 'Scott Phillips', 'Cynthia Campbell', 'Eric Roberts', 'Sharon Parker']
            },
        ];
        setTeams(sampleTeams);

        const sampleMatches: Match[] = [
            { id: 1, week: 1, pool: 'A', teamA: 'Spikers', teamB: 'Blockers', scoreA: 21, scoreB: 25, completed: true },
            { id: 2, week: 1, pool: 'A', teamA: 'Spikers', teamB: 'Smashers', scoreA: 25, scoreB: 23, completed: true },
            { id: 3, week: 1, pool: 'A', teamA: 'Blockers', teamB: 'Smashers', scoreA: 0, scoreB: 0, completed: false },
            { id: 4, week: 1, pool: 'B', teamA: 'Net Kings', teamB: 'Volley Stars', scoreA: 25, scoreB: 20, completed: true },
            { id: 5, week: 1, pool: 'B', teamA: 'Net Kings', teamB: 'Court Warriors', scoreA: 0, scoreB: 0, completed: false },
            { id: 6, week: 1, pool: 'B', teamA: 'Volley Stars', teamB: 'Court Warriors', scoreA: 25, scoreB: 18, completed: true },
        ];
        setMatches(sampleMatches);
    }, []);

    // Get teams for first hour (all teams)
    const firstHourTeams = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);


    const poolATeams = teams.filter(team => team.pool === 'A').sort((a, b) => b.totalPoints - a.totalPoints);
    const poolBTeams = teams.filter(team => team.pool === 'B').sort((a, b) => b.totalPoints - a.totalPoints);

    // Get teams for second hour according to new requirements
    // Premier Pool (Pool A in second hour): 1st from Pool A, 2nd and 3rd from Pool B
    const premierPool = [
        poolATeams[0], // 1st from Pool A
        poolBTeams[1], // 2nd from Pool B
        poolBTeams[2]  // 3rd from Pool B
    ].filter(team => team !== undefined); // Filter out undefined if any index doesn't exist

    // Secondary Pool (Pool B in second hour): remaining teams
    const secondaryPool = [
        poolATeams[1], // 2nd from Pool A
        poolATeams[2], // 3rd from Pool A
        poolBTeams[0]  // 1st from Pool B
    ].filter(team => team !== undefined); // Filter out undefined if any index doesn't exist

    // Calculate standings
    const standings = [...teams].sort((a, b) => b.totalPoints - a.totalPoints);

    // Get current week matches
    const currentWeekMatches = matches.filter(match => match.week === currentWeek);

    // Update match score
    const updateMatchScore = (matchId: number, team: 'A' | 'B', action: 'increment' | 'decrement') => {
        setMatches(matches.map(match => {
            if (match.id === matchId) {
                const newScoreA = team === 'A'
                    ? action === 'increment' ? match.scoreA + 1 : Math.max(0, match.scoreA - 1)
                    : match.scoreA;

                const newScoreB = team === 'B'
                    ? action === 'increment' ? match.scoreB + 1 : Math.max(0, match.scoreB - 1)
                    : match.scoreB;

                return { ...match, scoreA: newScoreA, scoreB: newScoreB };
            }
            return match;
        }));
    };

    // Save match results
    const saveMatchResults = (matchId: number) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        // Add the points scored in this match to each team's total
        setTeams(teams.map(team => {
            if (team.name === match.teamA) {
                return { ...team, totalPoints: team.totalPoints + match.scoreA };
            } else if (team.name === match.teamB) {
                return { ...team, totalPoints: team.totalPoints + match.scoreB };
            }
            return team;
        }));

        // Mark match as completed
        setMatches(matches.map(m =>
            m.id === matchId ? { ...m, completed: true } : m
        ));
    };

    // Navigate to next week
    const nextWeek = () => {
        setCurrentWeek(currentWeek + 1);
    };

    // Navigate to previous week
    const prevWeek = () => {
        if (currentWeek > 1) {
            setCurrentWeek(currentWeek - 1);
        }
    };

    // Render dashboard content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'teams':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Teams</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map(team => (
                                <div
                                    key={team.id}
                                    className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
                                    onClick={() => setSelectedTeam(team)}
                                >
                                    <h3 className="text-xl font-semibold text-blue-700">{team.name}</h3>
                                    <p className="text-gray-600">Coach: {team.coach}</p>
                                    <p className="text-gray-600">{team.players.length} players</p>
                                    <p className="mt-2 font-semibold">Total Points: <span className="text-blue-600">{team.totalPoints}</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 'players':
                return selectedTeam ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{selectedTeam.name} - Players</h2>
                            <button
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => setSelectedTeam(null)}
                            >
                                Back to Teams
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">Coach: {selectedTeam.coach}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedTeam.players.map((player, index) => (
                                <div key={index} className="border rounded-lg p-4 flex items-center">
                                    <div className="bg-blue-100 text-blue-800 rounded-full h-12 w-12 flex items-center justify-center mr-4">
                                        <FaUserFriends />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{player}</h3>
                                        <p className="text-gray-600">Player #{index + 1}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <p className="text-gray-600">Select a team to view its players</p>
                    </div>
                );

            case 'matches':
                return (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Week {currentWeek} Matches</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentWeekMatches.map(match => (
                                <div key={match.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${match.pool === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                            Pool {match.pool}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${match.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {match.completed ? 'Completed' : 'Scheduled'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-center">
                                            <p className="font-semibold">{match.teamA}</p>
                                            <p className="text-2xl font-bold">{match.scoreA}</p>
                                        </div>

                                        <span className="text-gray-500">VS</span>

                                        <div className="text-center">
                                            <p className="font-semibold">{match.teamB}</p>
                                            <p className="text-2xl font-bold">{match.scoreB}</p>
                                        </div>
                                    </div>

                                    {!match.completed && (
                                        <div className="mt-4">
                                            <div className="flex justify-between mb-2">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => updateMatchScore(match.id, 'A', 'decrement')}
                                                        className="bg-red-500 text-white p-1 rounded"
                                                        disabled={match.scoreA === 0}
                                                    >
                                                        <FaMinus size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateMatchScore(match.id, 'A', 'increment')}
                                                        className="bg-green-500 text-white p-1 rounded"
                                                    >
                                                        <FaPlus size={12} />
                                                    </button>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => updateMatchScore(match.id, 'B', 'decrement')}
                                                        className="bg-red-500 text-white p-1 rounded"
                                                        disabled={match.scoreB === 0}
                                                    >
                                                        <FaMinus size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => updateMatchScore(match.id, 'B', 'increment')}
                                                        className="bg-green-500 text-white p-1 rounded"
                                                    >
                                                        <FaPlus size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => saveMatchResults(match.id)}
                                                className="w-full bg-blue-600 text-white py-2 rounded-lg mt-2 flex items-center justify-center"
                                            >
                                                <FaSave className="mr-2" /> Save Results
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* First Hour Pools */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-6">
                                    <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">First Hour (6:00 PM - 7:00 PM)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Pool A */}
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-blue-800 mb-4 text-lg border-b pb-2">Pool A</h4>
                                        <ul className="space-y-3">
                                            {teams.filter(team => team.pool === 'A').map(team => (
                                                <li key={team.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <span className="font-medium">{team.name}</span>
                                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{team.totalPoints} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Pool B */}
                                    <div className="bg-orange-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-orange-800 mb-4 text-lg border-b pb-2">Pool B</h4>
                                        <ul className="space-y-3">
                                            {teams.filter(team => team.pool === 'B').map(team => (
                                                <li key={team.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <span className="font-medium">{team.name}</span>
                                                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full">{team.totalPoints} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Second Hour Pools */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-6">
                                    <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">Second Hour (7:00 PM - 8:00 PM)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Premier Pool (New Pool A) */}
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-purple-800 mb-4 text-lg border-b pb-2">Premier Pool (Pool A)</h4>
                                        <p className="text-sm text-gray-600 mb-3">1st from Pool A + 2nd & 3rd from Pool B</p>
                                        <ul className="space-y-3">
                                            {premierPool.map(team => (
                                                <li key={team.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <span className="font-medium">{team.name}</span>
                                                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">{team.totalPoints} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Secondary Pool (New Pool B) */}
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-green-800 mb-4 text-lg border-b pb-2">Secondary Pool (Pool B)</h4>
                                        <p className="text-sm text-gray-600 mb-3">2nd & 3rd from Pool A + 1st from Pool B</p>
                                        <ul className="space-y-3">
                                            {secondaryPool.map(team => (
                                                <li key={team.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                                                    <span className="font-medium">{team.name}</span>
                                                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">{team.totalPoints} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Standings and Points */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                            {/* League Standings */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-6">
                                    <FaTrophy className="text-yellow-500 text-xl mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">League Standings</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="px-4 py-2 text-left">Position</th>
                                                <th className="px-4 py-2 text-left">Team</th>
                                                <th className="px-4 py-2 text-left">Coach</th>
                                                <th className="px-4 py-2 text-left">Total Points</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {standings.map((team, index) => (
                                                <tr key={team.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                                                    <td className="px-4 py-3">{team.name}</td>
                                                    <td className="px-4 py-3">{team.coach}</td>
                                                    <td className="px-4 py-3 font-semibold">{team.totalPoints}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Matches */}
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-6">
                                    <FaChartLine className="text-blue-500 text-xl mr-2" />
                                    <h3 className="text-xl font-bold text-gray-800">Recent Matches</h3>
                                </div>

                                <div className="space-y-4">
                                    {matches.filter(m => m.completed).slice(0, 3).map(match => (
                                        <div key={match.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold">{match.teamA}</span>
                                                <span className="text-lg font-bold">{match.scoreA} - {match.scoreB}</span>
                                                <span className="font-semibold">{match.teamB}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Week {match.week} • Pool {match.pool}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setActiveTab('matches')}
                                    className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View All Matches →
                                </button>
                            </div>
                        </div>
                    </>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-blue-800 text-white shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <FaVolleyballBall className="text-2xl text-orange-400 mr-2" />
                        <h1 className="text-2xl font-bold">Volleyball League</h1>
                    </div>
                    <div className="flex items-center">
                        <span className="mr-4">Welcome, {user.name}</span>
                        <button className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center">
                            <FaSignOutAlt className="mr-2" /> Logout
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="container mx-auto px-4 mt-4">
                    <div className="flex overflow-x-auto">
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'dashboard' ? 'bg-white text-blue-800' : 'text-blue-200'} rounded-t-lg`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            Dashboard
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'teams' ? 'bg-white text-blue-800' : 'text-blue-200'} rounded-t-lg`}
                            onClick={() => setActiveTab('teams')}
                        >
                            Teams
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'players' ? 'bg-white text-blue-800' : 'text-blue-200'} rounded-t-lg`}
                            onClick={() => setActiveTab('players')}
                        >
                            Players
                        </button>
                        <button
                            className={`px-4 py-2 font-medium ${activeTab === 'matches' ? 'bg-white text-blue-800' : 'text-blue-200'} rounded-t-lg`}
                            onClick={() => setActiveTab('matches')}
                        >
                            Matches
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                {/* Week Navigation (only show on dashboard and matches) */}
                {(activeTab === 'dashboard' || activeTab === 'matches') && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-800">Week {currentWeek}</h2>
                        <div className="flex space-x-4">
                            <button
                                onClick={prevWeek}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                                disabled={currentWeek === 1}
                            >
                                Previous Week
                            </button>
                            <button
                                onClick={nextWeek}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                            >
                                Next Week
                            </button>
                        </div>
                    </div>
                )}

                {renderContent()}
            </div>
        </div>
    );
};