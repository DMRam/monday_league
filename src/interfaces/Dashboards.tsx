export interface Team {
    id: string;
    name: string;
    totalPoints: number;
    firstPeriodPoints?: number;
    pool: string;
    coach: string;
    players: string[];
    currentDayPoints: number;
    secondPeriodPoints?: number;
    weeklyStats?: WeeklyTeamStats[];
}

export interface WeeklyTeamStats {
    week: number;
    firstPeriodPoints: number;
    secondPeriodPoints: number;
    totalPoints: number;
    wins: number;
    losses: number;
}

export interface Match {
    id: string;
    week: number;
    pool: string;
    teamA: Team;
    teamB: Team;
    scoreA: number;
    scoreB: number;
    completed: boolean;
    referee: string;
    startTime: number;
    endTime: number;
    gym: string;
    timeSlot: string;
    isSecondPeriod: boolean
    savedAt?: number;
    savedBy?: string;
    createdAt: number;
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

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: string[]; 
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
}