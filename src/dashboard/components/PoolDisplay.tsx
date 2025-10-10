import { FaClock, FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import type { Team, WeeklyTeamStats } from "../../interfaces/Dashboards";

interface PoolDisplayProps {
    title: string;
    teams: Team[];
    colorClass: string;
    pointsBgClass: string;
    description?: string;
    showTime?: boolean;
    t: any;
    week: number;
    period: number;
}

export const PoolDisplay = ({
    title,
    teams,
    colorClass,
    pointsBgClass,
    description,
    showTime = false,
    t,
    week,
    period
}: PoolDisplayProps) => {
    // Format time based on language
    const formatTime = () => {
        const now = new Date();
        if (t.language === 'fr') {
            return now.toLocaleTimeString('fr-CA', {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        } else {
            return now.toLocaleTimeString('en-US', {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    };

    // Get points for a team based on week and period
    const getTeamPoints = (team: Team): number => {
        console.log(`Getting points for team ${team.name} for week ${week}, period ${period}`);

        // Ensure weeklyStats array exists
        if (!team.weeklyStats) {
            team.weeklyStats = [];
        }

        // Find or create weekly stats
        let weeklyStat = team.weeklyStats.find((stat: WeeklyTeamStats) => stat.week === week);

        if (!weeklyStat) {
            console.warn(`Creating zero weekly stats for team ${team.name} in week ${week}`);

            weeklyStat = {
                week: week,
                firstPeriodPoints: 0,
                secondPeriodPoints: 0,
                totalPoints: 0,
                wins: 0,
                losses: 0,
            };

            team.weeklyStats.push(weeklyStat);
        }

        // Return points based on period
        if (period === 1) {
            return weeklyStat.firstPeriodPoints;
        } else if (period === 2) {
            return weeklyStat.secondPeriodPoints;
        } else {
            return weeklyStat.totalPoints;
        }
    };

    // Get rank icon based on position
    const getRankIcon = (index: number) => {
        if (index === 0) return <FaTrophy className="text-yellow-500" />;
        if (index === 1) return <FaMedal className="text-gray-400" />;
        if (index === 2) return <FaAward className="text-orange-400" />;
        return null;
    };

    // Get rank background color
    const getRankBackground = (index: number) => {
        switch (index) {
            case 0: return 'bg-yellow-100 text-yellow-800';
            case 1: return 'bg-gray-100 text-gray-600';
            case 2: return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    // Get period display name with translations
    const getPeriodDisplayName = () => {
        switch (period) {
            case 1: return t.firstPeriod || 'First Period';
            case 2: return t.secondPeriod || 'Second Period';
            case 0: return t.currentDay || 'Current Day';
            default: return t.total || 'Total';
        }
    };

    // Process and sort teams
    const processedTeams = teams
        .map(team => {
            const points = getTeamPoints(team);
            const weeklyStat = team.weeklyStats?.find(stat => stat.week === week);

            return {
                ...team,
                displayPoints: points,
                weeklyStat: weeklyStat,
                hasWeeklyStats: !!weeklyStat
            };
        })
        .sort((a, b) => b.displayPoints - a.displayPoints);

    // Debug logging
    console.log(`Pool "${title}" - Week ${week}, Period ${getPeriodDisplayName()}:`, {
        totalTeams: teams.length,
        teamsWithWeeklyStats: processedTeams.filter(t => t.hasWeeklyStats).length,
        sortedResults: processedTeams.map(t => ({
            name: t.name,
            points: t.displayPoints,
            hasWeeklyStats: t.hasWeeklyStats
        }))
    });

    return (
        <div className={`rounded-lg p-4 ${colorClass} shadow-sm border`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h4 className="font-bold text-lg text-gray-800">{title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                        {/* <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                            {t.week || 'Week'} {week}
                        </span> */}
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded-full text-blue-600">
                            {getPeriodDisplayName()}
                        </span>
                    </div>
                </div>
                {showTime && (
                    <div className="flex items-center text-sm text-gray-600 bg-white px-3 py-1 rounded-full border">
                        <FaClock className="mr-2" size={12} />
                        {formatTime()}
                    </div>
                )}
            </div>

            {/* Description */}
            {description && (
                <p className="text-sm text-gray-600 mb-4 bg-white p-3 rounded-lg border">
                    {description}
                </p>
            )}

            {/* Teams List */}
            <ul className="space-y-2">
                {processedTeams.length > 0 ? (
                    processedTeams.map((team, index) => {
                        const rankIcon = getRankIcon(index);
                        const rankClass = getRankBackground(index);
                        const weeklyStat = team.weeklyStats?.find(stat => stat.week === week);

                        return (
                            <li
                                key={team.id}
                                className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
                            >
                                {/* Team Info */}
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <span
                                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${rankClass}`}
                                    >
                                        {rankIcon ? (
                                            <span className="flex items-center justify-center">
                                                {rankIcon}
                                            </span>
                                        ) : (
                                            index + 1
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-semibold text-gray-800 truncate">
                                                {team.name}
                                            </span>
                                            {/* {team.hasWeeklyStats && (
                                                <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                                    {t.week || 'Week'} {week}
                                                </span>
                                            )} */}
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1">
                                            {/* <span className="text-xs text-gray-500">
                                                {t.coach || 'Coach'}: {team.coach}
                                            </span> */}
                                            {weeklyStat && (
                                                <span className="text-xs text-gray-500">
                                                    {t.record || 'Record (w/l)'}: {weeklyStat.wins}-{weeklyStat.losses}
                                                </span>
                                            )}
                                        </div>
                                        {team.players && team.players.length > 0 && (
                                            <span className="text-xs text-gray-500 truncate block mt-1">
                                                {t.players || 'Players'}: {team.players.slice(0, 2).join(', ')}
                                                {team.players.length > 2 && ` +${team.players.length - 2} ${t.more || 'more'}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Points Display */}
                                <div className="flex flex-col items-end space-y-1">
                                    <span className={`${pointsBgClass} px-3 py-1 rounded-full text-sm font-bold min-w-16 text-center`}>
                                        {team.displayPoints} {t.points || 'pts'}
                                    </span>
                                    {weeklyStat && (
                                        <div className="text-xs text-gray-500 text-center">
                                            <div>{t.weekTotal || 'Week Total'}: {weeklyStat.totalPoints}</div>
                                            <div>
                                                {t.periodAbbrP1 || 'P1'}: {weeklyStat.firstPeriodPoints} |
                                                {t.periodAbbrP2 || 'P2'}: {weeklyStat.secondPeriodPoints}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })
                ) : (
                    <li className="text-center py-6 text-gray-500 bg-white rounded-lg border">
                        <div className="flex flex-col items-center">
                            <FaTrophy className="text-gray-300 mb-2" size={24} />
                            <span className="text-sm">
                                {t.noTeamsInPool || 'No teams available in this pool'}
                            </span>
                        </div>
                    </li>
                )}
            </ul>

            {/* Footer Stats */}
            {processedTeams.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{t.total || 'Total'}: {teams.length} {t.teams || 'teams'}</span>
                        <span>{t.weeklyStats || 'Weekly stats'}: {processedTeams.filter(t => t.hasWeeklyStats).length} {t.teams || 'teams'}</span>
                        <span>{t.leader || 'Leader'}: {processedTeams[0]?.displayPoints || 0} {t.points || 'pts'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};