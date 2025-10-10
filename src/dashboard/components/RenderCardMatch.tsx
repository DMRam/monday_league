import { format } from "date-fns";
import { useState } from "react";
import { enUS, fr } from "date-fns/locale";
import type { Match, Team } from "../../interfaces/Dashboards";
import type { TeamUser } from "../../interfaces/User";

type Language = "en" | "fr";

const localeMap = {
    en: enUS,
    fr: fr,
};

export const RenderMatchCard = ({
    match,
    user,
    canEditScore,
    setSaving,
    updateMatchScore,
    matches,
    setMatches,
    teams,
    setTeams,
    language = "en" as Language,
    t
}: {
    match: Match;
    user: any;
    canEditScore: (match: any, user: any) => boolean;
    updateMatchScore: (matchId: string, newScoreA: number, newScoreB: number, matches: Match[], setMatches: (value: React.SetStateAction<Match[]>) => void, teams: Team[], user: TeamUser, _updatedTeam: "A" | "B", setLoading: (value: boolean) => void, setTeams?: (value: React.SetStateAction<Team[]>) => void) => void
    saveMatchResults: (teams: Team[], _setMatches: (value: React.SetStateAction<Match[]>) => void, matchId: string, updatedMatches: Match[], user: TeamUser, setLoading: (value: boolean) => void, setTeams?: (value: React.SetStateAction<Team[]>) => void) => Promise<void>
    setSaving: (value: boolean) => void,
    matches: any[];
    setMatches: any;
    teams: any[];
    setTeams: any;
    language?: Language;
    t: any
}) => {




    console.log("---- User in RenderMatchCard:", user);
    const [currentTime, _setCurrentTime] = useState(Date.now());

    // useEffect(() => {
    //     const interval = setInterval(() => setCurrentTime(Date.now()), 30000);
    //     return () => clearInterval(interval);
    // }, []);

    const matchHasStarted = currentTime >= match.startTime;
    const matchEnded = currentTime > match.endTime;
    const canEdit = !match.completed && canEditScore(match, user);
    const shouldDisable = user.role !== "admin" && !matchHasStarted;

    console.log("Rendering match:", match.id, "Can edit:", canEdit, "Should disable:", shouldDisable);

    const dateFnsLocale = localeMap[language];

    const formatTime = (ts: number) => format(new Date(ts), "HH:mm", { locale: dateFnsLocale });
    const formatDate = (ts: number) => format(new Date(ts), "MMM d, HH:mm", { locale: dateFnsLocale });

    // const handleSaveClick = () => setShowConfirmation(true);
    // const confirmSave = () => {
    //     saveMatchResults(teams ?? [], setMatches, match.id, matches, user);
    //     setShowConfirmation(false);
    // };
    // const cancelSave = () => setShowConfirmation(false);

    return (
        <div className={`bg-white border rounded-xl p-6 shadow-sm transition duration-200 hover:shadow-lg ${match.completed
            ? "border-gray-300 bg-gray-50 opacity-90"
            : user.team === match.referee
                ? "border-blue-500"
                : "border-gray-200"
            }`}>
            {/* Confirmation Dialog */}
            {/* {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
                        <h3 className="text-lg font-semibold mb-4">{t.saveResults}</h3>
                        <p className="text-gray-600 mb-4">
                            {t.areYouSureSave}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelSave}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                {t.cancel}
                            </button>
                            <button
                                onClick={confirmSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                {t.yesSaveScores}
                            </button>
                        </div>
                    </div>
                </div>
            )} */}

            {/* Pool & Status */}
            <div className="flex justify-between items-center mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {match.pool}
                </span>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${match.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                >
                    {match.completed ? t.completed : t.scheduled}
                </span>
            </div>

            {/* Match Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700">
                        {matchHasStarted
                            ? matchEnded
                                ? `${t.matchEnded} ${formatTime(match.endTime - 5 * 60 * 1000)}`
                                : `${t.matchInProgress} - ${t.startedAt} ${formatTime(match.startTime)}`
                            : `${t.startsAt} ${formatTime(match.startTime)}`
                        }
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                        <p>{formatDate(match.startTime)} • {match.gym}</p>
                        {/* {(!matchEnded && !match.completed) && (
                            <CountdownTimer
                                startTime={match.startTime}
                                endTime={match.endTime}
                                compact
                                renderTime={(msLeft: number) => {
                                    const totalSeconds = Math.floor(msLeft / 1000);
                                    const days = Math.floor(totalSeconds / (3600 * 24));
                                    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
                                    const minutes = Math.floor((totalSeconds % 3600) / 60);
                                    const seconds = totalSeconds % 60;

                                    // Determine color
                                    let colorClass = "text-blue-600 font-semibold";
                                    if (currentTime >= match.startTime && currentTime <= match.endTime - 5 * 60 * 1000) {
                                        colorClass = "text-green-700 font-semibold";
                                    }
                                    if (msLeft <= 5 * 60 * 1000) {
                                        colorClass = "text-red-600 font-bold";
                                    }

                                    // Format time string with conditional days
                                    let timeString;
                                    if (days > 0) {
                                        timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
                                    } else if (hours > 0) {
                                        timeString = `${hours}h ${minutes}m ${seconds}s`;
                                    } else {
                                        timeString = `${minutes}m ${seconds}s`;
                                    }

                                    return (
                                        <span className={colorClass}>
                                            {timeString}
                                        </span>
                                    );
                                }}
                            />
                        )} */}
                    </div>

                </div>
            </div>


            {/* Referee info */}
            <div className="text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                    {t.referee}:
                    <span
                        className={`font-semibold ${user.team === match.referee ? "text-blue-700" : "text-gray-700"
                            }`}
                    >
                        {match.referee}
                    </span>
                    {user.team === match.referee && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {t.you}
                        </span>
                    )}
                </div>
            </div>

            {/* Teams and Scores */}
            <div className="flex justify-between items-center mb-4">
                <div className={`text-center flex-1 rounded-lg p-2 ${user.name === match.teamA ? "bg-blue-50 border border-blue-200" : ""
                    }`}>
                    <p className="font-semibold text-gray-800">{match.teamA.name}</p>
                    <p className="text-3xl font-bold text-blue-600">{match.scoreA}</p>
                </div>

                <span className="text-gray-400 mx-4 font-semibold text-lg">{t.vs}</span>

                <div className={`text-center flex-1 rounded-lg p-2 ${user.name === match.teamB ? "bg-red-50 border border-red-200" : ""
                    }`}>
                    <p className="font-semibold text-gray-800">{match.teamB.name}</p>
                    <p className="text-3xl font-bold text-red-600">{match.scoreB}</p>
                </div>
            </div>

            {/* Score Editor - Only show if user can edit */}
            {canEdit && (
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex items-center space-x-2 flex-1">
                            <span className="font-semibold text-gray-700 text-sm">{match.teamA.name}</span>
                            <select
                                className="border rounded-lg p-2 w-16 focus:ring-1 focus:ring-blue-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                value={match.scoreA}
                                onChange={(e) =>
                                    updateMatchScore(
                                        match.id,
                                        Number(e.target.value),
                                        match.scoreB,
                                        matches,
                                        setMatches,
                                        teams ?? [],
                                        user,
                                        "A",
                                        setSaving,
                                        setTeams,
                                    )
                                }
                                disabled={shouldDisable}
                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center space-x-2 flex-1">
                            <span className="font-semibold text-gray-700 text-sm">{match.teamB.name}</span>
                            <select
                                className="border rounded-lg p-2 w-16 focus:ring-1 focus:ring-red-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                value={match.scoreB}
                                onChange={(e) =>
                                    updateMatchScore(
                                        match.id,
                                        match.scoreA,
                                        Number(e.target.value),
                                        matches,
                                        setMatches,
                                        teams ?? [],
                                        user,
                                        "B",
                                        setSaving,
                                        setTeams,
                                    )
                                }
                                disabled={shouldDisable}
                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>
                    </div>


                    {/* Save Button */}
                    {/* <button
                        type="button"
                        onClick={handleSaveClick}
                        className={`w-full text-white py-2 rounded-lg flex items-center justify-center transition text-sm font-semibold 
    ${!shouldDisable ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"}`}
                        disabled={shouldDisable}
                    >
                        <FaSave className="mr-2" />
                        {t.saveResultsShort || t.saveResults}
                    </button> */}

                    {/* Optional helper text for French */}
                    {shouldDisable && (
                        <p className="text-xs text-gray-500 text-center mt-1">
                            {t.scoreEditingAvailable}
                        </p>
                    )}


                    {/* Help text */}
                    {!matchHasStarted && (
                        <p className="text-xs text-gray-500 text-center">
                            {t.scoreEditingAvailable}
                        </p>
                    )}
                </div>
            )}

            {/* For completed matches or non-editable matches */}
            {!canEdit && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center text-sm text-gray-600">
                        {match.completed
                            ? `${t.matchCompleted} • ${formatTime(typeof match.savedAt === "number" ? match.savedAt : match.endTime - 5 * 60 * 1000)}`
                            : `${t.matchScheduled} • ${t.startsAt} ${formatTime(match.startTime)}`
                        }
                    </div>
                </div>
            )}
        </div>
    );
};