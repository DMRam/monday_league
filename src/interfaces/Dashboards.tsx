export interface Team {
    id: string;
    name: string;
    totalPoints: number;
    pool: string;
    coach: string;
    players: string[];
    currentDayPoints: number;
    secondPeriodPoints?: number;
}


export interface Match {
    id: string;
    week: number;
    pool: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    completed: boolean;
    referee: string;
    startTime: number;
    endTime: number;
    gym: string;
    timeSlot: string;
    isSecondPeriod: boolean
}

export interface TeamWeekStats {
    id: string;
    teamId: string;
    week: number;
    points: number;
    pointPeriodOne: number;
    pointsPeriodTwo: number;
    wins: number;
    losses: number;
}
