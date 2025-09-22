import {
    FaCalendarAlt,
    FaChartLine,
    FaMinus,
    FaPlus,
    FaSave,
    FaTrophy,
    FaUserFriends,
    FaClock,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import type { ActiveTabsProps } from "../../interfaces/ActiveTabs";
import type { Match, Team, TeamWeekStats } from "../../interfaces/Dashboards";
import { collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import type { TeamUser } from "../../interfaces/User";
import { useDashboard } from "../../hooks/useDashboard";

/**
 * --- Utility Hooks & Helpers ---
 */
const useTeamsFromMatches = () => {
    const getTeamsFromMatches = async (
        matches: Match[],
        poolName: string,
        allTeams: Team[],
        week: number,
        sortByScore: boolean = false
    ): Promise<Team[]> => {
        const poolMatches = matches.filter(
            (m) => m.pool === poolName && m.week === week
        );

        const teamNames = poolMatches.flatMap((m) => [m.teamA, m.teamB]);
        const uniqueTeamNames = Array.from(new Set(teamNames));

        const teamsList = uniqueTeamNames
            .map((name) => allTeams.find((t) => t.name === name))
            .filter(Boolean) as Team[];

        try {
            const statsQuery = query(
                collection(db, "teamWeekStats"),
                where("week", "==", week)
            );
            const statsSnap = await getDocs(statsQuery);

            const statsMap: Record<string, TeamWeekStats> = {};
            statsSnap.forEach((docSnap) => {
                const data = docSnap.data() as TeamWeekStats;
                statsMap[data.teamId] = data;
            });

            const enrichedTeams = teamsList.map((t) => {
                // Sum points only from first-period matches
                const teamMatches = poolMatches.filter(
                    (m) => m.teamA === t.name || m.teamB === t.name
                );

                const firstPeriodPoints = teamMatches.reduce((sum, match) => {
                    if (!match.completed) return sum;
                    if (match.teamA === t.name) return sum + match.scoreA;
                    if (match.teamB === t.name) return sum + match.scoreB;
                    return sum;
                }, 0);

                return {
                    ...t,
                    currentDayPoints: firstPeriodPoints,
                };
            });


            if (sortByScore) {
                return enrichedTeams.sort(
                    (a, b) => b.currentDayPoints - a.currentDayPoints
                );
            }
            return enrichedTeams;
        } catch (error) {
            console.error("Error fetching team stats:", error);
            return teamsList.map((team) => ({
                ...team,
                currentDayPoints: 0,
            }));
        }
    };

    return { getTeamsFromMatches };
};

const useSecondHourPools = () => {
    const { getTeamsFromMatches } = useTeamsFromMatches();

    const calculateSecondHourPools = async (
        teams: Team[],
        matches: Match[],
        week: number
    ) => {
        try {
            const poolATeams = await getTeamsFromMatches(
                matches,
                "Pool 1",
                teams,
                week,
                true  // This sorts by points already
            );
            const poolBTeams = await getTeamsFromMatches(
                matches,
                "Pool 2",
                teams,
                week,
                true  // This sorts by points already
            );

            // Combine all teams and sort by points to get overall ranking
            const allTeamsSorted = [...poolATeams, ...poolBTeams].sort(
                (a, b) => b.currentDayPoints - a.currentDayPoints
            );

            // Pool 1: Top 3 teams overall (1st, 2nd, 3rd place)
            const premierPool = allTeamsSorted.slice(0, 3);

            // Pool 2: Next 3 teams overall (4th, 5th, 6th place)
            const secondaryPool = allTeamsSorted.slice(3, 6);

            return {
                premierPool,
                secondaryPool,
                poolATeams,
                poolBTeams
            };
        } catch (error) {
            console.error("Error calculating second hour pools:", error);
            return { premierPool: [], secondaryPool: [], poolATeams: [], poolBTeams: [] };
        }
    };

    return { calculateSecondHourPools };
};

/**
 * --- Pool Display Component ---
 */
const PoolDisplay = ({
    title,
    teams,
    colorClass,
    pointsBgClass,
    description,
    showTime = false,
}: {
    title: string;
    teams: Team[] | undefined;
    colorClass: string;
    pointsBgClass: string;
    description?: string;
    showTime?: boolean;
}) => (
    <div className={`rounded-lg p-4 ${colorClass}`}>
        <div className="flex justify-between items-center mb-4">
            <h4 className={`font-semibold text-lg`}>{title}</h4>
            {showTime && (
                <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="mr-1" />
                    {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            )}
        </div>
        {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
        <ul className="space-y-3">
            {teams ? teams.map((team) => (
                <li
                    key={team.id}
                    className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
                >
                    <span className="font-medium">{team.name}</span>
                    <span className={`${pointsBgClass} px-3 py-1 rounded-full text-sm`}>
                        {team.currentDayPoints?.toString() || "0"} pts
                    </span>
                </li>
            )) : []}
        </ul>
    </div>
);

/**
 * --- Render Match Card Component ---
 */
const RenderMatchCard = ({
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
}) => {
    // Helper function to determine pool badge class
    const getPoolBadgeClass = (pool: string) => {
        if (pool === "Pool 1" || pool === "A") return 'bg-blue-100 text-blue-800';
        if (pool === "Pool 2" || pool === "B") return 'bg-orange-100 text-orange-800';
        if (pool === "Pool 1") return 'bg-purple-100 text-purple-800';
        if (pool === "Pool 2") return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    console.log('User RenderMatchCard: ', user)

    return (
        <div key={match.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition duration-200">
            {/* Pool & Status */}
            <div className="flex justify-between items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPoolBadgeClass(match.pool)}`}>
                    {match.pool}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${match.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {match.completed ? 'Completed' : 'Scheduled'}
                </span>
            </div>

            {/* Gym and Referee info */}
            <div className="text-sm text-gray-500 mb-4 space-y-1">
                <div>{match.gym} • {match.timeSlot}</div>
                <div>Referee: {match.referee}</div>
            </div>

            {/* Teams and Scores */}
            <div className="flex justify-between items-center mb-4">
                {/* Team A */}
                <div className="text-center flex-1">
                    <p className="font-semibold text-gray-800">{match.teamA}</p>
                    <p className="text-3xl font-bold text-blue-600">{match.scoreA}</p>
                </div>

                <span className="text-gray-400 mx-4 font-semibold text-lg">VS</span>

                {/* Team B */}
                <div className="text-center flex-1">
                    <p className="font-semibold text-gray-800">{match.teamB}</p>
                    <p className="text-3xl font-bold text-red-600">{match.scoreB}</p>
                </div>
            </div>

            {/* Score update (dropdowns) */}
            {!match.completed && canEditScore(match, user) && (
                <div className="mt-4 space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        {/* Team A Score */}
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
                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>

                        {/* Team B Score */}
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
                            >
                                {Array.from({ length: 50 }).map((_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>
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
                        className="w-full bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center hover:bg-blue-700 transition"
                    >
                        <FaSave className="mr-2" /> Save Results
                    </button>
                </div>
            )}

            {/* Read-only message for referees */}
            {!match.completed && !canEditScore(match, user) && user.role === 'referee' && (
                <div className="text-center text-sm text-gray-500 mt-4">
                    You can only edit matches where you are assigned as referee
                </div>
            )}
        </div>
    );

};

/**
 * --- Active Tabs Renderer ---
 */
export const ActiveTabsRenderer = (props: ActiveTabsProps) => {
    const {
        activeTab,
        setSelectedTeam,
        teams,
        selectedTeam,
        currentWeek,
        currentWeekMatches,
        nextWeek,
        prevWeek,
        canEditScore,
        saveMatchResults,
        updateMatchScore,
        user,
        matches,
        setMatches,
        setTeams,
        setActiveTab,
        standings,
    } = props;

    const { calculateSecondHourPools } = useSecondHourPools();

    const [poolATeamsSecondPeriod, setPoolATeamsSecondPeriod] = useState<Team[]>([]);
    const [poolBTeamsSecondPeriod, setPoolBTeamsSecondPeriod] = useState<Team[]>([]);
    const [poolATeamsFirstPeriod, setPoolATeamsFirstPeriod] = useState<Team[]>([]);
    const [poolBTeamsFirstPeriod, setPoolBTeamsFirstPeriod] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    console.log('User on ActiveTabsRenderer: ', user)


    const calculateSecondPeriodPools = (
        firstPeriodTeams: Team[],
        matches: Match[],
        currentWeek: number
    ) => {
        try {
            // Filter second period matches
            const secondPeriodMatches = matches.filter(
                (match) =>
                    match.week === currentWeek &&
                    ["21:50", "22:10", "22:30"].includes(match.timeSlot)
            );

            // Map second period points
            const secondPeriodPoints: Record<string, number> = {};
            secondPeriodMatches.forEach((match) => {
                if (match.completed) {
                    secondPeriodPoints[match.teamA] =
                        (secondPeriodPoints[match.teamA] || 0) + match.scoreA;
                    secondPeriodPoints[match.teamB] =
                        (secondPeriodPoints[match.teamB] || 0) + match.scoreB;
                }
            });

            // Update teams with second period points
            const updatedTeams: Team[] = firstPeriodTeams.map((team) => ({
                ...team,
                secondPeriodPoints: secondPeriodPoints[team.name] || 0,
                // cumulative total if needed
                totalPoints:
                    (team.currentDayPoints || 0) +
                    (secondPeriodPoints[team.name] || 0),
            }));

            // Sort by first-period points to assign second-period pools
            const sortedByFirstPeriod = [...updatedTeams].sort(
                (a, b) => b.currentDayPoints - a.currentDayPoints
            );

            const premierPool = sortedByFirstPeriod.slice(0, 3);
            const secondaryPool = sortedByFirstPeriod.slice(3, 6);

            return {
                premierPool,
                secondaryPool,
                updatedTeams,
            };
        } catch (error) {
            console.error("Error in calculateSecondPeriodPools:", error);
            return {
                premierPool: [],
                secondaryPool: [],
                updatedTeams: firstPeriodTeams.map((t) => ({
                    ...t,
                    secondPeriodPoints: 0,
                    totalPoints: t.currentDayPoints,
                })),
            };
        }
    };



    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // First period pools (Pool A & Pool B)
                const firstPeriodResult = await calculateSecondHourPools(
                    teams ?? [],
                    matches,
                    currentWeek
                );

                // Save first-period pools
                setPoolATeamsFirstPeriod(firstPeriodResult.poolATeams);
                setPoolBTeamsFirstPeriod(firstPeriodResult.poolBTeams);

                // Second period pools (based on first-period ranking)
                const allFirstPeriodTeams = [
                    ...firstPeriodResult.poolATeams,
                    ...firstPeriodResult.poolBTeams,
                ];

                const secondPeriodResult = calculateSecondPeriodPools(
                    allFirstPeriodTeams,
                    matches,
                    currentWeek
                );

                // Save second-period pools
                setPoolATeamsSecondPeriod(secondPeriodResult.premierPool);
                setPoolBTeamsSecondPeriod(secondPeriodResult.secondaryPool);

                // Update all teams with second-period points
                if (setTeams && !isFirstPeriodMatch) {
                    setTeams(secondPeriodResult.updatedTeams);
                } else {
                    console.warn("setTeams function is undefined");
                }

            } catch (error) {
                console.error("Error loading pool data:", error);

                setPoolATeamsFirstPeriod([]);
                setPoolBTeamsFirstPeriod([]);
                setPoolATeamsSecondPeriod([]);
                setPoolBTeamsSecondPeriod([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeTab, currentWeek, JSON.stringify(matches.map((m) => m.id))]);


    const isFirstPeriodMatch = (match: Match) => {
        return match.timeSlot === '20:50' || match.timeSlot === '21:10' || match.timeSlot === '21:30';
    };

    const isSecondPeriodMatch = (match: Match) => {
        return match.timeSlot === '21:50' || match.timeSlot === '22:10' || match.timeSlot === '22:30';
    };

    // Add this component for day standings
    const DayStandings = ({ teams }: { teams: Team[] }) => {
        console.log("Received teams:", teams);

        const teamsWithAllPoints = teams
            ? teams.map(team => {
                const dayPoints = team.currentDayPoints || 0;
                const secondPeriodPoints = team.secondPeriodPoints || 0;
                const totalDayPoints = dayPoints + secondPeriodPoints;

                console.log(`Team: ${team.name}`, { dayPoints, secondPeriodPoints, totalDayPoints });
                console.log("Team Full: ", team)

                return {
                    ...team,
                    dayPoints,
                    secondPeriodPoints,
                    totalDayPoints
                };
            }).sort((a, b) => b.totalDayPoints - a.totalDayPoints)
            : [];

        console.log("Teams after mapping & sorting:", teamsWithAllPoints);

        return (
            <div className="bg-white rounded-lg shadow-md p-6 mt-8 col-span-2">
                <div className="flex items-center mb-6">
                    <FaTrophy className="text-blue-500 text-xl mr-2" />
                    <h3 className="text-xl font-bold text-gray-800">Today's Standings</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 text-left">Position</th>
                                <th className="px-4 py-2 text-left">Team</th>
                                {/* <th className="px-4 py-2 text-left">Pool</th> */}
                                <th className="px-4 py-2 text-left">1st Period</th>
                                <th className="px-4 py-2 text-left">2nd Period</th>
                                <th className="px-4 py-2 text-left">Today Total</th>
                                <th className="px-4 py-2 text-left">Season Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamsWithAllPoints.map((team, index) => (
                                <tr key={team.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                    <td className="px-4 py-3 font-medium">{index + 1}</td>
                                    <td className="px-4 py-3 font-semibold">{team.name}</td>
                                    {/* <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs ${team.pool === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                            {team.pool || 'N/A'}
                                        </span>
                                    </td> */}
                                    <td className="px-4 py-3 font-bold text-blue-600">{team.dayPoints}</td>
                                    <td className="px-4 py-3 font-bold text-purple-600">{team.secondPeriodPoints}</td>
                                    <td className="px-4 py-3 font-bold text-green-600">{team.totalDayPoints}</td>
                                    <td className="px-4 py-3 font-bold">{team.totalPoints}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };


    // Generate second period matches button component
    interface GenerateSecondPeriodMatchesButtonProps {
        user: TeamUser;
        currentWeek: number;
        teams: Team[];
        matches: Match[];
        setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
    }

    const GenerateSecondPeriodMatchesButton = ({
        user,
        currentWeek,
        teams,
        matches,
        setMatches
    }: GenerateSecondPeriodMatchesButtonProps) => {
        const { generateSecondPeriodMatches } = useDashboard();

        console.log("Teams for second period: ", teams)

        if (user?.role !== 'admin') return null;

        // Check if first period matches are completed
        const firstPeriodMatches = matches.filter(
            m => m.week === currentWeek && m.timeSlot <= "21:30"
        );
        const allFirstPeriodCompleted = firstPeriodMatches.every(m => m.completed);
        const hasSecondPeriodMatches = matches.some(
            m => m.week === currentWeek && m.timeSlot >= "21:50"
        );

        if (hasSecondPeriodMatches) {
            return (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    Second period matches already generated
                </div>
            );
        }

        if (!allFirstPeriodCompleted) {
            return (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    Complete all first period matches before generating second period
                </div>
            );
        }

        return (
            <button
                type="button"
                onClick={() =>
                    generateSecondPeriodMatches(currentWeek, teams, matches, setMatches)
                }
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition mb-4"
            >
                Generate Second Period Matches
            </button>
        );
    };



    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-600">Loading pool data...</div>
            </div>
        );
    }


    switch (activeTab) {
        case 'admin':
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Admin Panel</h2>
                    <p className="text-gray-600">Here you can manage teams, matches, pools, and weekly stats.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <button
                            type="button"
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                            onClick={() => console.log("Create team clicked")}
                        >
                            Create Team
                        </button>
                        <button
                            type="button"
                            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                            onClick={() => console.log("Schedule match clicked")}
                        >
                            Schedule Match
                        </button>
                    </div>
                </div>
            );

        case 'teams':
            return (
                <div className="bg-gray-50 p-6 rounded-lg shadow-md space-y-6">
                    <h2 className="text-3xl font-bold text-gray-800">Teams</h2>

                    <p className="text-gray-600 font-medium">{teams?.length || 0} teams available</p>

                    {/* Teams grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {teams?.map(team => (
                            <div
                                key={team.id}
                                className="border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg transition duration-200 bg-white"
                                onClick={() => setSelectedTeam(team)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-xl font-semibold text-blue-700">{team.name}</h3>
                                    {/* <span
                                        className={`px-3 py-1 rounded-full text-sm font-medium ${team.pool === 'A'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-orange-100 text-orange-800'
                                            }`}
                                    >
                                        Pool {team.pool}
                                    </span> */}
                                </div>
                                <p className="text-gray-500">Coach: {team.coach}</p>
                                <p className="text-gray-500">{team.players.length} players</p>
                                <div className="mt-3 space-y-1">
                                    <p className="font-semibold text-blue-600">
                                        Today's Points: {team.currentDayPoints || 0}
                                    </p>
                                    <p className="font-semibold text-green-600">
                                        Total Points: {team.totalPoints}
                                    </p>
                                </div>
                            </div>
                        )) || (
                                <p className="text-gray-500 col-span-full text-center">No teams available</p>
                            )}
                    </div>

                    {/* Selected team details */}
                    {selectedTeam && (
                        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800">{selectedTeam.name} - Players</h2>

                            </div>

                            <div className="flex items-center gap-4 mb-6">
                                {/* <span className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-medium ${selectedTeam.pool === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                    Pool {selectedTeam.pool}
                                </span> */}
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedTeam.name}</h3>
                                    <p className="text-gray-500">Coach: {selectedTeam.coach}</p>
                                    <p className="font-semibold text-blue-600">Today: {selectedTeam.currentDayPoints || 0} pts</p>
                                    <p className="font-semibold text-green-600">Total: {selectedTeam.totalPoints} pts</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedTeam.players.map((player, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition duration-200"
                                    >
                                        <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xl">
                                            <FaUserFriends />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{player}</h3>
                                            <p className="text-gray-500 text-sm">Player #{index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!selectedTeam && (
                        <div className="bg-white rounded-xl shadow-md p-6 text-center mt-6">
                            <p className="text-gray-500">Select a team to view its players</p>
                        </div>
                    )}
                </div>
            );

        case 'matches':
            return (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Week {currentWeek} Matches</h2>
                        <div className="flex space-x-4">
                            <button
                                type="button"
                                onClick={prevWeek}
                                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
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

                    {/* Add generate button for admin */}
                    <GenerateSecondPeriodMatchesButton
                        user={user!}
                        currentWeek={currentWeek}
                        teams={teams ?? []}
                        matches={matches}
                        setMatches={setMatches}
                    />


                    {currentWeekMatches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No matches scheduled for week {currentWeek}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">First Period (8:50 PM - 9:50 PM)</h3>
                                <p className="text-sm text-gray-600 mb-4">Round-robin matches within each pool</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {currentWeekMatches
                                        .filter(isFirstPeriodMatch)
                                        .map(match => (
                                            <RenderMatchCard
                                                key={match.id}
                                                match={match}
                                                user={user}
                                                canEditScore={canEditScore}
                                                updateMatchScore={updateMatchScore}
                                                saveMatchResults={saveMatchResults}
                                                matches={matches}
                                                setMatches={setMatches}
                                                teams={teams ? teams : []}
                                                setTeams={setTeams}
                                            />
                                        ))
                                    }
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Second Period (9:50 PM - 10:50 PM)</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Ranking matches: Pool 1 (1st-3rd) and Pool 2 (4th-6th)
                                </p>

                                {/* Show message if no second period matches generated yet */}
                                {currentWeekMatches.filter(isSecondPeriodMatch).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        {user!.role === 'admin'
                                            ? "Click 'Generate Second Period Matches' to create ranking matches"
                                            : "Second period matches will be generated after first period results"
                                        }
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentWeekMatches
                                            .filter(isSecondPeriodMatch)
                                            .map(match => (
                                                <RenderMatchCard
                                                    key={match.id}
                                                    match={match}
                                                    user={user}
                                                    canEditScore={canEditScore}
                                                    updateMatchScore={updateMatchScore}
                                                    saveMatchResults={saveMatchResults}
                                                    matches={matches}
                                                    setMatches={setMatches}
                                                    teams={teams ? teams : []}
                                                    setTeams={setTeams}
                                                />
                                            ))
                                        }
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );

        default:
            return (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* First Hour Pools */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <PoolDisplay
                                title="Pool A - First Period"
                                teams={poolATeamsFirstPeriod}
                                colorClass="bg-blue-50"
                                pointsBgClass="bg-blue-100 text-blue-800"
                            />
                            <PoolDisplay
                                title="Pool B - First Period"
                                teams={poolBTeamsFirstPeriod}
                                colorClass="bg-orange-50"
                                pointsBgClass="bg-orange-100 text-orange-800"
                            />
                        </div>

                        {/* Second Hour Pools */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <FaCalendarAlt className="text-blue-500 text-xl mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">
                                    Second Hour (9:50 PM - 10:50 PM)
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PoolDisplay
                                    title="Pool 1"
                                    description="Top 3 teams from both pools - Competing for 1st-3rd place"
                                    teams={poolATeamsSecondPeriod.map(team => ({
                                        ...team,
                                        // Use safe access with fallback values
                                        currentDayPoints: (team.secondPeriodPoints || 0) > 0 ? (team.secondPeriodPoints || 0) : 0
                                    })).sort((a, b) => b.currentDayPoints - a.currentDayPoints)}
                                    colorClass="bg-purple-50 text-purple-800"
                                    pointsBgClass="bg-purple-100 text-purple-800"
                                />
                                <PoolDisplay
                                    title="Pool 2"
                                    description="Next 3 teams from both pools - Competing for 4th-6th place"
                                    teams={poolBTeamsSecondPeriod.map(team => ({
                                        ...team,
                                        // Use safe access with fallback values
                                        currentDayPoints: (team.secondPeriodPoints || 0) > 0 ? (team.secondPeriodPoints || 0) : 0
                                    })).sort((a, b) => b.currentDayPoints - a.currentDayPoints)}
                                    colorClass="bg-green-50 text-green-800"
                                    pointsBgClass="bg-green-100 text-green-800"
                                />
                            </div>
                        </div>
                    </div>
                    <DayStandings teams={teams ? teams : []} />

                    {/* Standings and Points */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        {/* League Standings */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <FaTrophy className="text-yellow-500 text-xl mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">League Standings</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="px-4 py-2 text-left">Position</th>
                                            <th className="px-4 py-2 text-left">Team</th>
                                            <th className="px-4 py-2 text-left">Pool</th>
                                            <th className="px-4 py-2 text-left">Coach</th>
                                            <th className="px-4 py-2 text-left">Total Points</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {standings.map((team, index) => (
                                            <tr key={team.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="px-4 py-3 font-medium">{index + 1}</td>
                                                <td className="px-4 py-3 font-semibold">{team.name}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${team.pool === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {team.pool}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">{team.coach}</td>
                                                <td className="px-4 py-3 font-bold">{team.totalPoints}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Matches */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center mb-6">
                                <FaChartLine className="text-blue-500 text-xl mr-2" />
                                <h3 className="text-xl font-bold text-gray-800">Recent Matches</h3>
                            </div>

                            <div className="space-y-4">
                                {matches
                                    .filter(m => m.completed)
                                    .sort((a, b) => b.startTime - a.startTime)
                                    .slice(0, 5)
                                    .map(match => (
                                        <div key={match.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-sm">{match.teamA}</span>
                                                <span className="text-lg font-bold">{match.scoreA} - {match.scoreB}</span>
                                                <span className="font-semibold text-sm">{match.teamB}</span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Week {match.week} • Pool {match.pool} • {match.gym}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                            <button
                                type="button"
                                onClick={() => setActiveTab('matches')}
                                className="w-full mt-4 text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                                View All Matches →
                            </button>
                        </div>

                    </div>
                </>
            );
    }
};