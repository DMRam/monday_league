import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from "../../services/firebase";
import type { Team } from '../../interfaces/Dashboards';

interface UpdateMatchManuallyProps {
    teams: Team[];
}

export const UpdateMatchManually: React.FC<UpdateMatchManuallyProps> = ({ teams }) => {
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
        pool: ""
    });

    const updateMatchManually = async (matchId: string, teamAId: string, teamBId: string, updates: {
        scoreA?: number;
        scoreB?: number;
        completed?: boolean;
        referee?: string;
        gym?: string;
        pool?: string;
        timeSlot?: string;
    }) => {
        try {
            const matchRef = doc(db, "matches", matchId);
            const matchDoc = await getDoc(matchRef);

            if (!matchDoc.exists()) {
                alert("Match not found!");
                return;
            }

            const matchData = matchDoc.data();

            // Find team data by IDs
            const teamA = teams?.find(team => team.id === teamAId);
            const teamB = teams?.find(team => team.id === teamBId);

            if (!teamA || !teamB) {
                alert("One or both teams not found!");
                return;
            }

            const updatedMatch = {
                ...matchData,
                ...updates,
                teamA: {
                    ...teamA,
                },
                teamB: {
                    ...teamB,
                }
            };

            await updateDoc(matchRef, updatedMatch);
            alert("Match updated successfully!");

        } catch (error) {
            console.error("Error updating match:", error);
            alert("Error updating match");
        }
    };

    // Simple version for quick score updates
    // const updateMatchScore = async (matchId: string, scoreA: number, scoreB: number, completed: boolean = true) => {
    //     await updateMatchManually(matchId, "", "", { scoreA, scoreB, completed });
    // };

    const handleSubmit = () => {
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
                timeSlot: manualMatchUpdate.timeSlot
            }
        );
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Manual Match Update</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    <input
                        placeholder="Team A ID"
                        value={manualMatchUpdate.teamAId}
                        onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, teamAId: e.target.value })}
                        className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team B ID</label>
                    <input
                        placeholder="Team B ID"
                        value={manualMatchUpdate.teamBId}
                        onChange={e => setManualMatchUpdate({ ...manualMatchUpdate, teamBId: e.target.value })}
                        className="border p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
                onClick={handleSubmit}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
            >
                Update Match
            </button>
        </div>
    );
};