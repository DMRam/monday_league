import { useEffect, useState } from 'react';
import type { AdminTabProps } from '../../interfaces/AdminTab';
import { db } from "../../services/firebase"; // adjust path
import { collection, getDocs } from 'firebase/firestore';
import { useMemo } from "react";

interface LoginSession {
    id: string;
    isActive: boolean;
    loginTime: any;
    playerName: string;
    role: string;
    teamName: string;
    userId: string;
}


export const AdminTab = ({
    addPlayerToTeamForm,
    newCoach,
    newPlayerName,
    newTeamName,
    newTeamPool,
    setNewCoach,
    setNewPlayerName,
    setNewTeamName,
    setNewTeamPool,
    newPlayers,
    setNewPlayers,
    addTeam,
    removePlayerFromTeamForm,
    generateMatches,
    setShowMatchCreation,
    setWeeksToGenerate,
    showMatchCreation,
    weeksToGenerate,
    setTeams,
    teams,
    matches,
    setMatches }: AdminTabProps) => {
    const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSessions = async () => {
            const snapshot = await getDocs(collection(db, "loginSessions"));
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as LoginSession[];
            setLoginSessions(sessions);
        };

        fetchSessions();
    }, []);


    const fetchSessions = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, "loginSessions"));
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as LoginSession[];
            setLoginSessions(sessions);
        } finally {
            setLoading(false);
        }
    };

    const groupedSessions = useMemo(() => {
        const map = new Map<string, { teamName: string; role: string; count: number; lastLogin: Date }>();

        loginSessions.forEach(session => {
            const loginDate = session.loginTime?.toDate
                ? session.loginTime.toDate()
                : new Date(session.loginTime);

            if (!map.has(session.playerName)) {
                map.set(session.playerName, {
                    teamName: session.teamName,
                    role: session.role,
                    count: 1,
                    lastLogin: loginDate,
                });
            } else {
                const entry = map.get(session.playerName)!;
                entry.count += 1;
                if (loginDate > entry.lastLogin) {
                    entry.lastLogin = loginDate;
                }
            }
        });

        return Array.from(map.entries()).map(([playerName, data]) => ({
            playerName,
            ...data,
        }));
    }, [loginSessions]);

    return (
        <div className="space-y-8">
            {/* Team Creation Form */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                        <input
                            placeholder="Team Name"
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capitaine d'équipe</label>
                        <input
                            placeholder="Capitaine d'équipe"
                            value={newCoach}
                            onChange={e => setNewCoach(e.target.value)}
                            className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>



                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Add Player</label>
                        <div className="flex">
                            <input
                                placeholder="Player Name"
                                value={newPlayerName}
                                onChange={e => setNewPlayerName(e.target.value)}
                                className="border p-3 rounded-l-lg flex-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => addPlayerToTeamForm(newPlayerName, newPlayers, setNewPlayers, setNewPlayerName)}
                                className="bg-blue-600 text-white px-4 py-3 rounded-r-lg hover:bg-blue-700 transition"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {newPlayers.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-medium text-gray-700 mb-2">Players</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                            {newPlayers.map((player, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <span>{player}</span>
                                    <button
                                        onClick={() => removePlayerFromTeamForm(index, newPlayers, setNewPlayers)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => addTeam(setNewPlayers, setNewPlayerName, setNewTeamPool, setNewCoach, setNewTeamName, newTeamName, newCoach, newPlayers, newTeamPool, setTeams, teams ? teams : [])}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                    Create Team
                </button>
            </div>

            {/* Match Generation Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Generate Matches</h2>
                    <button
                        onClick={() => setShowMatchCreation(!showMatchCreation)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        {showMatchCreation ? 'Hide Options' : 'Generate Matches'}
                    </button>
                </div>

                {showMatchCreation && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-600 mb-4">
                            This will generate matches for all teams. Existing matches for the selected weeks will be replaced.
                        </p>

                        <div className="flex items-center mb-4">
                            <label className="block text-sm font-medium text-gray-700 mr-4">Number of Weeks:</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={weeksToGenerate}
                                onChange={e => setWeeksToGenerate(parseInt(e.target.value))}
                                className="border p-2 rounded-lg w-20"
                            />
                        </div>

                        <button
                            onClick={() => generateMatches(teams ? teams : [], matches, weeksToGenerate, setShowMatchCreation, setMatches)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                            Generate Matches
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Login Sessions
                    </h2>
                    <button
                        onClick={fetchSessions}
                        disabled={loading}
                        className={`px-4 py-2 rounded-xl shadow-sm transition ${loading
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                    >
                        {loading ? "Loading..." : "Load Sessions"}
                    </button>



                </div>

                {loginSessions.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Total Sessions:{" "}
                            <span className="font-semibold text-gray-900">
                                {loginSessions.length}
                            </span>
                        </p>

                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full border-collapse">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Player</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Sessions</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Login</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {groupedSessions.map((user) => (
                                        <tr key={user.playerName} className="hover:bg-gray-50 transition">
                                            <td className="px-4 py-3 text-gray-900 font-medium">{user.playerName}</td>
                                            <td className="px-4 py-3 text-gray-700">{user.teamName}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`px-2 py-1 text-xs font-medium rounded-full ${user.role === "coach"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-green-100 text-green-700"
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded-lg">
                                                    {user.count}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 text-sm">
                                                {user.lastLogin.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>

        </div>
    )
}
