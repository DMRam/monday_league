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

            console.log("Matches input to getTeamsFromMatches:", matches);
            console.log("All teams input to getTeamsFromMatches:", allTeams);
            console.log("Pool name:", poolName, "Week:", week);

            const poolMatches = matches.filter(
                (m) => m.pool === poolName && m.week === week
            );





            console.log(`All team names in ${poolName} for week ${week}:`, allTeams);

            allTeams.map(t => console.log(`Team: ${t.name}`));
            poolMatches.map(m => console.log(`Match: ${m.teamA} vs ${m.teamB}`));
            poolMatches.map(m => console.log(`Are teams in match? ${allTeams.map(t => t.name).includes(m.teamA.name)} vs ${allTeams.map(t => t.name).includes(m.teamB.name)}`));

            const teamsList = allTeams.filter(t =>
                poolMatches.some(
                    m => (m.teamA.id === t.id || m.teamB.id === t.id) && m.isSecondPeriod === false
                )
            );


            poolMatches.filter(m =>
                !allTeams.some(t => t.id === m.teamA.id || t.name === m.teamB.id)
            ).forEach(m => console.warn(`Warning: Match with unknown teams in ${poolName}: ${m.teamA} vs ${m.teamB}`));

            console.log(`--- Matches for ${poolName} in week ${week}:`, poolMatches);

            console.log(`Teams in ${poolName} for week ${week}:`, teamsList);

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
                        (m) => (m.teamA.id === t.id || m.teamB.id === t.id) && !m.isSecondPeriod
                    );


                    const firstPeriodPoints = teamMatches.reduce((sum, match) => {
                        if (!match.completed) return sum;
                        if (match.teamA.id === t.id) return sum + match.scoreA;
                        if (match.teamB.id === t.id) return sum + match.scoreB;
                        return sum;
                    }, 0);

                    console.log(`First period points for team ${t.name} in ${poolName}:`, firstPeriodPoints);

                    return {
                        ...t,
                        currentDayPoints: firstPeriodPoints,
                    };
                });



                console.log(`Enriched teams for ${poolName}:`, enrichedTeams);


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

    const calculateAllPools = async (
        teams: Team[],
        matches: Match[],
        week: number
    ) => {
        const { getTeamsFromMatches } = useTeamsFromMatches();

        console.log("Matches received for pool calculation:", matches);
        console.log("Teams received for pool calculation:", teams);
        console.log("Calculating pools for week:", week);
        try {
            // Get ACTUAL first period pools from matches
            const poolATeams = await getTeamsFromMatches(
                matches,
                "Pool 1",
                teams,
                week,
                true

            );
            const poolBTeams = await getTeamsFromMatches(
                matches,
                "Pool 2",
                teams,
                week,
                true
            );

            console.log("First Period - Pool 1:", poolATeams.map(t => t.name));
            console.log("First Period - Pool 2:", poolBTeams.map(t => t.name));

            // Combine all teams and sort by points to get overall ranking for SECOND PERIOD
            const allTeamsSorted = [...poolATeams, ...poolBTeams].sort(
                (a, b) => b.currentDayPoints - a.currentDayPoints
            );

            console.log("All teams sorted by points:", allTeamsSorted.map(t => `${t.name}: ${t.currentDayPoints}`));

            // Second Period Pools:
            const premierPool = allTeamsSorted.slice(0, 3);  // Positions 1-3
            const secondaryPool = allTeamsSorted.slice(3, 6); // Positions 4-6

            console.log("Second Period - Premier Pool:", premierPool.map(t => t.name));
            console.log("Second Period - Secondary Pool:", secondaryPool.map(t => t.name));

            return {
                poolATeams,      // First Period Pool A
                poolBTeams,      // First Period Pool B  
                premierPool,     // Second Period Premier Pool
                secondaryPool    // Second Period Secondary Pool
            };
        } catch (error) {
            console.error("Error calculating pools:", error);
            return {
                poolATeams: [],
                poolBTeams: [],
                premierPool: [],
                secondaryPool: []
            };
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
                    match.timeSlot &&
                    ["21:50", "22:10", "22:30"].includes(match.timeSlot)
            );


            // Map second period points
            const secondPeriodPoints: Record<string, number> = {};
            secondPeriodMatches.forEach((match) => {
                if (match.completed) {
                    secondPeriodPoints[match.teamA.id] =
                        (secondPeriodPoints[match.teamA.id] || 0) + match.scoreA;
                    secondPeriodPoints[match.teamB.id] =
                        (secondPeriodPoints[match.teamB.id] || 0) + match.scoreB;
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


    return { getMatchDateForWeek, calculateAllPools, calculateSecondPeriodPools }
}
