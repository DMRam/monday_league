import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from "../../services/firebase";
import type { Team } from '../../interfaces/Dashboards';

interface Match {
    id: string;
    teamA: Team;
    teamB: Team;
    scoreA: number;
    scoreB: number;
    completed: boolean;
    referee: string;
    gym: string;
    timeSlot: string;
    pool: string;
    date?: string;
    week?: number;
}

interface UpdateMatchManuallyProps {
    teams: Team[];
}

export const UpdateMatchManually: React.FC<UpdateMatchManuallyProps> = ({ teams }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'quick' | 'detailed' | 'search'>('quick');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

    const [manualMatchUpdate, setManualMatchUpdate] = useState({
        matchId: "",
        teamAId: "",
        teamBId: "",
        scoreA: 0,
        scoreB: 0,
        completed: false,
        referee: "",
        gym: "",
        timeSlot: "",
        pool: "",
        date: "",
        week: ""
    });

    const [quickUpdate, setQuickUpdate] = useState({
        matchId: "",
        scoreA: 0,
        scoreB: 0,
        completed: true
    });

    // Load matches from Firebase
    useEffect(() => {
        const loadMatches = async () => {
            try {
                const matchesSnapshot = await getDocs(collection(db, "matches"));
                const matchesData = matchesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Match[];

                setMatches(matchesData);
            } catch (error) {
                console.error("Error loading matches:", error);
                alert("Error loading matches");
            } finally {
                setLoading(false);
            }
        };

        loadMatches();
    }, []);

    const updateMatchManually = async (matchId: string, teamAId: string, teamBId: string, updates: {
        scoreA?: number;
        scoreB?: number;
        completed?: boolean;
        referee?: string;
        gym?: string;
        pool?: string;
        timeSlot?: string;
        date?: string;
        week?: number;
    }) => {
        try {
            const matchRef = doc(db, "matches", matchId);
            const matchDoc = await getDoc(matchRef);

            if (!matchDoc.exists()) {
                alert("Match not found!");
                return;
            }

            // const matchData = matchDoc.data();

            // Create base update object
            const updateData: any = {
                ...updates
            };

            // Only update team data if team IDs are provided and different from current
            if (teamAId && teamBId) {
                const teamA = teams?.find(team => team.id === teamAId);
                const teamB = teams?.find(team => team.id === teamBId);

                if (!teamA || !teamB) {
                    alert("One or both teams not found!");
                    return;
                }

                // Add team data to update object
                updateData.teamA = { ...teamA };
                updateData.teamB = { ...teamB };
            }

            await updateDoc(matchRef, updateData);
            alert("Match updated successfully!");

            // Refresh matches list
            const matchesSnapshot = await getDocs(collection(db, "matches"));
            const matchesData = matchesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Match[];
            setMatches(matchesData);

        } catch (error) {
            console.error("Error updating match:", error);
            alert("Error updating match");
        }
    };

    const updateMatchScore = async (matchId: string, scoreA: number, scoreB: number, completed: boolean = true) => {
        await updateMatchManually(matchId, "", "", { scoreA, scoreB, completed });
    };

    const handleDetailedSubmit = () => {
        updateMatchManually(
            manualMatchUpdate.matchId,
            manualMatchUpdate.teamAId,
            manualMatchUpdate.teamBId,
            {
                scoreA: manualMatchUpdate.scoreA,
                scoreB: manualMatchUpdate.scoreB,
                completed: manualMatchUpdate.completed,
                referee: manualMatchUpdate.referee,
                gym: manualMatchUpdate.gym,
                pool: manualMatchUpdate.pool,
                timeSlot: manualMatchUpdate.timeSlot,
                date: manualMatchUpdate.date,
                week: manualMatchUpdate.week ? parseInt(manualMatchUpdate.week) : undefined
            }
        );
    };

    const handleQuickSubmit = () => {
        updateMatchScore(quickUpdate.matchId, quickUpdate.scoreA, quickUpdate.scoreB, quickUpdate.completed);
    };

    const fillMatchDetails = (matchId: string) => {
        const match = matches.find(m => m.id === matchId);
        if (match) {
            setManualMatchUpdate({
                matchId: match.id,
                teamAId: match.teamA.id,
                teamBId: match.teamB.id,
                scoreA: match.scoreA,
                scoreB: match.scoreB,
                completed: match.completed,
                referee: match.referee || "",
                gym: match.gym || "",
                timeSlot: match.timeSlot || "",
                pool: match.pool || "",
                date: match.date || "",
                week: match.week?.toString() || ""
            });
        }
    };

    // Filter matches based on search and week
    const filteredMatches = matches.filter(match => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            match.teamA.name.toLowerCase().includes(searchLower) ||
            match.teamB.name.toLowerCase().includes(searchLower) ||
            match.pool.toLowerCase().includes(searchLower) ||
            (match.referee && match.referee.toLowerCase().includes(searchLower)) ||
            match.id.toLowerCase().includes(searchLower);

        const matchesWeek = selectedWeek === 'all' || match.week === selectedWeek;

        return matchesSearch && matchesWeek;
    });

    // Get unique weeks for filter
    const uniqueWeeks = [...new Set(matches.map(match => match.week).filter(Boolean))].sort() as number[];

    if (loading) {
        return <div className="bg-white p-6 rounded-lg shadow-md">Loading matches...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Match Management</h2>

            {/* Section Tabs */}
            <div className="flex border-b mb-6">
                <button
                    onClick={() => setActiveSection('quick')}
                    className={`px-4 py-2 font-medium ${activeSection === 'quick'
                            ? 'border-b-2 border-orange-600 text-orange-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Quick Score Update
                </button>
                <button
                    onClick={() => setActiveSection('detailed')}
                    className={`px-4 py-2 font-medium ${activeSection === 'detailed'
                            ? 'border-b-2 border-orange-600 text-orange-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Detailed Match Update
                </button>
                <button
                    onClick={() => setActiveSection('search')}
                    className={`px-4 py-2 font-medium ${activeSection === 'search'
                            ? 'border-b-2 border-orange-600 text-orange-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                >
                    Match Browser
                </button>
            </div>

            {/* Quick Score Update */}
            {activeSection === 'quick' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Quick Score Update</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Match</label>
                            <select
                                value={quickUpdate.matchId}
                                onChange={e => setQuickUpdate({ ...quickUpdate, matchId: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select a match</option>
                                {matches.map(match => (
                                    <option key={match.id} value={match.id}>
                                        {match.teamA.name} vs {match.teamB.name} ({match.pool}) week {match.week} period {match.timeSlot}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score A</label>
                                <input
                                    type="number"
                                    value={quickUpdate.scoreA}
                                    onChange={e => setQuickUpdate({ ...quickUpdate, scoreA: parseInt(e.target.value) || 0 })}
                                    className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score B</label>
                                <input
                                    type="number"
                                    value={quickUpdate.scoreB}
                                    onChange={e => setQuickUpdate({ ...quickUpdate, scoreB: parseInt(e.target.value) || 0 })}
                                    className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            checked={quickUpdate.completed}
                            onChange={e => setQuickUpdate({ ...quickUpdate, completed: e.target.checked })}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Match Completed</label>
                    </div>

                    <button
                        onClick={handleQuickSubmit}
                        disabled={!quickUpdate.matchId}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Update Score
                    </button>
                </div>
            )}

            {/* Detailed Match Update */}
            {activeSection === 'detailed' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Detailed Match Update</h3>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quick Fill from Existing Match</label>
                        <select
                            onChange={e => fillMatchDetails(e.target.value)}
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Select match to fill details</option>
                            {matches.map(match => (
                                <option key={match.id} value={match.id}>
                                    {match.id}: {match.teamA.name} vs {match.teamB.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Match ID</label>
                            <input
                                placeholder="Match ID"
                                value={manualMatchUpdate.matchId}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, matchId: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team A ID</label>
                            <select
                                value={manualMatchUpdate.teamAId}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, teamAId: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Team A</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name} ({team.id})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Team B ID</label>
                            <select
                                value={manualMatchUpdate.teamBId}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, teamBId: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Select Team B</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>{team.name} ({team.id})</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score A</label>
                                <input
                                    type="number"
                                    value={manualMatchUpdate.scoreA}
                                    onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, scoreA: parseInt(e.target.value) || 0 })}
                                    className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score B</label>
                                <input
                                    type="number"
                                    value={manualMatchUpdate.scoreB}
                                    onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, scoreB: parseInt(e.target.value) || 0 })}
                                    className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={manualMatchUpdate.date}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, date: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
                            <input
                                type="number"
                                placeholder="Week number"
                                value={manualMatchUpdate.week}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, week: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Referee</label>
                            <input
                                placeholder="Referee"
                                value={manualMatchUpdate.referee}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, referee: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gym</label>
                            <input
                                placeholder="Gym"
                                value={manualMatchUpdate.gym}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, gym: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pool</label>
                            <input
                                placeholder="Pool"
                                value={manualMatchUpdate.pool}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, pool: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                            <input
                                placeholder="Time Slot"
                                value={manualMatchUpdate.timeSlot}
                                onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, timeSlot: e.target.value })}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            checked={manualMatchUpdate.completed}
                            onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, completed: e.target.checked })}
                            className="mr-2"
                        />
                        <label className="text-sm font-medium text-gray-700">Match Completed</label>
                    </div>

                    <button
                        onClick={handleDetailedSubmit}
                        className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
                    >
                        Update Match
                    </button>
                </div>
            )}

            {/* Match Browser */}
            {activeSection === 'search' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Match Browser</h3>

                    {/* Search and Filter */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <input
                                type="text"
                                placeholder="Search by team, pool, referee..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Week</label>
                            <select
                                value={selectedWeek}
                                onChange={e => setSelectedWeek(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Weeks</option>
                                {uniqueWeeks.map(week => (
                                    <option key={week} value={week}>Week {week}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedWeek('all');
                                }}
                                className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition w-full"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Matches List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {filteredMatches.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No matches found
                            </div>
                        ) : (
                            filteredMatches.map(match => (
                                <div key={match.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold">{match.teamA.name} vs {match.teamB.name}</h4>
                                            <p className="text-sm text-gray-600">Match ID: {match.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${match.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {match.completed ? 'Completed' : 'Pending'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="font-medium">Score:</span> {match.scoreA} - {match.scoreB}
                                        </div>
                                        <div>
                                            <span className="font-medium">Pool:</span> {match.pool}
                                        </div>
                                        <div>
                                            <span className="font-medium">Referee:</span> {match.referee || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Week:</span> {match.week || 'N/A'}
                                        </div>
                                        {match.date && (
                                            <div>
                                                <span className="font-medium">Date:</span> {new Date(match.date).toLocaleDateString()}
                                            </div>
                                        )}
                                        <div>
                                            <span className="font-medium">Gym:</span> {match.gym || 'N/A'}
                                        </div>
                                        <div>
                                            <span className="font-medium">Time:</span> {match.timeSlot || 'N/A'}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setActiveSection('quick');
                                                setQuickUpdate({
                                                    matchId: match.id,
                                                    scoreA: match.scoreA,
                                                    scoreB: match.scoreB,
                                                    completed: match.completed
                                                });
                                            }}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Quick Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveSection('detailed');
                                                fillMatchDetails(match.id);
                                            }}
                                            className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                        >
                                            Detailed Edit
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};