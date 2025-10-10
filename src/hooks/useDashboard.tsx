import React, { type Dispatch, type SetStateAction } from 'react'
import { db } from '../services/firebase';
import type { Match, Team } from '../interfaces/Dashboards';
import type { TeamUser } from '../interfaces/User';
import { doc, updateDoc, setDoc, collection, getDocs, addDoc, query, where, getDoc, DocumentReference } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { onSnapshot } from "firebase/firestore";

type SetString = Dispatch<SetStateAction<string>>;
type SetStringArray = Dispatch<SetStateAction<string[]>>;

// Extend Window interface for matchSaveTimeouts
declare global {
    interface Window {
        matchSaveTimeouts: Record<string, ReturnType<typeof setTimeout>>;
    }
}

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

    // === Real-time Sync ===
    const listenToMatches = (
        setMatches: (value: React.SetStateAction<Match[]>) => void
    ) => {
        const matchesRef = collection(db, "matches");

        return onSnapshot(matchesRef, (snapshot) => {
            const matchesData: Match[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Match));

            setMatches(sortMatches(matchesData));
        });
    };

    const listenToTeams = (
        setTeams: (value: React.SetStateAction<Team[]>) => void
    ) => {
        const teamsRef = collection(db, "teams");

        return onSnapshot(teamsRef, (snapshot) => {
            const teamsData: Team[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Team));

            // Sort teams by points descending for better leaderboard UX
            setTeams(teamsData.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0)));
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
        _teams: Team[],
        setMatches: (value: React.SetStateAction<Match[]>) => void
    ) => {
        console.log("=== Generating Second Period Matches ===");
        console.log("Target week:", week);

        // Check Firebase directly if second period matches already exist
        const secondPeriodMatchesQuery = query(
            collection(db, "matches"),
            where("week", "==", week),
            where("isSecondPeriod", "==", true)
        );

        const secondPeriodMatchesSnapshot = await getDocs(secondPeriodMatchesQuery);

        if (secondPeriodMatchesSnapshot.size > 0) {
            console.log(`Second period matches for week ${week} already exist in Firebase. Aborting generation.`);
            return;
        }

        console.log(`Generating second period matches for week ${week}...`);

        try {
            // 1. Get fresh data for this specific operation to avoid stale state
            const [freshTeamsSnapshot, freshMatchesSnapshot] = await Promise.all([
                getDocs(collection(db, 'teams')),
                getDocs(query(collection(db, 'matches'), where('week', '==', week)))
            ]);

            // Process fresh teams data
            const freshTeams: Team[] = freshTeamsSnapshot.docs
                .filter(doc => {
                    const data = doc.data();
                    const isValid = data.name && data.coach;
                    if (!isValid) {
                        console.warn(`Skipping invalid team document: ${doc.id}`);
                    }
                    return isValid;
                })
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name,
                        totalPoints: data.totalPoints || 0,
                        pool: data.pool || 'Unassigned',
                        coach: data.coach,
                        players: data.players || [],
                        currentDayPoints: data.currentDayPoints || 0,
                        secondPeriodPoints: data.secondPeriodPoints || 0,
                        weeklyStats: data.weeklyStats || []
                    } as Team;
                });

            console.log("Fresh teams from Firebase:", freshTeams.map(t => `${t.name} (ID: ${t.id})`));

            // 2. Validate that we have enough teams
            if (freshTeams.length < 6) {
                console.warn("Not enough teams to generate second period matches. Need at least 6 teams.");
                alert("Not enough teams to generate second period matches. Need at least 6 teams.");
                return;
            }

            const freshMatches = freshMatchesSnapshot.docs.map(doc => doc.data());
            console.log("Fresh matches from Firebase:", freshMatches.length);

            // 3. Check if first period matches exist for this week
            const firstPeriodMatches = freshMatches.filter(m =>
                m.week === week && !m.isSecondPeriod
            );

            console.log(`First-period matches for week ${week}:`, firstPeriodMatches.length);

            if (firstPeriodMatches.length === 0) {
                console.log(`❌ No first period matches found for week ${week}. Generate first period matches first.`);
                alert(`Please generate first period matches for Week ${week} before generating second period matches.`);
                return;
            }

            // 4. Check if all first-period matches are completed
            const allFirstPeriodDone = firstPeriodMatches.every(m => m.completed);
            console.log("All first-period matches completed?", allFirstPeriodDone);

            if (!allFirstPeriodDone) {
                console.log("❌ Not all first period matches are completed yet");
                alert("Please complete all first period matches before generating second period matches.");
                return;
            }

            // 5. Calculate current week first-period points using FRESH teams data
            console.log("Calculating team first-period points from weeklyStats using fresh data...");

            const teamPoints: Record<string, number> = {};

            freshTeams.forEach(team => {
                const currentWeekStats = team.weeklyStats?.find(w => w.week === week);
                const points = currentWeekStats?.firstPeriodPoints || 0;
                teamPoints[team.id] = points;

                console.log(`Team ${team.name} (${team.id}): ${points} pts`);
            });

            console.log("✅ Team points (current week P1):", teamPoints);

            // 6. Sort teams by points using the fresh data
            const sortedTeams = [...freshTeams].sort((a, b) => {
                const pointsA = teamPoints[a.id] || 0;
                const pointsB = teamPoints[b.id] || 0;

                // Secondary sort by name if points are equal, to ensure consistent ordering
                if (pointsA === pointsB) {
                    return a.name.localeCompare(b.name);
                }

                return pointsB - pointsA;
            });

            console.log("Teams sorted by points:", sortedTeams.map(t => `${t.name}: ${teamPoints[t.id] || 0} pts`));

            // 7. Validate the sorting by logging each step
            console.log("=== VALIDATION ===");
            sortedTeams.forEach((team, index) => {
                console.log(`${index + 1}. ${team.name}: ${teamPoints[team.id]} pts (ID: ${team.id})`);
            });

            const pool1Teams = sortedTeams.slice(0, 3); // Positions 1, 2, 3
            const pool2Teams = sortedTeams.slice(3, 6); // Positions 4, 5, 6

            console.log("Pool 1 teams (positions 1-3):", pool1Teams.map((t, i) => `${i + 1}. ${t.name} (${teamPoints[t.id] || 0} pts)`));
            console.log("Pool 2 teams (positions 4-6):", pool2Teams.map((t, i) => `${i + 4}. ${t.name} (${teamPoints[t.id] || 0} pts)`));

            // 8. Double-check the team IDs and points
            console.log("=== TEAM ID VERIFICATION ===");
            pool1Teams.forEach((team, index) => {
                console.log(`Pool1[${index}]: ${team.name} (ID: ${team.id}) - Points: ${teamPoints[team.id]}`);
            });
            pool2Teams.forEach((team, index) => {
                console.log(`Pool2[${index}]: ${team.name} (ID: ${team.id}) - Points: ${teamPoints[team.id]}`);
            });

            if (pool1Teams.length < 3 || pool2Teams.length < 3) {
                console.warn("Not enough teams to generate second period matches.");
                alert("Not enough teams to generate second period matches. Need at least 6 teams.");
                return;
            }

            // 9. Define match slots (later times for second period)
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

            // 10. Helper: generate matches according to specific position-based pairing
            const generatePoolMatches = async (poolTeams: Team[], poolLabel: string, gym: string, positionOffset: number) => {
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

                    console.log(`✅ Created second period match ${i + 1} in ${poolLabel}`);
                    console.log("***---*** ", {
                        pool: poolLabel,
                        teamA: teamA.name,
                        teamB: teamB.name,
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
                    });
                }
            };

            // 11. Generate matches for both pools with position offsets
            await generatePoolMatches(pool1Teams, "Pool 1", "Gym 1", 0); // Positions 1-3
            await generatePoolMatches(pool2Teams, "Pool 2", "Gym 2", 3); // Positions 4-6

            // 12. Fetch updated matches and set state
            const snapshot = await getDocs(collection(db, 'matches'));
            const fetchedMatches: Match[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Match));

            console.log("Fetched matches after 2nd period generation:", fetchedMatches);
            setMatches(sortMatches(fetchedMatches));

            console.log(`✅ Second period matches generated for week ${week}`);
            alert(`Second period matches for Week ${week} generated successfully!`);

            return true;

        } catch (error) {
            console.error("Error generating second period matches:", error);
            alert("Error generating second period matches. Please check the console for details.");
        }
    };

    // Match editing with referee team validation
    const canEditScore = (match: Match, user: TeamUser): boolean => {
        console.log('User on canEditScore:', user);

        // Admin can always edit
        if (user.role === 'admin') return true;

        // Define all match-related team names
        const matchTeams = [match.teamA.name, match.teamB.name, match.referee];

        // Check if user's team is one of those
        const isRelatedToMatch = matchTeams.includes(user.team);

        console.log("user.name:", user.name);
        console.log("user.team:", user.team);
        console.log("match.referee:", match.referee);
        console.log("match.teamA:", match.teamA.name);
        console.log("match.teamB:", match.teamB.name);
        console.log("isRelatedToMatch:", isRelatedToMatch);

        return isRelatedToMatch;
    };

    const updateMatchScore = (
        matchId: string,
        newScoreA: number,
        newScoreB: number,
        matches: Match[],
        setMatches: (value: React.SetStateAction<Match[]>) => void,
        teams: Team[],
        user: TeamUser,
        _updatedTeam: 'A' | 'B',
        setSaving: (value: boolean) => void,
        setTeams?: (value: React.SetStateAction<Team[]>) => void,
    ) => {

        setSaving(true);
        // Create the updated matches array first
        const updatedMatches = matches.map(m =>
            m.id === matchId ? { ...m, scoreA: newScoreA, scoreB: newScoreB } : m
        );

        // Find the updated match from the NEW array
        const updatedMatch = updatedMatches.find(m => m.id === matchId);
        if (!updatedMatch) return;

        // Update the state
        // setMatches(updatedMatches);

        // Clear any existing timeout for this match
        if (window.matchSaveTimeouts) {
            clearTimeout(window.matchSaveTimeouts[matchId]);
        } else {
            window.matchSaveTimeouts = {};
        }

        console.log("UPDATING!!!!!")

        // Debounce: wait 2s before saving to Firebase
        window.matchSaveTimeouts[matchId] = setTimeout(async () => {
            try {
                await saveMatchResults(teams, setMatches, matchId, updatedMatches, user, setSaving, setTeams);
            } catch (err) {
                console.error("Error saving match:", err);
            } finally {
                setSaving(false);
            }
            delete window.matchSaveTimeouts[matchId];
        }, 2000);
    };

    const saveMatchResults = async (
        teams: Team[],
        _setMatches: (value: React.SetStateAction<Match[]>) => void,
        matchId: string,
        updatedMatches: Match[],
        user: TeamUser,
        setSaving: (value: boolean) => void,
        setTeams?: (value: React.SetStateAction<Team[]>) => void

    ) => {

        const currentMatch = updatedMatches.find(m => m.id === matchId);

        console.log("🔍 Debug canEditScore check:");
        console.log("currentMatch:", currentMatch);
        console.log("user:", user);

        if (!currentMatch) {
            console.log("❌ No current match found");
            return alert("Cannot edit match");
        }

        const canEdit = canEditScore(currentMatch, user);
        console.log("canEditScore result:", canEdit);

        if (!canEdit) {
            console.log("❌ User cannot edit this match");
            return alert("Cannot edit match");
        }
        if (!currentMatch || !canEditScore(currentMatch, user)) return alert("Cannot edit match");

        const teamA = teams.find(t => normalizeString(t.id) === normalizeString(currentMatch.teamA.id));
        const teamB = teams.find(t => normalizeString(t.id) === normalizeString(currentMatch.teamB.id));

        if (!teamA || !teamB) return console.error("Missing teamA or teamB");

        const isTeamAWinner = currentMatch.scoreA > currentMatch.scoreB;
        const isTeamBWinner = currentMatch.scoreB > currentMatch.scoreA;
        const isTie = currentMatch.scoreA === currentMatch.scoreB;

        let updatedTeamA: Team | null = null;
        let updatedTeamB: Team | null = null;

        const updateTeamStats = async (
            match: Match,
            pointsTeamA: number,
            pointsTeamB: number,
            isTeamAWinner: boolean,
            isTeamBWinner: boolean,
            isTeamALoser: boolean,
            isTeamBLoser: boolean
        ) => {
            const teamRefTeamA = doc(db, "teams", match.teamA.id);
            const teamRefTeamB = doc(db, "teams", match.teamB.id);

            const teamASnap = await getDoc(teamRefTeamA);
            const teamBSnap = await getDoc(teamRefTeamB);

            const existingDataA = teamASnap.exists() ? teamASnap.data() : {};
            const existingDataB = teamBSnap.exists() ? teamBSnap.data() : {};

            // Helper function to update a single team's stats
            const updateSingleTeamStats = async (
                teamRef: DocumentReference,
                existingData: any,
                teamId: string,
                isThisTeamA: boolean,
                points: number,
                isWinner: boolean,
                isLoser: boolean
            ): Promise<Team> => {
                const existingWeeklyStats = existingData.weeklyStats ? [...existingData.weeklyStats] : [];
                const weekIndex = existingWeeklyStats.findIndex(ws => ws.week === match.week);

                // Store the scores with team identification
                const matchData = {
                    period: match.isSecondPeriod ? 2 : 1,
                    scoreA: pointsTeamA,
                    scoreB: pointsTeamB,
                    teamAId: match.teamA.id,
                    teamBId: match.teamB.id,
                    thisTeamId: teamId,
                    thisTeamIsTeamA: isThisTeamA,
                };

                if (weekIndex >= 0) {
                    const weekStats = { ...existingWeeklyStats[weekIndex] };
                    const existingMatchPoints = { ...(weekStats.matchPointsPerMatch || {}) };

                    // Get existing periods for this specific match ID
                    const existingPeriods = existingMatchPoints[match.id] || [];

                    // Find if this specific period already exists for this match
                    const periodIndex = existingPeriods.findIndex((mp: any) => mp.period === matchData.period);

                    let updatedPeriods;
                    if (periodIndex >= 0) {
                        // Update existing period for this specific match
                        updatedPeriods = [...existingPeriods];
                        updatedPeriods[periodIndex] = matchData;
                    } else {
                        // Add new period for this specific match (different match, same period)
                        updatedPeriods = [...existingPeriods, matchData];
                    }

                    // Calculate TOTAL points for this week from ALL matches
                    let totalWeekPoints = 0;
                    let firstPeriodPoints = 0;
                    let secondPeriodPoints = 0;
                    let wins = 0;
                    let losses = 0;

                    // Calculate from all matches in this week
                    const allMatchPoints = { ...existingMatchPoints, [match.id]: updatedPeriods };

                    Object.values(allMatchPoints).forEach((periods: any) => {
                        periods.forEach((periodData: any) => {
                            // Only count points if this period data belongs to our team
                            if (periodData.thisTeamId === teamId) {
                                const periodPoints = periodData.thisTeamIsTeamA ? periodData.scoreA : periodData.scoreB;
                                const isWin = periodData.thisTeamIsTeamA ?
                                    periodData.scoreA > periodData.scoreB :
                                    periodData.scoreB > periodData.scoreA;
                                const isLoss = periodData.thisTeamIsTeamA ?
                                    periodData.scoreA < periodData.scoreB :
                                    periodData.scoreB < periodData.scoreA;

                                totalWeekPoints += periodPoints;

                                if (periodData.period === 1) {
                                    firstPeriodPoints += periodPoints;
                                } else if (periodData.period === 2) {
                                    secondPeriodPoints += periodPoints;
                                }

                                if (isWin) wins += 1;
                                if (isLoss) losses += 1;
                            }
                        });
                    });

                    existingWeeklyStats[weekIndex] = {
                        ...weekStats,
                        totalPoints: totalWeekPoints,
                        firstPeriodPoints: firstPeriodPoints,
                        secondPeriodPoints: secondPeriodPoints,
                        wins: wins,
                        losses: losses,
                        matchPointsPerMatch: allMatchPoints,
                    };
                } else {
                    // First time adding stats for this week
                    const totalPoints = points || 0;
                    const firstPeriodPoints = !match.isSecondPeriod ? totalPoints : 0;
                    const secondPeriodPoints = match.isSecondPeriod ? totalPoints : 0;

                    existingWeeklyStats.push({
                        week: match.week,
                        totalPoints: totalPoints,
                        firstPeriodPoints: firstPeriodPoints,
                        secondPeriodPoints: secondPeriodPoints,
                        wins: isWinner ? 1 : 0,
                        losses: isLoser ? 1 : 0,
                        matchPointsPerMatch: {
                            [match.id]: [matchData],
                        },
                    });
                }

                // Update total points correctly by calculating from all weekly stats
                const finalTotalPoints = existingWeeklyStats.reduce((total, week) => total + (week.totalPoints || 0), 0);

                const updateData = {
                    totalPoints: finalTotalPoints,
                    weeklyStats: existingWeeklyStats,
                    lastUpdatedAt: Date.now(),
                };

                await updateDoc(teamRef, updateData);
                console.log(`✅ Updated Firestore for team ${teamId}`);

                // Return the complete updated team object
                return {
                    id: teamId,
                    name: existingData.name || '',
                    totalPoints: finalTotalPoints,
                    pool: existingData.pool || '',
                    coach: existingData.coach || '',
                    players: existingData.players || [],
                    currentDayPoints: existingData.currentDayPoints || 0,
                    firstPeriodPoints: existingData.firstPeriodPoints || 0,
                    secondPeriodPoints: existingData.secondPeriodPoints || 0,
                    weeklyStats: existingWeeklyStats,
                } as Team;
            };

            // Update both teams
            const [newTeamA, newTeamB] = await Promise.all([
                updateSingleTeamStats(teamRefTeamA, existingDataA, match.teamA.id, true, pointsTeamA, isTeamAWinner, isTeamALoser),
                updateSingleTeamStats(teamRefTeamB, existingDataB, match.teamB.id, false, pointsTeamB, isTeamBWinner, isTeamBLoser)
            ]);

            updatedTeamA = newTeamA;
            updatedTeamB = newTeamB;
        };

        // Call the updateTeamStats function
        await updateTeamStats(
            currentMatch,
            currentMatch.scoreA,
            currentMatch.scoreB,
            isTeamAWinner,
            isTeamBWinner,
            !isTeamAWinner && !isTie,
            !isTeamBWinner && !isTie
        );

        // Update match document itself
        const matchRef = doc(db, "matches", matchId);
        await updateDoc(matchRef, {
            scoreA: currentMatch.scoreA,
            scoreB: currentMatch.scoreB,
            updatedAt: Date.now(),
        });

        console.log("✅ Match and both teams updated successfully!");


        // This close the volleyball loading...
        setSaving(false)

        // Update local teams state if setTeams function is provided
        if (setTeams && updatedTeamA && updatedTeamB) {
            setTeams(prevTeams =>
                prevTeams.map(team => {
                    if (team.id === updatedTeamA!.id) return updatedTeamA!;
                    if (team.id === updatedTeamB!.id) return updatedTeamB!;
                    return team;
                })
            );
            console.log("✅ Updated local teams state");
        }

        if (!currentMatch.isSecondPeriod) {
            await handleFirstPeriodCompletion(
                currentMatch.week,
                updatedMatches,
                _setMatches,
                teams,
                user
            );
        } else {
            markSecondPeriodMatchesAsCompleted(
                currentMatch.week,
                updatedMatches,
                _setMatches,
            )
        }
    };


    const handleFirstPeriodCompletion = async (
        week: number,
        matches: Match[],
        setMatches: any,
        teams: Team[],
        _user: TeamUser
    ) => {
        try {
            // Check Firebase directly if second period matches already exist
            const secondPeriodMatchesQuery = query(
                collection(db, "matches"),
                where("week", "==", week),
                where("isSecondPeriod", "==", true)
            );

            const secondPeriodMatchesSnapshot = await getDocs(secondPeriodMatchesQuery);
            const existingSecondPeriodMatches = secondPeriodMatchesSnapshot.docs.map(doc => doc.data());

            // Check if all first period matches have scores entered (both scores > 0)
            const firstPeriodMatches = matches.filter(m =>
                m.week === week && !m.isSecondPeriod
            );

            // Check if all 6 matches have both scores higher than 0
            const allFirstPeriodDone = firstPeriodMatches.every(m =>
                m.scoreA > 0 && m.scoreB > 0
            );

            console.log("All first-period matches have scores > 0?", allFirstPeriodDone);
            console.log("First period matches status:", firstPeriodMatches.map(m => ({
                id: m.id,
                scoreA: m.scoreA,
                scoreB: m.scoreB,
                completed: m.completed
            })));

            if (!allFirstPeriodDone) {
                console.log("Not all first period matches have scores entered yet");
                return; // Don't proceed if not all matches have scores
            }

            if (existingSecondPeriodMatches.length > 0) {
                console.log("Second period matches already exist in Firebase for week", week, "- skipping generation");

                await markFirstPeriodMatchesAsCompleted(week, matches, setMatches);

                alert(`First period matches for Week ${week} are completed! Second period matches already exist.`);

                window.location.reload();
                return;
            }


            console.log("No second period matches found in Firebase - proceeding with generation");

            // Mark first period matches as completed
            await markFirstPeriodMatchesAsCompleted(week, matches, setMatches);

            console.log("All first period matches completed for week", week, "- generating second period matches...");
            await generateSecondPeriodMatches(week, teams, setMatches);
            console.log("Returned from generating second period matches");

            alert(`All first period matches for Week ${week} are completed! Second period matches have been generated.`);

        } catch (error) {
            console.error("Error handling first period completion:", error);
            alert("Error completing first period matches. Please try again.");
        }
    };

    const markFirstPeriodMatchesAsCompleted = async (week: number, matches: Match[], setMatches: any) => {
        // Set Matches to completed on Firebase for all first period matches of this week
        const completionPromises = matches.map(async m => {
            if (m.week === week && !m.isSecondPeriod && !m.completed) {
                const matchRef = doc(db, "matches", m.id);
                console.log("Setting match to completed:", m.id);
                await updateDoc(matchRef, { completed: true });
            }
        });

        await Promise.all(completionPromises);

        // Set Matches to completed in state for all first period matches of this week
        console.log("Setting all first period matches to completed for week", week);
        const updatedMatches = matches.map(m => {
            if (m.week === week && !m.isSecondPeriod) {
                return { ...m, completed: true };
            }
            return m;
        });

        setMatches(updatedMatches);
        console.log("All first period matches marked as completed for week", week);
    };

    const markSecondPeriodMatchesAsCompleted = async (week: number, matches: Match[], setMatches: any) => {
        // Get only second period matches for this week
        const secondPeriodMatches = matches.filter(m =>
            m.week === week && m.isSecondPeriod
        );

        // Check if all second period matches have scores entered
        const allSecondPeriodDone = secondPeriodMatches.every(m =>
            m.scoreA > 0 && m.scoreB > 0
        );

        console.log("All second period matches have scores > 0?", allSecondPeriodDone);

        if (!allSecondPeriodDone) {
            console.log("Not all second period matches have scores entered yet");
            return; // Don't mark as completed if not all scores are entered
        }

        // Set Matches to completed on Firebase for all second period matches of this week
        const completionPromises = secondPeriodMatches.map(async m => {
            if (!m.completed) {
                const matchRef = doc(db, "matches", m.id);
                console.log("Setting second period match to completed:", m.id);
                await updateDoc(matchRef, { completed: true });
            }
        });

        await Promise.all(completionPromises);

        // Set Matches to completed in state for all second period matches of this week
        console.log("Setting all second period matches to completed for week", week);
        const updatedMatches = matches.map(m => {
            if (m.week === week && m.isSecondPeriod && !m.completed) {
                return { ...m, completed: true };
            }
            return m;
        });

        setMatches(updatedMatches);
        console.log("All second period matches marked as completed for week", week);
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
        generateSecondPeriodMatches,
        listenToMatches,
        listenToTeams
    }
}