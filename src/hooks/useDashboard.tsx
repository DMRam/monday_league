// hooks/useDashboard.ts
import React, { type Dispatch, type SetStateAction } from 'react'
import { db } from '../services/firebase';
import type { Match, Team, TeamWeekStats } from '../interfaces/Dashboards';
import type { TeamUser } from '../interfaces/User';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";

type SetString = Dispatch<SetStateAction<string>>;
type SetStringArray = Dispatch<SetStateAction<string[]>>;

export const useDashboard = () => {
    // Normalize string for logins
    const normalizeString = (str?: string): string => {
        if (!str) return '';
        return str.toLowerCase().trim().replace(/\s+/g, '');
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





    // Generate matches for all weeks
    const generateMatches = async (teams: Team[], matches: Match[], weeksToGenerate: number, setShowMatchCreation: (value: React.SetStateAction<boolean>) => void, setMatches: (value: React.SetStateAction<Match[]>) => void) => {
        if (teams.length < 6) {
            alert("You need at least 6 teams to generate matches");
            return;
        }

        try {
            // Clear existing matches for these weeks
            const existingMatches = matches.filter(m => m.week <= weeksToGenerate);
            const deletePromises = existingMatches.map(match =>
                updateDoc(doc(db, 'matches', match.id), { deleted: true })
            );
            await Promise.all(deletePromises);

            // Generate matches for each week
            for (let week = 1; week <= weeksToGenerate; week++) {
                await generateMatchesForWeek(week, teams);
            }

            alert(`Successfully generated matches for ${weeksToGenerate} weeks`);
            setShowMatchCreation(false);

            // Refresh matches
            const snapshot = await getDocs(collection(db, 'matches'));
            const fetchedMatches: Match[] = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Match))
                .filter(match => !match.completed);

            setMatches(sortMatches(fetchedMatches));
        } catch (error) {
            console.error("Error generating matches:", error);
            alert("Error generating matches");
        }
    };

    const generateMatchesForWeek = async (week: number, teams: Team[]) => {
        if (teams.length < 6) {
            throw new Error("Need at least 6 teams to generate matches");
        }

        const shuffled = [...teams].sort(() => Math.random() - 0.5);
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
                const endTime = startTime + 20 * 60 * 1000;

                await addDoc(collection(db, 'matches'), {
                    week,
                    pool: poolLabel,
                    teamA: pool[a].name,
                    teamB: pool[b].name,
                    referee: pool[r].coach,
                    scoreA: 0,
                    scoreB: 0,
                    completed: false,
                    startTime,
                    endTime,
                    gym,
                    timeSlot: slot.time,
                    matchNumber: i + 1,
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
        console.log("Week:", week);

        // Filter first-period matches
        const firstPeriodMatches = matches.filter(m => m.week === week && !m.isSecondPeriod);
        console.log("First-period matches:", firstPeriodMatches);

        // Ensure all first-period matches are completed
        const allFirstPeriodDone = firstPeriodMatches.every(m => m.completed);
        console.log("All first-period matches completed?", allFirstPeriodDone);
        if (!allFirstPeriodDone) return;

        // Calculate points for each team
        const teamPoints: Record<string, number> = {};
        firstPeriodMatches.forEach(m => {
            teamPoints[m.teamA] = (teamPoints[m.teamA] || 0) + m.scoreA;
            teamPoints[m.teamB] = (teamPoints[m.teamB] || 0) + m.scoreB;
        });
        console.log("Team points after first period:", teamPoints);

        // Sort teams by points and split into second-period pools
        const sortedTeams = [...teams].sort((a, b) => (teamPoints[b.name] || 0) - (teamPoints[a.name] || 0));
        const pool1Teams = sortedTeams.slice(0, 3);
        const pool2Teams = sortedTeams.slice(3, 6);

        console.log("Pool 1 teams for second period:", pool1Teams.map(t => t.name));
        console.log("Pool 2 teams for second period:", pool2Teams.map(t => t.name));

        if (pool1Teams.length < 3 || pool2Teams.length < 3) {
            console.warn("Not enough teams to generate second period matches.");
            return;
        }

        // Define match slots
        const slots = [
            { time: '21:50', hour: 21, minute: 50 },
            { time: '22:10', hour: 22, minute: 10 },
            { time: '22:30', hour: 22, minute: 30 },
        ];

        const createMatchDate = (slot: { hour: number; minute: number }) => {
            const matchDate = new Date();
            matchDate.setDate(matchDate.getDate() + (week - 1) * 7);
            matchDate.setHours(slot.hour, slot.minute, 0, 0);
            return matchDate;
        };

        // Helper: generate matches within a pool
        const generatePoolMatches = async (poolTeams: Team[], poolLabel: string, gym: string) => {
            const combos = [
                [0, 1, 2],
                [1, 2, 0],
                [2, 0, 1],
            ];

            for (let i = 0; i < combos.length; i++) {
                const [a, b, r] = combos[i];
                const slot = slots[i];
                const matchDate = createMatchDate(slot);
                console.log(`Creating match in ${poolLabel}:`, {
                    teamA: poolTeams[a].name,
                    teamB: poolTeams[b].name,
                    referee: poolTeams[r].name,
                    time: slot.time
                });

                await addDoc(collection(db, 'matches'), {
                    week,
                    pool: poolLabel,
                    teamA: poolTeams[a].name,
                    teamB: poolTeams[b].name,
                    referee: poolTeams[r].coach,
                    scoreA: 0,
                    scoreB: 0,
                    completed: false,
                    startTime: matchDate.getTime(),
                    endTime: matchDate.getTime() + 20 * 60 * 1000,
                    gym,
                    timeSlot: slot.time,
                    matchNumber: i + 1,
                    isSecondPeriod: true
                });
            }
        };

        await generatePoolMatches(pool1Teams, "Second Period - Pool 1", "Gym 1");
        await generatePoolMatches(pool2Teams, "Second Period - Pool 2", "Gym 2");

        // Fetch updated matches and set state
        const snapshot = await getDocs(collection(db, 'matches'));
        const fetchedMatches: Match[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as Match));
        console.log("Fetched matches after 2nd period generation:", fetchedMatches);

        setMatches(sortMatches(fetchedMatches));
    };

    // Match editing with referee team validation
    const canEditScore = (match: Match, user: TeamUser): boolean => {


        console.log('User on CanEdit Function: ', user)
        if (user.role === 'admin') return true;

        const normalizedUserTeam = normalizeString(user.team);
        const normalizedTeamA = normalizeString(match.teamA);
        const normalizedTeamB = normalizeString(match.teamB);
        const normalizedReferee = normalizeString(match.referee);

        const isRefereeTeam =
            normalizedUserTeam === normalizedTeamA ||
            normalizedUserTeam === normalizedTeamB ||
            normalizedUserTeam === normalizedReferee;

        return user.role === 'referee' && isRefereeTeam;
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