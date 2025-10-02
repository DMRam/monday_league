import React, { type Dispatch, type SetStateAction } from 'react'
import { db } from '../services/firebase';
import type { Match, Team } from '../interfaces/Dashboards';
import type { TeamUser } from '../interfaces/User';
import { doc, updateDoc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
type SetString = Dispatch<SetStateAction<string>>;
type SetStringArray = Dispatch<SetStateAction<string[]>>;

export const useDashboard = () => {
    // Normalize string for logins
    const normalizeString = (str?: string): string => {
        if (!str) return '';
        return str.toLowerCase().trim().replace(/\s+/g, '');
    };

    const createMatch = async (week: number, matchData: any, period: number) => {
        const id = `W${week}_P${period}${uuidv4()}`;
        await setDoc(doc(db, "matches", id), {
            ...matchData,
            week,
        });
    };


    // Admin: Add team
    const addTeam = async (
        setNewPlayers: SetStringArray,
        setNewPlayerName: SetString,
        setNewTeamPool: SetString,
        setNewCoach: SetString,
        setNewTeamName: SetString,
        newTeamName: string,
        newCoach: string,
        newPlayers: string[],
        newTeamPool: string,
        setTeams: Dispatch<SetStateAction<Team[]>>,
        teams: Team[]
    ) => {
        if (!newTeamName) return alert("Team name required");

        // Check if team name already exists (normalized)
        const normalizedNewName = normalizeString(newTeamName);
        const existingTeam = teams.find(team =>
            normalizeString(team.name) === normalizedNewName
        );

        if (existingTeam) {
            alert("Team name already exists!");
            return;
        }

        const docRef = await addDoc(collection(db, 'teams'), {
            name: newTeamName,
            coach: newCoach,
            players: newPlayers,
            totalPoints: 0,
            currentDayPoints: 0,
            pool: newTeamPool,
        });

        setTeams(prevTeams => [
            ...prevTeams,
            {
                id: docRef.id,
                name: newTeamName,
                coach: newCoach,
                players: newPlayers,
                totalPoints: 0,
                pool: newTeamPool,
                currentDayPoints: 0
            }
        ]);

        setNewTeamName('');
        setNewCoach('');
        setNewPlayers([]);
        setNewPlayerName('');
        setNewTeamPool('A');
    };

    const addPlayerToTeamForm = (newPlayerName: string, newPlayers: string[], setNewPlayers: (value: React.SetStateAction<string[]>) => void, setNewPlayerName: (value: React.SetStateAction<string>) => void) => {
        if (!newPlayerName) return;
        setNewPlayers([...newPlayers, newPlayerName]);
        setNewPlayerName('');
    };

    const removePlayerFromTeamForm = (index: number, newPlayers: string[], setNewPlayers: (value: React.SetStateAction<string[]>) => void) => {
        const updatedPlayers = [...newPlayers];
        updatedPlayers.splice(index, 1);
        setNewPlayers(updatedPlayers);
    };

    // Sort matches by pool and time
    const sortMatches = (matches: Match[]): Match[] => {
        return matches.sort((a, b) => {
            // First, sort by start time
            if (a.startTime !== b.startTime) {
                return a.startTime - b.startTime;
            }

            // If start time is the same, sort by pool number
            const poolA = parseInt(a.pool.replace('Pool ', '')) || 0;
            const poolB = parseInt(b.pool.replace('Pool ', '')) || 0;

            return poolA - poolB;
        });
    };


    const generateMatches = async (
        teams: Team[],
        matches: Match[],
        weeksToGenerate: number,
        setShowMatchCreation: (value: React.SetStateAction<boolean>) => void,
        setMatches: (value: React.SetStateAction<Match[]>) => void
    ) => {

        if (teams.length < 5) {
            alert(`You need at least 6 teams to generate matches ${teams.length}`,);
            return;
        }

        try {
            // Determine the next week to generate matches
            const maxWeek = matches.length ? Math.max(...matches.map(m => m.week)) : 0;
            const startWeek = maxWeek + 1;

            // Generate matches for the next `weeksToGenerate` weeks
            for (let week = startWeek; week < startWeek + weeksToGenerate; week++) {
                console.log(`Generating matches for week ${week}`);
                await generateMatchesForWeek(week, teams);
            }

            alert(`Successfully generated matches for ${weeksToGenerate} new week(s)`);
            setShowMatchCreation(false);

            // Fetch updated matches from Firebase
            const snapshot = await getDocs(collection(db, 'matches'));
            const fetchedMatches: Match[] = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Match));

            setMatches(sortMatches(fetchedMatches));

        } catch (error) {
            console.error("Error generating matches:", error);
            alert("Error generating matches");
        }
    };

    const shuffleArraySeeded = <T,>(array: T[]) => {
        return array
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value);
    }

    const generateMatchesForWeek = async (week: number, teams: Team[]) => {
        if (teams.length < 6) {
            throw new Error("Need at least 6 teams to generate matches");
        }

        // Shuffle all teams once with seed
        const shuffled = shuffleArraySeeded(teams);

        // Now split into pools
        let pool1 = shuffled.slice(0, 3);
        let pool2 = shuffled.slice(3, 6);

        // Extra shuffle inside each pool to avoid repetitive rotations
        pool1 = shuffleArraySeeded(pool1);
        pool2 = shuffleArraySeeded(pool2);

        console.log(`Week ${week} - Pool 1 Teams:`, pool1.map(t => t.name));
        console.log(`Week ${week} - Pool 2 Teams:`, pool2.map(t => t.name));

        const period1Slots = [
            { time: "20:50", hour: 20, minute: 50 },
            { time: "21:10", hour: 21, minute: 10 },
            { time: "21:30", hour: 21, minute: 30 },
        ];

        // Then you can call your match generator
        await generateFirstPeriodPoolMatches(pool1, "Gym 1", "Pool 1", period1Slots, week);
        await generateFirstPeriodPoolMatches(pool2, "Gym 2", "Pool 2", period1Slots, week);
    };


    const createMatchDate = (slot: { hour: number; minute: number }, week: number) => {
        // Fixed league start date: September 22, 2025
        const leagueStartDate = new Date(2025, 8, 22); // Month is 0-indexed (8 = September)
        leagueStartDate.setHours(0, 0, 0, 0);

        // Calculate the target date: start date + (week - 1) * 7 days
        const targetDate = new Date(leagueStartDate);
        targetDate.setDate(leagueStartDate.getDate() + (week - 1) * 7);

        // Now set the specific time
        targetDate.setHours(slot.hour, slot.minute, 0, 0);

        return targetDate;
    };

    const generateFirstPeriodPoolMatches = async (pool: Team[], gym: string, poolLabel: string, period1Slots: {
        time: string;
        hour: number;
        minute: number;
    }[], week: number) => {


        const shuffledSlots = shuffleArraySeeded([...period1Slots]);
        const teamIndices = shuffleArraySeeded([0, 1, 2]);

        for (let i = 0; i < 3; i++) {
            const [a, b, r] = [
                teamIndices[i % 3],
                teamIndices[(i + 1) % 3],
                teamIndices[(i + 2) % 3],
            ];
            const slot = shuffledSlots[i];
            const matchDate = createMatchDate(slot, week);

            const startTime = matchDate.getTime();
            const endTime = startTime + 25 * 60 * 1000;

            await createMatch(week, {
                pool: poolLabel,
                teamA: pool[a],
                teamB: pool[b],
                referee: pool[r].name,
                scoreA: 0,
                scoreB: 0,
                completed: false,
                startTime,
                endTime,
                gym,
                timeSlot: slot.time,
                matchNumber: i + 1,
                isSecondPeriod: false,
                createdAt: Date.now(),

            }, 1);


        }
    };

    const generateSecondPeriodMatches = async (
        week: number,
        teams: Team[],
        matches: Match[],
        setMatches: (value: React.SetStateAction<Match[]>) => void
    ) => {
        console.log("=== Generating Second Period Matches ===");
        console.log("Target week:", week);

        try {
            // 1. Validate that we have teams
            if (!teams || teams.length < 6) {
                console.warn("Not enough teams to generate second period matches. Need at least 6 teams.");
                return;
            }

            // 2. Check if first period matches exist for this week
            const firstPeriodMatches = matches.filter(m =>
                m.week === week &&
                !m.isSecondPeriod
            );

            console.log(`First-period matches for week ${week}:`, firstPeriodMatches);

            if (firstPeriodMatches.length === 0) {
                console.log(`❌ No first period matches found for week ${week}. Generate first period matches first.`);
                alert(`Please generate first period matches for Week ${week} before generating second period matches.`);
                return;
            }

            // 3. Check if second period matches already exist for this week
            const existingSecondPeriodMatches = matches.filter(m =>
                m.week === week &&
                m.isSecondPeriod
            );

            if (existingSecondPeriodMatches.length > 0) {
                console.log("✅ Second period matches already exist for week", week);
                alert(`Second period matches for Week ${week} have already been generated.`);
                return;
            }

            // 4. Ensure all first-period matches are completed
            const allFirstPeriodDone = firstPeriodMatches.every(m => m.completed);
            console.log("All first-period matches completed?", allFirstPeriodDone);

            if (!allFirstPeriodDone) {
                const incompleteMatches = firstPeriodMatches.filter(m => !m.completed);
                console.log(`⏳ Cannot generate second period matches - ${incompleteMatches.length} first period matches are not completed`);
                alert(`Please complete all first period matches for Week ${week} before generating second period matches.`);
                return;
            }

            // 5. Calculate points for each team
            const teamPoints: Record<string, number> = {};
            firstPeriodMatches.forEach(m => {
                teamPoints[m.teamA.id] = (teamPoints[m.teamA.id] || 0) + m.scoreA;
                teamPoints[m.teamB.id] = (teamPoints[m.teamB.id] || 0) + m.scoreB;
            });
            console.log("Team points after first period:", teamPoints);

            // 6. Sort teams by points and split into second-period pools
            const sortedTeams = [...teams].sort((a, b) => {
                const pointsA = teamPoints[a.id] || 0;
                const pointsB = teamPoints[b.id] || 0;
                return pointsB - pointsA; // Descending order (highest first)
            });

            console.log("Teams sorted by points:", sortedTeams.map(t => `${t.name}: ${teamPoints[t.id] || 0} pts`));

            const pool1Teams = sortedTeams.slice(0, 3); // Positions 1, 2, 3
            const pool2Teams = sortedTeams.slice(3, 6); // Positions 4, 5, 6

            console.log("Pool 1 teams (positions 1-3):", pool1Teams.map((t, i) => `${i + 1}. ${t.name} (${teamPoints[t.id] || 0} pts)`));
            console.log("Pool 2 teams (positions 4-6):", pool2Teams.map((t, i) => `${i + 4}. ${t.name} (${teamPoints[t.id] || 0} pts)`));

            if (pool1Teams.length < 3 || pool2Teams.length < 3) {
                console.warn("Not enough teams to generate second period matches.");
                alert("Not enough teams to generate second period matches. Need at least 6 teams.");
                return;
            }

            // 7. Define match slots (later times for second period)
            const slots = [
                { time: '21:50', hour: 21, minute: 50 },
                { time: '22:10', hour: 22, minute: 10 },
                { time: '22:30', hour: 22, minute: 30 },
            ];


            const createMatchDate = (slot: { hour: number; minute: number }, week: number) => {
                const leagueStartDate = new Date(2025, 8, 22); // Month is 0-indexed (8 = September)
                leagueStartDate.setHours(0, 0, 0, 0);

                // Calculate the target date: start date + (week - 1) * 7 days
                const targetDate = new Date(leagueStartDate);
                targetDate.setDate(leagueStartDate.getDate() + (week - 1) * 7);

                // Now set the specific time
                targetDate.setHours(slot.hour, slot.minute, 0, 0);

                return targetDate;
            };

            // 8. Helper: generate matches according to specific position-based pairing
            const generatePoolMatches = async (poolTeams: Team[], poolLabel: string, gym: string, positionOffset: number) => {

                // TODO Review expected matches
                const matchesConfig = [
                    {
                        teamAIndex: 0,  // Position 1 vs 3
                        teamBIndex: 2,  // Position 3 or 6
                        refereeIndex: 1 // Position 2 or 5
                    },
                    {
                        teamAIndex: 2,  // Position 3 or 6
                        teamBIndex: 1,  // Position 2 or 5
                        refereeIndex: 0 // Position 1 or 4
                    },
                    {
                        teamAIndex: 0,  // Position 1 or 4
                        teamBIndex: 1,  // Position 2 or 5
                        refereeIndex: 2 // Position 3 or 6
                    }
                ];

                for (let i = 0; i < matchesConfig.length; i++) {
                    const config = matchesConfig[i];
                    const slot = slots[i];
                    const matchDate = createMatchDate(slot, week);

                    const startTime = matchDate.getTime();
                    const endTime = startTime + 25 * 60 * 1000;

                    const teamA = poolTeams[config.teamAIndex];
                    const teamB = poolTeams[config.teamBIndex];
                    const refereeTeam = poolTeams[config.refereeIndex];

                    console.log(`Creating second period match in ${poolLabel}:`, {
                        match: i + 1,
                        teamA: `${config.teamAIndex + 1 + positionOffset} (${teamA.name})`,
                        teamB: `${config.teamBIndex + 1 + positionOffset} (${teamB.name})`,
                        referee: `${config.refereeIndex + 1 + positionOffset} (${refereeTeam.name})`,
                        time: slot.time
                    });

                    // Calculate match number (continue from first period matches)
                    const matchNumber = firstPeriodMatches.length + i + 1;

                    console.log("Match number:", matchNumber);

                    await createMatch(week, {
                        pool: poolLabel,
                        teamA: teamA,
                        teamB: teamB,
                        referee: refereeTeam.name,
                        scoreA: 0,
                        scoreB: 0,
                        completed: false,
                        startTime,
                        endTime,
                        gym,
                        timeSlot: slot.time,
                        matchNumber: matchNumber,
                        isSecondPeriod: true,
                        createdAt: Date.now(),
                    }, 2);
                }
            };

            // 9. Generate matches for both pools with position offsets
            await generatePoolMatches(pool1Teams, "Pool 1", "Gym 1", 0); // Positions 1-3
            await generatePoolMatches(pool2Teams, "Pool 2", "Gym 2", 3); // Positions 4-6


            // 10. Fetch updated matches and set state
            const snapshot = await getDocs(collection(db, 'matches'));
            const fetchedMatches: Match[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Match));

            // console.log("Fetched matches after 2nd period generation:", fetchedMatches);
            setMatches(sortMatches(fetchedMatches));

            console.log(`✅ Second period matches generated for week ${week}`);
            alert(`Second period matches for Week ${week} generated successfully!`);

            return true

        } catch (error) {
            console.error("Error generating second period matches:", error);
            alert("Error generating second period matches. Please check the console for details.");
            // return false;
        }
    };

    // Match editing with referee team validation
    const canEditScore = (match: Match, user: TeamUser): boolean => {
        console.log('User on CanEdit Function: ', user);

        // Admin can always edit
        if (user.role === 'admin') return true;

        // Referee must be assigned to this match
        const isRefereeForMatch = user.team === match.referee;

        // Optional: Only allow editing if match has started
        // const gameHasStarted = Date.now() >= match.startTime;
        console.log("user.name: ", user.name)
        console.log("user.team: ", user.team)
        console.log("match.referee: ", match.referee)

        console.log("isRefereeForMatch: ", isRefereeForMatch)

        return isRefereeForMatch;
    };

    // Change score to dropdown select
    const updateMatchScore = (
        matchId: string,
        newScoreA: number,
        newScoreB: number,
        matches: Match[],
        setMatches: (value: React.SetStateAction<Match[]>) => void
    ) => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        setMatches(matches.map(m =>
            m.id === matchId ? { ...m, scoreA: newScoreA, scoreB: newScoreB } : m
        ));
    };


    const saveMatchResults = async (
        teams: Team[],
        setMatches: (value: React.SetStateAction<Match[]>) => void,
        matchId: string,
        matches: Match[],
        user: TeamUser
    ) => {

        console.log("=== Saving Match Results ===");
        console.log("Match ID ---->:", matchId.toString);
        console.log("User:", user);

        const match = matches.find(m => m.id === matchId);
        if (!match || !canEditScore(match, user)) {
            console.log("Cannot edit match:", matchId, match);
            return alert("Cannot edit match");
        }

        console.log("Saving match result for:", matchId, match);

        console.log("Current teams:", teams);

        const teamA = teams.find(t => normalizeString(t.id) === normalizeString(match.teamA.id));
        const teamB = teams.find(t => normalizeString(t.id) === normalizeString(match.teamB.id));

        console.log("Teams involved:", teamA, teamB);

        const updateTeamStats = async (
            team: Team | undefined,
            points: number,
            isWinner: boolean,
            isLoser: boolean
        ) => {
            if (!team) return console.warn("No team found to update stats");

            const teamRef = doc(db, "teams", team.id);

            console.log(`Updating stats for team: ${team.name}`);
            console.log("Current team stats:", team);

            // --- Update top-level fields (accumulate points) ---
            const updateData: Partial<Team> = {

                // Accumulate points over time
                totalPoints: (team.totalPoints || 0) + points,

                // firstPeriodPoints: !match.isSecondPeriod ?
                //     (team.firstPeriodPoints || 0) + points :
                //     (team.firstPeriodPoints || 0),

                // secondPeriodPoints: match.isSecondPeriod
                //     ? (team.secondPeriodPoints || 0) + points
                //     : team.secondPeriodPoints || 0,
            };

            const existingWeeklyStats = team.weeklyStats || [];
            const weekIndex = existingWeeklyStats.findIndex(ws => ws.week === match.week);

            console.log(`Existing weekly stats for ${team.name}:`, existingWeeklyStats);


            if (weekIndex >= 0) {
                console.log(`Found existing stats for week ${match.week} for team ${team.name}, updating...`);
                // Update existing week stats - ACCUMULATE points from both matches
                const weekStats = existingWeeklyStats[weekIndex];

                existingWeeklyStats[weekIndex] = {
                    ...weekStats,
                    // This accumulates points from both first and second period matches per week
                    totalPoints: (weekStats.totalPoints || 0) + points,
                    firstPeriodPoints: !match.isSecondPeriod ?
                        (weekStats.firstPeriodPoints || 0) + points :
                        (weekStats.firstPeriodPoints || 0),
                    secondPeriodPoints: match.isSecondPeriod ?
                        (weekStats.secondPeriodPoints || 0) + points :
                        (weekStats.secondPeriodPoints || 0),
                    wins: (weekStats.wins || 0) + (isWinner ? 1 : 0),
                    losses: (weekStats.losses || 0) + (isLoser ? 1 : 0),
                };
            } else {
                console.log(`No existing stats for week ${match.week}, creating new entry for ${team.name}`);
                // Create new week stats
                existingWeeklyStats.push({
                    week: match.week,
                    totalPoints: points,
                    firstPeriodPoints: !match.isSecondPeriod ? points : 0,
                    secondPeriodPoints: match.isSecondPeriod ? points : 0,
                    wins: isWinner ? 1 : 0,
                    losses: isLoser ? 1 : 0,
                });
            }

            updateData.weeklyStats = existingWeeklyStats;

            console.log("Updating team stats:", team.name, updateData);
            await updateDoc(teamRef, updateData);
        };

        // --- Decide winners/losers ---
        const isTeamAWinner = match.scoreA > match.scoreB;
        const isTeamBWinner = match.scoreB > match.scoreA;
        const isTie = match.scoreA === match.scoreB;

        console.log("Match outcome:", { isTeamAWinner, isTeamBWinner, isTie });

        // --- Update team stats in Firestore ---
        console.log("Updating stats for Team A:", teamA?.name);
        console.log("Updating stats for Team B:", teamB?.name);
        await updateTeamStats(teamA, match.scoreA, isTeamAWinner, !isTeamAWinner && !isTie);
        await updateTeamStats(teamB, match.scoreB, isTeamBWinner, !isTeamBWinner && !isTie);

        const matchRef = doc(db, "matches", matchId);

        console.log("Updating match document:", matchId, {
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            completed: true,
            savedAt: Date.now(),
        });
        await updateDoc(matchRef, {
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            completed: true,
            savedAt: Date.now(),
        });

        setMatches(matches.map(m => (m.id === matchId ? { ...m, completed: true } : m)));

        console.log("Match saved. Updated matches:", matches);

        const allFirstPeriodDone = matches
            .filter(m => m.week === match.week && !m.isSecondPeriod)
            .every(m => m.completed);

        console.log("All first period matches done for week", match.week, ":", allFirstPeriodDone);
    };


    return {
        addTeam,
        addPlayerToTeamForm,
        removePlayerFromTeamForm,
        generateMatches,
        generateMatchesForWeek,
        canEditScore,
        updateMatchScore,
        saveMatchResults,
        sortMatches,
        normalizeString,
        generateSecondPeriodMatches
    }
}