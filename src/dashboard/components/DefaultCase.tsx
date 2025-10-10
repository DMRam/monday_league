import { format } from "date-fns"
import { fr as frLocale, enUS as enLocale } from 'date-fns/locale';
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
    t: any
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
    teams,
    t
}: Props) => {
    const { getMatchDateForWeek } = useActiveTabs();

    // Get appropriate date locale
    const dateLocale = t.language === 'fr' ? frLocale : enLocale;

    // Separate completed and upcoming
    const recentMatches = matches
        .filter(m => m.completed)
        .sort((a, b) => b.startTime - a.startTime)
        .slice(0, 6);

    const upcomingMatches = matches
        .filter(m => !m.completed)
        .sort((a, b) => a.startTime - b.startTime)
        .slice(0, 6);

    const matchDate = getMatchDateForWeek(currentWeek, '20:50');
    const formattedDate = format(matchDate, "EEEE, MMM d", { locale: dateLocale });

    return (
        <div className="space-y-8">
            {/* Week Matches Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {/* {t.week} {currentWeek}  */}
                        {t.matches} {formattedDate}
                    </h2>
                    <div className="flex space-x-4">
                        <button
                            type="button"
                            onClick={prevWeek}
                            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={currentWeek === 1}
                        >
                            {t.previousWeek}
                        </button>
                        <button
                            type="button"
                            onClick={nextWeek}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            {t.nextWeek}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* First Hour Pools */}
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">{t.firstPeriod}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PoolDisplay
                                title={t.poolA}
                                teams={poolATeamsFirstPeriod}
                                colorClass="bg-blue-50"
                                pointsBgClass="bg-blue-100 text-blue-800"
                                t={t}
                                week={currentWeek}
                                period={1}
                            />
                            <PoolDisplay
                                title={t.poolB}
                                teams={poolBTeamsFirstPeriod}
                                colorClass="bg-orange-50"
                                pointsBgClass="bg-orange-100 text-orange-800"
                                t={t}
                                week={currentWeek}
                                period={1}
                            />
                        </div>
                    </div>

                    {/* Second Hour Pools */}
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                            <h3 className="text-lg font-semibold text-gray-800">
                                {t.secondPeriod}
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PoolDisplay
                                title={t.poolA}
                                teams={poolATeamsSecondPeriod}
                                colorClass="bg-purple-50"
                                pointsBgClass="bg-purple-100 text-purple-800"
                                t={t}
                                week={currentWeek}
                                period={2}
                            />
                            <PoolDisplay
                                title={t.poolB}
                                teams={poolBTeamsSecondPeriod}
                                colorClass="bg-green-50"
                                pointsBgClass="bg-green-100 text-green-800"
                                t={t}
                                week={currentWeek}
                                period={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Standings */}
            <WeeklyStandings
                currentWeek={currentWeek}
                teams={teams || []}
                t={t}
            />

            {/* Recent & Upcoming Matches */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Matches */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center mb-4">
                        <FaChartLine className="text-green-500 text-lg mr-3" />
                        <h3 className="text-lg font-bold text-gray-800">{t.recentMatches}</h3>
                    </div>

                    <div className="space-y-3">
                        {recentMatches.length > 0 ? (
                            recentMatches.map(match => (
                                <div key={match.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-800 text-sm flex-1 text-center">
                                            {match.teamA.name}
                                        </span>
                                        <span className="mx-3 font-bold text-gray-900 text-base">
                                            {match.scoreA} - {match.scoreB}
                                        </span>
                                        <span className="font-medium text-gray-800 text-sm flex-1 text-center">
                                            {match.teamB.name}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500 text-center mt-1">
                                        {t.week} {match.week}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">{t.noCompletedMatches}</div>
                        )}
                    </div>
                </div>

                {/* Upcoming Matches */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center mb-4">
                        <FaCalendarAlt className="text-blue-500 text-lg mr-3" />
                        <h3 className="text-lg font-bold text-gray-800">{t.upcomingMatches}</h3>
                    </div>

                    <div className="space-y-3">
                        {upcomingMatches.length > 0 ? (
                            upcomingMatches.map(match => {
                                const upcomingMatchDate = getMatchDateForWeek(match.week, match.timeSlot);
                                const upcomingFormattedDate = format(upcomingMatchDate, "MMM d", { locale: dateLocale });

                                return (
                                    <div key={match.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-gray-800 text-sm flex-1 text-center">
                                                {match.teamA.name}
                                            </span>
                                            <span className="mx-3 text-gray-400 text-sm font-medium">vs</span>
                                            <span className="font-medium text-gray-800 text-sm flex-1 text-center">
                                                {match.teamB.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 text-center mt-1">
                                            {t.week} {match.week} • {upcomingFormattedDate}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-sm">{t.noUpcomingMatches}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}