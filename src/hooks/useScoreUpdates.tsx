import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "../services/firebase"
import type { Match, WeeklyTeamStats } from "../interfaces/Dashboards"

interface Props {
    matchId: string
    teamAId: string
    teamBId: string
    scoreA: number
    scoreB: number
    week: number
    period: number
}

/**
 * Updates or inserts match data for both teams in Firestore.
 * Ensures that each matchId only appears once per team.
 */
export const updateTeamsAfterMatch = async ({
    matchId,
    teamAId,
    teamBId,
    scoreA,
    scoreB,
    week,
    period,
}: Props) => {
    const teams = [
        { id: teamAId, score: scoreA, opponentScore: scoreB },
        { id: teamBId, score: scoreB, opponentScore: scoreA },
    ]

    for (const { id, score, opponentScore } of teams) {
        const teamRef = doc(db, "teams", id)
        const teamSnap = await getDoc(teamRef)

        if (!teamSnap.exists()) {
            console.warn(`Team ${id} not found`)
            continue
        }

        const team = teamSnap.data()

        // --- Safe defaults ---
        const weeklyStats = team.weeklyStats || []
        const matchPointsPerMatch = team.matchPointsPerMatch || {}
        const weekKey = `W${week}_${matchId}`

        // --- Update or create weekly stats entry ---
        const existingWeek = weeklyStats.find((s: WeeklyTeamStats) => s.week === week)
        const win = score > opponentScore ? 1 : 0
        const loss = score < opponentScore ? 1 : 0

        if (existingWeek) {
            // Update week record
            existingWeek.firstPeriodPoints = period === 1 ? score : (existingWeek.firstPeriodPoints || 0)
            existingWeek.secondPeriodPoints = period === 2 ? score : (existingWeek.secondPeriodPoints || 0)
            existingWeek.totalPoints = (existingWeek.firstPeriodPoints || 0) + (existingWeek.secondPeriodPoints || 0)
            existingWeek.wins = (existingWeek.wins || 0) + win
            existingWeek.losses = (existingWeek.losses || 0) + loss
        } else {
            // Add new week entry
            weeklyStats.push({
                week,
                firstPeriodPoints: period === 1 ? score : 0,
                secondPeriodPoints: period === 2 ? score : 0,
                totalPoints: score,
                wins: win,
                losses: loss,
            })
        }

        // --- Update matchPointsPerMatch entry (prevent duplicates) ---
        const existingMatches = matchPointsPerMatch[weekKey] || []
        const existingIdx = existingMatches.findIndex((m: Match) => m.period === period)
        const matchEntry = {
            matchId,
            period,
            scoreA,
            scoreB,
        }

        if (existingIdx >= 0) {
            existingMatches[existingIdx] = matchEntry
        } else {
            existingMatches.push(matchEntry)
        }

        matchPointsPerMatch[weekKey] = existingMatches

        // --- Update team stats summary ---
        const totalPoints = weeklyStats.reduce((sum: number, s: WeeklyTeamStats) => sum + (s.totalPoints || 0), 0)
        const firstPeriodPoints = weeklyStats.reduce((sum: number, s: WeeklyTeamStats) => sum + (s.firstPeriodPoints || 0), 0)
        const secondPeriodPoints = weeklyStats.reduce((sum: number, s: WeeklyTeamStats) => sum + (s.secondPeriodPoints || 0), 0)

        await updateDoc(teamRef, {
            weeklyStats,
            matchPointsPerMatch,
            totalPoints,
            firstPeriodPoints,
            secondPeriodPoints,
            currentDayPoints: score,
            lastUpdatedAt: Date.now(),
        })
    }

    console.log(`✅ Match ${matchId} updated successfully for both teams`)
}
