import { collection, getDocs, query, where } from "firebase/firestore";
import type { Match, Team, TeamWeekStats } from "../interfaces/Dashboards";
import { db } from "../services/firebase";

export const useActiveTabs = () => {

    const getMatchDateForWeek = (week: number, timeSlot: string) => {
        const currentYear = new Date().getFullYear();
        const matchDate = new Date(currentYear, 8, 22);
        matchDate.setDate(matchDate.getDate() + (week - 1) * 7);

        const [hours, minutes] = timeSlot.split(':').map(Number);
        matchDate.setHours(hours, minutes, 0, 0);

        return matchDate;
    };

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

    const calculateSecondHourPools = async (
        teams: Team[],
        matches: Match[],
        week: number
    ) => {
        const { getTeamsFromMatches } = useTeamsFromMatches();
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


    return { getMatchDateForWeek, calculateSecondHourPools, calculateSecondPeriodPools }
}
