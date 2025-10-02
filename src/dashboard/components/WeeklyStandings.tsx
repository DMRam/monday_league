import { FaTrophy, FaCrown } from 'react-icons/fa';
import type { Team } from '../../interfaces/Dashboards';

interface WeeklyStandingsProps {
    teams: Team[];
    currentWeek: number;
    t: any;
}

export const WeeklyStandings = ({ teams, currentWeek, t }: WeeklyStandingsProps) => {

    const teamsWithSessionTotals = teams.map(team => {
        // Calculate total session points by summing all weekly totalPoints
        const totalSessionPoints = team.weeklyStats?.reduce((total, stats) => total + stats.totalPoints, 0) || 0;

        // Get current week stats
        const currentWeekStats = team.weeklyStats?.find(stats => stats.week === currentWeek);
        const currentWeekPoints = currentWeekStats?.totalPoints || 0;

        return {
            ...team,
            currentWeekStats,
            currentWeekPoints,
            totalSessionPoints
        };
    });

    // Sort teams by total session points (overall standings)
    const sortedTeams = [...teamsWithSessionTotals].sort((a, b) => b.totalSessionPoints - a.totalSessionPoints);
    const leadingTeam = sortedTeams[0];

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl mr-4">
                        <FaTrophy className="text-white text-xl" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-800">{t.seasonStandings}</h3>
                        <p className="text-gray-500 text-sm">{t.overallPerformance}</p>
                    </div>
                </div>

                {/* Current Week */}
                <div className="bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="text-sm text-gray-600">{t.week}</span>
                    <span className="ml-2 font-bold text-gray-800">{currentWeek}</span>
                </div>
            </div>

            {/* Top Team Highlight */}
            {leadingTeam && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                        <FaCrown className="text-yellow-500 text-lg mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">{t.leadingTeam}</p>
                            <p className="font-bold text-gray-800">{leadingTeam.name}</p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-2xl font-bold text-yellow-600">{leadingTeam.totalSessionPoints}</p>
                            <p className="text-xs text-gray-500">{t.points}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Standings Table */}
            <div className="bg-gray-50 rounded-xl p-1">
                {sortedTeams.map((team, index) => (
                    <div
                        key={team.id}
                        className={`flex items-center p-4 rounded-lg mb-2 transition-all ${index === 0
                            ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-200'
                            : index === 1
                                ? 'bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200'
                                : index === 2
                                    ? 'bg-gradient-to-r from-orange-100 to-orange-50 border border-orange-200'
                                    : 'bg-white border border-gray-100'
                            }`}
                    >
                        {/* Rank */}
                        <div className="flex items-center w-16">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${index === 0
                                ? 'bg-yellow-400 text-white'
                                : index === 1
                                    ? 'bg-gray-400 text-white'
                                    : index === 2
                                        ? 'bg-orange-400 text-white'
                                        : 'bg-gray-200 text-gray-700'
                                }`}>
                                {index + 1}
                            </span>
                            {index === 0 && <FaTrophy className="text-yellow-500 ml-2 text-sm" />}
                        </div>

                        {/* Team Info */}
                        <div className="flex-1">
                            <div className="font-semibold text-gray-900">{team.name}</div>
                            <div className="text-sm text-gray-500">
                                {team.players.slice(0, 2).join(', ')}
                                {team.players.length > 2 && ` +${team.players.length - 2}`}
                            </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                            <div className="text-xl font-bold text-gray-800">{team.totalSessionPoints}</div>
                            <div className="text-xs text-gray-500">
                                
                                {team.currentWeekPoints > 0 && ` (+${team.currentWeekPoints} this ${t.week})`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
                <p>{sortedTeams.length} {t.teamsCompeting}</p>
            </div>
        </div>
    );
};