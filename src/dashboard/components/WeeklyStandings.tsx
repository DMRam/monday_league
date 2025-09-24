import { useState } from 'react';
import { FaTrophy, FaChevronLeft, FaChevronRight, FaChartLine, FaUsers, FaFire } from 'react-icons/fa';

interface Team {
    id: string;
    name: string;
    pool: string;
    players: string[];
    totalPoints: number;
}

interface WeekStats {
    id: string;
    teamId: string;
    wins: number;
    losses: number;
    points: number;
    pointPeriodOne: number;
    pointsPeriodTwo: number;
    week: number;
}

interface WeeklyStandingsProps {
    teams: Team[];
    weekStats: WeekStats[];
    currentWeek: number;
}

export const WeeklyStandings = ({ teams, weekStats, currentWeek }: WeeklyStandingsProps) => {
    const [selectedWeek, setSelectedWeek] = useState(currentWeek);

    // Get available weeks from the stats
    const availableWeeks = [...new Set(weekStats.map(stat => stat.week))].sort((a, b) => a - b);

    // Filter stats for selected week and join with team data
    const weeklyData = weekStats
        .filter(stat => stat.week === selectedWeek)
        .map(stat => {
            const team = teams.find(t => t.id === stat.teamId);
            return {
                ...stat,
                teamName: team?.name || 'Unknown Team',
                pool: team?.pool || 'N/A',
                players: team?.players || [],
                seasonTotal: team?.totalPoints || 0
            };
        })
        .sort((a, b) => b.points - a.points); // Sort by points descending

    // Calculate some interesting metrics
    const highestScoringTeam = weeklyData.length > 0 ? weeklyData.reduce((highest, current) =>
        current.points > highest.points ? current : highest, weeklyData[0]) : null;

    const totalWeekPoints = weeklyData.reduce((sum, team) => sum + team.points, 0);

    const navigateWeek = (direction: 'prev' | 'next') => {
        const currentIndex = availableWeeks.indexOf(selectedWeek);
        if (direction === 'prev' && currentIndex > 0) {
            setSelectedWeek(availableWeeks[currentIndex - 1]);
        } else if (direction === 'next' && currentIndex < availableWeeks.length - 1) {
            setSelectedWeek(availableWeeks[currentIndex + 1]);
        }
    };

    const getWeekDate = (weekNumber: number) => {
        // Assuming week 1 starts on September 22, 2025
        const startDate = new Date(2025, 8, 22); // Month is 0-indexed
        const weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
        return weekDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // If no weekly data, show only season standings
    if (weeklyData.length === 0) {
        const seasonData = teams
            .map(team => ({
                ...team,
                players: team.players || []
            }))
            .sort((a, b) => b.totalPoints - a.totalPoints);

        return (
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 mt-8 col-span-2 border border-blue-100">
                {/* Header for Season Standings */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                    <div className="flex items-center mb-4 lg:mb-0">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
                            <FaTrophy className="text-white text-2xl" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-gray-800">Season Standings</h3>
                            <p className="text-gray-600 mt-1">Overall performance</p>
                        </div>
                    </div>
                </div>

                {/* Season Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center">
                            <FaFire className="text-orange-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Leading Team</p>
                                <p className="font-bold text-gray-800">{seasonData[0]?.name || 'No teams'}</p>
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-blue-600">{seasonData[0]?.totalPoints || 0} pts</div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center">
                            <FaChartLine className="text-green-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Teams</p>
                                <p className="font-bold text-gray-800">Active</p>
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-green-600">{seasonData.length}</div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center">
                            <FaUsers className="text-purple-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-600">Total Points</p>
                                <p className="font-bold text-gray-800">Season</p>
                            </div>
                        </div>
                        <div className="mt-2 text-2xl font-bold text-purple-600">
                            {seasonData.reduce((sum, team) => sum + team.totalPoints, 0)} pts
                        </div>
                    </div>
                </div>

                {/* Season Table */}
                <SeasonTable seasonData={seasonData} />

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>No weekly data available for week {selectedWeek} • Showing overall season standings</p>
                </div>
            </div>
        );
    }

    // Show weekly standings when data is available
    return (
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 mt-8 col-span-2 border border-blue-100">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
                <div className="flex items-center mb-4 lg:mb-0">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl mr-4 shadow-lg">
                        <FaTrophy className="text-white text-2xl" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-bold text-gray-800">Weekly Standings</h3>
                        <p className="text-gray-600 mt-1">{getWeekDate(selectedWeek)}</p>
                    </div>
                </div>

                {/* Week Navigation */}
                <div className="flex items-center space-x-4 bg-white rounded-xl p-2 shadow-md">
                    <button
                        onClick={() => navigateWeek('prev')}
                        disabled={selectedWeek <= Math.min(...availableWeeks)}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <FaChevronLeft className="text-gray-600" />
                    </button>

                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">Week</span>
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(Number(e.target.value))}
                            className="bg-transparent border-none text-lg font-bold text-blue-600 focus:outline-none"
                        >
                            {availableWeeks.map(week => (
                                <option key={week} value={week}>{week}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => navigateWeek('next')}
                        disabled={selectedWeek >= Math.max(...availableWeeks)}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <FaChevronRight className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center">
                        <FaFire className="text-orange-500 text-xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Top Team</p>
                            <p className="font-bold text-gray-800">{highestScoringTeam?.teamName}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-blue-600">{highestScoringTeam?.points} pts</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center">
                        <FaChartLine className="text-green-500 text-xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Total Points</p>
                            <p className="font-bold text-gray-800">Week {selectedWeek}</p>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-green-600">{totalWeekPoints} pts</div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center">
                        <FaUsers className="text-purple-500 text-xl mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Teams Competing</p>
                            <p className="font-bold text-gray-800">Active</p>
                        </div>
                    </div>
                    <div className="mt-2 text-2xl font-bold text-purple-600">{weeklyData.length}</div>
                </div>
            </div>

            {/* Weekly Standings Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Team
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    1st Period
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    2nd Period
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Week Total
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Season Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {weeklyData.map((team, index) => (
                                <tr
                                    key={team.id}
                                    className={`hover:bg-blue-50 transition-all duration-200 ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-25' :
                                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}
                                >
                                    {/* Rank */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-400 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                    index === 2 ? 'bg-orange-400 text-white' :
                                                        'bg-gray-200 text-gray-700'
                                                }`}>
                                                {index + 1}
                                            </span>
                                            {index === 0 && (
                                                <FaTrophy className="text-yellow-500 ml-2" />
                                            )}
                                        </div>
                                    </td>

                                    {/* Team Name */}
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-bold text-gray-900 text-lg">{team.teamName}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                {team.players.slice(0, 2).join(', ')}
                                                {team.players.length > 2 && ` +${team.players.length - 2} more`}
                                            </div>
                                        </div>
                                    </td>

                                    {/* 1st Period */}
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-blue-600 text-lg">{team.pointPeriodOne}</span>
                                    </td>

                                    {/* 2nd Period */}
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-purple-600 text-lg">{team.pointsPeriodTwo}</span>
                                    </td>

                                    {/* Week Total */}
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-green-600 text-xl">{team.points}</span>
                                    </td>

                                    {/* Season Total */}
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-gray-800 text-lg">{team.seasonTotal}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
                <p>Data updated automatically • {weeklyData.length} teams competing in Week {selectedWeek}</p>
            </div>
        </div>
    );
};

const SeasonTable = ({ seasonData }: { seasonData: Team[] }) => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Team</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Points</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {seasonData.map((team, index) => (
                        <tr
                            key={team.id}
                            className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-all`}
                        >
                            {/* Rank */}
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0 ? 'bg-yellow-400 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                        index === 2 ? 'bg-orange-400 text-white' :
                                            'bg-gray-200 text-gray-700'
                                    }`}>
                                    {index + 1}
                                </span>
                            </td>

                            {/* Team Name */}
                            <td className="px-6 py-4">
                                <div>
                                    <div className="font-bold text-gray-900">{team.name}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {team.players.slice(0, 2).join(', ')}
                                        {team.players.length > 2 && ` +${team.players.length - 2} more`}
                                    </div>
                                </div>
                            </td>                           

                            {/* Total Points */}
                            <td className="px-6 py-4 font-bold text-gray-800 text-lg">
                                {team.totalPoints}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);