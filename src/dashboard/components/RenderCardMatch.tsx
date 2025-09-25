import { FaSave } from "react-icons/fa";
import CountdownTimer from "./CountDown";
import { format } from "date-fns";
import { useActiveTabs } from "../../hooks/useActiveTabs";
import type { Match, Team } from "../../interfaces/Dashboards";
import type { TeamUser } from "../../interfaces/User";

export const RenderMatchCard = ({
    match,
    user,
    canEditScore,
    updateMatchScore,
    saveMatchResults,
    matches,
    setMatches,
    teams,
    setTeams
}: {
    match: Match;
    user: any;
    canEditScore: (match: Match, user: any) => boolean;
    updateMatchScore: any
    saveMatchResults: (
        teams: Team[],
        setTeams: any,
        setMatches: any,
        matchId: string,
        matches: Match[],
        // canEditScoreCallback: () => boolean
        user: TeamUser
    ) => void;
    matches: Match[];
    setMatches: any;
    teams: Team[];
    setTeams: any;
    t:any
}) => {
    // Helper function to determine pool badge class
    const getPoolBadgeClass = (pool: string) => {
        if (pool === "Pool 1" || pool === "A") return 'bg-blue-100 text-blue-800';
        if (pool === "Pool 2" || pool === "B") return 'bg-orange-100 text-orange-800';
        if (pool === "Pool 1") return 'bg-purple-100 text-purple-800';
        if (pool === "Pool 2") return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    const { getMatchDateForWeek } = useActiveTabs()

    console.log('User RenderMatchCard: ', user)


    return (
        <div
            key={match.id}
            className={`bg-white border rounded-xl p-6 shadow-sm transition duration-200 hover:shadow-lg ${user.role === "referee" && user.name === match.referee ? "border-blue-500" : "border-gray-200"
                }`}
        >
            {/* Pool & Status */}
            <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPoolBadgeClass(match.pool)}`}>
                    {match.pool}
                </span>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${match.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                >
                    {match.completed ? "Completed" : "Scheduled"}
                </span>
            </div>

            {/* Gym and Referee info */}
            <div className="text-sm text-gray-500 mb-4 space-y-1">
                {match.gym} • {match.timeSlot} • {format(getMatchDateForWeek(match.week, match.timeSlot), "EEEE, MMM d")}
                <div className="flex items-center gap-2">
                    Referee:
                    <span
                        className={`font-semibold ${user.role === "referee" && user.name === match.referee
                            ? "text-blue-700"
                            : "text-gray-700"
                            }`}
                    >
                        {match.referee}
                    </span>
                    {user.role === "referee" && user.name === match.referee && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">You</span>
                    )}
                </div>
            </div>

            {/* Teams and Scores */}
            <div className="flex justify-between items-center mb-4">
                {/* Team A */}
                <div
                    className={`text-center flex-1 rounded-lg p-2 transition ${user.name === match.teamA ? "bg-blue-50 border border-blue-200" : ""
                        }`}
                >
                    <p className="font-semibold text-gray-800">{match.teamA}</p>
                    <p className="text-3xl font-bold text-blue-600">{match.scoreA}</p>
                </div>

                <span className="text-gray-400 mx-4 font-semibold text-lg">VS</span>

                {/* Team B */}
                <div
                    className={`text-center flex-1 rounded-lg p-2 transition ${user.name === match.teamB ? "bg-red-50 border border-red-200" : ""
                        }`}
                >
                    <p className="font-semibold text-gray-800">{match.teamB}</p>
                    <p className="text-3xl font-bold text-red-600">{match.scoreB}</p>
                </div>
            </div>

            {/* Score update */}
            {!match.completed && canEditScore(match, user) && (
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        {/* Team A */}
                        <div className="flex items-center space-x-2 flex-1">
                            <span className="font-semibold text-gray-700">{match.teamA}</span>
                            <select
                                className="border rounded-lg p-2 w-20 focus:ring-1 focus:ring-blue-400 focus:outline-none"
                                value={match.scoreA}
                                onChange={(e) =>
                                    updateMatchScore(
                                        match.id,
                                        Number(e.target.value),
                                        match.scoreB,
                                        matches,
                                        setMatches,
                                        user
                                    )
                                }
                                disabled={
                                    user.role !== 'admin' && (Date.now() < match.startTime || Date.now() > match.endTime)
                                }

                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>

                        {/* Team B */}
                        <div className="flex items-center space-x-2 flex-1">
                            <span className="font-semibold text-gray-700">{match.teamB}</span>
                            <select
                                className="border rounded-lg p-2 w-20 focus:ring-1 focus:ring-red-400 focus:outline-none"
                                value={match.scoreB}
                                onChange={(e) =>
                                    updateMatchScore(
                                        match.id,
                                        match.scoreA,
                                        Number(e.target.value),
                                        matches,
                                        setMatches,
                                        user
                                    )
                                }
                                disabled={
                                    user.role !== 'admin' && (Date.now() < match.startTime || Date.now() > match.endTime)
                                }

                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Countdown timer */}
                    <div className={`text-sm text-center mb-2 ${Date.now() < match.startTime ? "text-yellow-600" :
                        Date.now() > match.endTime ? "text-red-600" :
                            "text-green-600"
                        }`}>
                        {Date.now() < match.startTime ? (
                            <>Match starts in: <CountdownTimer endTime={match.startTime} /></>
                        ) : Date.now() > match.endTime ? (
                            <>Match ended</>
                        ) : (
                            <>Time remaining: <CountdownTimer endTime={match.endTime} /></>
                        )}
                    </div>

                    {/* Save button */}
                    <button
                        type="button"
                        onClick={() =>
                            saveMatchResults(
                                teams ?? [],
                                setTeams,
                                setMatches,
                                match.id,
                                matches,
                                user
                            )
                        }
                        className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={
                            user.role !== 'admin' && (Date.now() < match.startTime || Date.now() > match.endTime)
                        }

                    >
                        <FaSave className="mr-2" /> Save Results
                    </button>
                </div>
            )}
        </div>

    );

};