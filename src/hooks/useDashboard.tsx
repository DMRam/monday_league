// hooks/useDashboard.ts
import React, { type Dispatch, type SetStateAction } from 'react'
import { db } from '../services/firebase';
import type { Match, Team, TeamWeekStats } from '../interfaces/Dashboards';
import type { TeamUser } from '../interfaces/User';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
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

    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    const shuffleWithSeed = (array: Team[], seed: number) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };


    const generateMatchesForWeek = async (week: number, teams: Team[]) => {
        if (teams.length < 5) {
            throw new Error("Need at least 6 teams to generate matches");
        }

        const shuffled = shuffleWithSeed(teams, week);

        const pool1 = shuffled.slice(0, 3);
        const pool2 = shuffled.slice(3, 6);

        const period1Slots = [
            { time: '20:50', hour: 20, minute: 50 },
            { time: '21:10', hour: 21, minute: 10 },
            { time: '21:30', hour: 21, minute: 30 },
        ];

        const createMatchDate = (slot: { hour: number; minute: number }) => {
            const matchDate = new Date();
            matchDate.setDate(matchDate.getDate() + (week - 1) * 7);
            matchDate.setHours(slot.hour, slot.minute, 0, 0);
            return matchDate;
        };

        const generateFirstPeriodPoolMatches = async (pool: Team[], gym: string, poolLabel: string) => {
            const combos = [
                [0, 1, 2],
                [1, 2, 0],
                [2, 0, 1],
            ];

            for (let i = 0; i < combos.length; i++) {
                const [a, b, r] = combos[i];
                const slot = period1Slots[i];
                const matchDate = createMatchDate(slot);

                const startTime = matchDate.getTime();
                const endTime = startTime + 25 * 60 * 1000;



                // await addDoc(collection(db, 'matches'), {
                //     week,
                //     pool: poolLabel,
                //     teamA: pool[a].name,
                //     teamB: pool[b].name,
                //     referee: pool[r].name,
                //     scoreA: 0,
                //     scoreB: 0,
                //     completed: false,
                //     startTime,
                //     endTime,
                //     gym,
                //     timeSlot: slot.time,
                //     matchNumber: i + 1,
                // });

                await createMatch(week, {
                    pool: poolLabel,
                    teamA: pool[a].name,
                    teamB: pool[b].name,
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
                }, 1);

                const userQuery = query(
                    collection(db, "users"),
                    where("name", "==", pool[r].coach)
                );
                const userSnap = await getDocs(userQuery);

                userSnap.forEach(async (docSnap) => {
                    await updateDoc(doc(db, "users", docSnap.id), {
                        role: "referee",
                    });
                });
            }
        };

        await generateFirstPeriodPoolMatches(pool1, "Gym 1", "Pool 1");
        await generateFirstPeriodPoolMatches(pool2, "Gym 2", "Pool 2");
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
                teamPoints[m.teamA] = (teamPoints[m.teamA] || 0) + m.scoreA;
                teamPoints[m.teamB] = (teamPoints[m.teamB] || 0) + m.scoreB;
            });
            console.log("Team points after first period:", teamPoints);

            // 6. Sort teams by points and split into second-period pools
            const sortedTeams = [...teams].sort((a, b) => (teamPoints[b.name] || 0) - (teamPoints[a.name] || 0));
            const pool1Teams = sortedTeams.slice(0, 3); // Positions 1, 2, 3
            const pool2Teams = sortedTeams.slice(3, 6); // Positions 4, 5, 6

            console.log("Pool 1 teams (positions 1-3):", pool1Teams.map((t, i) => `${i + 1}. ${t.name} (${teamPoints[t.name] || 0} pts)`));
            console.log("Pool 2 teams (positions 4-6):", pool2Teams.map((t, i) => `${i + 4}. ${t.name} (${teamPoints[t.name] || 0} pts)`));

            if (pool1Teams.length < 3 || pool2Teams.length < 3) {
                console.warn("Not enough teams to generate second period matches.");
                alert("Not enough teams to generate second period matches. Need at least 6 teams.");
                return;
            }

            // 7. Define match slots (later times for second period)
            const slots = [
                { time: '22:40', hour: 22, minute: 40 },
                { time: '23:00', hour: 23, minute: 0 },
                { time: '23:20', hour: 23, minute: 20 },
            ];

            const createMatchDate = (slot: { hour: number; minute: number }) => {
                const matchDate = new Date();
                matchDate.setDate(matchDate.getDate() + (week - 1) * 7);
                matchDate.setHours(slot.hour, slot.minute, 0, 0);
                return matchDate;
            };

            // 8. Helper: generate matches according to specific position-based pairing
            const generatePoolMatches = async (poolTeams: Team[], poolLabel: string, gym: string, positionOffset: number) => {
                const matchesConfig = [
                    {
                        teamAIndex: 0,  // Position 1 or 4
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
                    const matchDate = createMatchDate(slot);

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

                    await createMatch(week, {
                        pool: poolLabel,
                        teamA: teamA.name,
                        teamB: teamB.name,
                        referee: refereeTeam.name,
                        scoreA: 0,
                        scoreB: 0,
                        completed: false,
                        startTime: matchDate.getTime(),
                        endTime: matchDate.getTime() + 25 * 60 * 1000,
                        gym,
                        timeSlot: slot.time,
                        matchNumber: matchNumber,
                        isSecondPeriod: true,
                    }, 2);

                    // Assign referee role to the coach of the referee team
                    try {
                        const userQuery = query(
                            collection(db, "users"),
                            where("name", "==", refereeTeam.coach)
                        );
                        const userSnap = await getDocs(userQuery);

                        userSnap.forEach(async (docSnap) => {
                            await updateDoc(doc(db, "users", docSnap.id), {
                                role: "referee",
                            });
                        });
                    } catch (error) {
                        console.warn(`Could not assign referee role for ${refereeTeam.coach}:`, error);
                    }
                }
            };

            // 9. Generate matches for both pools with position offsets
            await generatePoolMatches(pool1Teams, "Second Period - Premier Pool", "Gym 1", 0); // Positions 1-3
            await generatePoolMatches(pool2Teams, "Second Period - Secondary Pool", "Gym 2", 3); // Positions 4-6

            // 10. Fetch updated matches and set state
            const snapshot = await getDocs(collection(db, 'matches'));
            const fetchedMatches: Match[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Match));

            console.log("Fetched matches after 2nd period generation:", fetchedMatches);
            setMatches(sortMatches(fetchedMatches));

            console.log(`✅ Second period matches generated for week ${week}`);
            alert(`Second period matches for Week ${week} generated successfully!`);

        } catch (error) {
            console.error("Error generating second period matches:", error);
            alert("Error generating second period matches. Please check the console for details.");
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

        return user.role === 'referee' && isRefereeForMatch;
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
        setTeams: Dispatch<SetStateAction<Team[]>>,
        setMatches: (value: React.SetStateAction<Match[]>) => void,
        matchId: string,
        matches: Match[],
        user: TeamUser
    ) => {
        const match = matches.find(m => m.id === matchId);
        if (!match || !canEditScore(match, user)) {
            console.log("Cannot edit match:", matchId, match);
            return alert("Cannot edit match");
        }

        console.log("Saving match result for:", matchId, match);

        const matchRef = doc(db, "matches", matchId);
        await updateDoc(matchRef, {
            scoreA: match.scoreA,
            scoreB: match.scoreB,
            completed: true,
        });

        const teamA = teams.find(t => normalizeString(t.name) === normalizeString(match.teamA));
        const teamB = teams.find(t => normalizeString(t.name) === normalizeString(match.teamB));

        console.log("Teams involved:", teamA, teamB);

        const updateTeamStats = async (team: Team | undefined, points: number) => {
            if (!team) return console.warn("No team found to update stats");

            const teamRef = doc(db, "teams", team.id);
            const updateData: Partial<Team> = {
                totalPoints: (team.totalPoints || 0) + points,
            };
            if (match.isSecondPeriod) {
                updateData.secondPeriodPoints = (team.secondPeriodPoints || 0) + points;
            } else {
                updateData.currentDayPoints = (team.currentDayPoints || 0) + points;
            }

            console.log("Updating team stats:", team.name, updateData);
            await updateDoc(teamRef, updateData);

            // Update weekly stats
            const statsQuery = query(
                collection(db, "teamWeekStats"),
                where("teamId", "==", team.id),
                where("week", "==", match.week)
            );
            const statsSnap = await getDocs(statsQuery);
            console.log("Weekly stats snap for team:", team.name, statsSnap.size);

            if (!statsSnap.empty) {
                const statDoc = statsSnap.docs[0];
                const statData = statDoc.data() as TeamWeekStats;
                console.log("Existing week stats before update:", statData);

                await updateDoc(statDoc.ref, {
                    points: (statData.points || 0) + points,
                    pointPeriodOne: match.isSecondPeriod
                        ? statData.pointPeriodOne || 0
                        : (statData.pointPeriodOne || 0) + points,
                    pointsPeriodTwo: match.isSecondPeriod
                        ? (statData.pointsPeriodTwo || 0) + points
                        : statData.pointsPeriodTwo || 0,
                });
            } else {
                const newStatRef = doc(collection(db, "teamWeekStats"));
                console.log("Creating new weekly stats for team:", team.name);
                await setDoc(newStatRef, {
                    id: newStatRef.id,
                    teamId: team.id,
                    week: match.week,
                    points,
                    pointPeriodOne: match.isSecondPeriod ? 0 : points,
                    pointsPeriodTwo: match.isSecondPeriod ? points : 0,
                    wins: 0,
                    losses: 0,
                });
            }
        };

        await updateTeamStats(teamA, match.scoreA);
        await updateTeamStats(teamB, match.scoreB);

        setTeams(teams.map(team => {
            if (team.name === match.teamA) {
                return match.isSecondPeriod
                    ? { ...team, secondPeriodPoints: (team.secondPeriodPoints || 0) + match.scoreA, totalPoints: team.totalPoints + match.scoreA }
                    : { ...team, currentDayPoints: (team.currentDayPoints || 0) + match.scoreA, totalPoints: team.totalPoints + match.scoreA };
            }
            if (team.name === match.teamB) {
                return match.isSecondPeriod
                    ? { ...team, secondPeriodPoints: (team.secondPeriodPoints || 0) + match.scoreB, totalPoints: team.totalPoints + match.scoreB }
                    : { ...team, currentDayPoints: (team.currentDayPoints || 0) + match.scoreB, totalPoints: team.totalPoints + match.scoreB };
            }
            return team;
        }));

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