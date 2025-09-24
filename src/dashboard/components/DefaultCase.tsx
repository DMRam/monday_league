import { format } from "date-fns"
import { PoolDisplay } from "./PoolDisplay"
import type { Match, Team, TeamWeekStats } from "../../interfaces/Dashboards"
import { FaCalendarAlt, FaChartLine } from "react-icons/fa"
import { WeeklyStandings } from "./WeeklyStandings"
import { useActiveTabs } from "../../hooks/useActiveTabs"

interface Props {
    currentWeek: number
    prevWeek: () => void
    nextWeek: () => void
    poolATeamsFirstPeriod: Team[]
    poolBTeamsFirstPeriod: Team[]
    poolATeamsSecondPeriod: Team[]
    poolBTeamsSecondPeriod: Team[]
    matches: Match[]
    setActiveTab: React.Dispatch<React.SetStateAction<string>>
    teams: Team[] | undefined
    weekStats: TeamWeekStats[]
}

export const DefaultCase = ({
    currentWeek,
    matches,
    nextWeek,
    poolATeamsFirstPeriod,
    poolATeamsSecondPeriod,
    poolBTeamsFirstPeriod,
    poolBTeamsSecondPeriod,
    prevWeek,
    setActiveTab,
    teams,
    weekStats,
}: Props) => {
    const { getMatchDateForWeek } = useActiveTabs();

    // Separate completed and upcoming
    const recentMatches = matches
        .filter(m => m.completed)
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 5);

    const upcomingMatches = matches
        .filter(m => !m.completed)
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Week Matches Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Week {currentWeek} Matches {format(getMatchDateForWeek(currentWeek, '20:50'), "EEEE, MMM d")}
                    </h2>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={prevWeek}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentWeek === 1}
                        >
                            Previous Week
                        </button>
                        <button
                            type="button"
                            onClick={nextWeek}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            Next Week
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* First Hour Pools */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">First Period (8:50 PM - 9:50 PM)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PoolDisplay
                                title="Pool A"
                                teams={poolATeamsFirstPeriod}
                                colorClass="bg-blue-50"
                                pointsBgClass="bg-blue-100 text-blue-800"
                            />
                            <PoolDisplay
                                title="Pool B"
                                teams={poolBTeamsFirstPeriod}
                                colorClass="bg-orange-50"
                                pointsBgClass="bg-orange-100 text-orange-800"
                            />
                        </div>
                    </div>

                    {/* Second Hour Pools */}
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">
                                Second Period (9:50 PM - 10:50 PM)
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PoolDisplay
                                title="Pool A"
                                // description="Competing for 1st-3rd place"
                                teams={poolATeamsSecondPeriod
                                    .map(team => ({
                                        ...team,
                                        currentDayPoints: team.secondPeriodPoints || 0
                                    }))
                                    .sort((a, b) => b.currentDayPoints - a.currentDayPoints)}
                                colorClass="bg-purple-50"
                                pointsBgClass="bg-purple-100 text-purple-800"
                            />
                            <PoolDisplay
                                title="Pool B"
                                // description="Competing for 4th-6th place"
                                teams={poolBTeamsSecondPeriod
                                    .map(team => ({
                                        ...team,
                                        currentDayPoints: team.secondPeriodPoints || 0
                                    }))
                                    .sort((a, b) => b.currentDayPoints - a.currentDayPoints)}
                                colorClass="bg-green-50"
                                pointsBgClass="bg-green-100 text-green-800"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Standings */}
            <WeeklyStandings
                currentWeek={currentWeek}
                teams={teams || []}
                weekStats={weekStats}
            />

            {/* Recent Matches + Upcoming Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Matches */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <FaChartLine className="text-blue-500 text-xl mr-2" />
                            <h3 className="text-xl font-bold text-gray-800">Recent Matches</h3>
                        </div>
                        <span className="text-sm text-gray-500">{recentMatches.length} shown</span>
                    </div>

                    <div className="space-y-3">
                        {recentMatches.length > 0 ? (
                            recentMatches.map(match => (
                                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-800 text-sm truncate flex-1 text-center">
                                            {match.teamA}
                                        </span>
                                        <span className="mx-4 text-lg font-bold text-gray-900 min-w-[60px] text-center">
                                            {match.scoreA} - {match.scoreB}
                                        </span>
                                        <span className="font-semibold text-gray-800 text-sm truncate flex-1 text-center">
                                            {match.teamB}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                        Week {match.week} • {match.pool} • {match.gym}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">No completed matches yet</div>
                        )}
                    </div>
                </div>

                {/* Upcoming Matches */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center mb-6">
                        <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                        <h3 className="text-xl font-bold text-gray-800">Upcoming Matches</h3>
                    </div>
                    <div className="space-y-3">
                        {upcomingMatches.length > 0 ? (
                            upcomingMatches.map(match => (
                                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-800 text-sm truncate flex-1 text-center">
                                            {match.teamA}
                                        </span>
                                        <span className="mx-4 text-gray-500 text-sm min-w-[60px] text-center">
                                            vs
                                        </span>
                                        <span className="font-semibold text-gray-800 text-sm truncate flex-1 text-center">
                                            {match.teamB}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                        {format(getMatchDateForWeek(match.week, match.timeSlot), "EEEE, MMM d")} • {match.gym}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">No upcoming matches</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
