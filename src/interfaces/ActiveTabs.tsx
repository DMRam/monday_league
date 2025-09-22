import type { Match, Team } from "./Dashboards";
import type { TeamUser } from "./User";

export interface ActiveTabsProps {
    activeTab: string;
    currentWeek: number;
    prevWeek: () => void;
    nextWeek: () => void;
    currentWeekMatches: Match[]
    canEditScore: (match: Match, user: TeamUser) => boolean;
    user: TeamUser | null
    updateMatchScore: (matchId: string, newScoreA: number, newScoreB: number, matches: Match[], setMatches: (value: React.SetStateAction<Match[]>) => void) => void
    saveMatchResults: any;
    matches: Match[];
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
    secondaryPool: Team[]
    premierPool: Team[];
    setActiveTab: (value: React.SetStateAction<string>) => void;
    standings: Team[]
    selectedTeam: Team | undefined;
    setSelectedTeam: React.Dispatch<React.SetStateAction<Team | undefined>>
    setTeams: any;
    teams: Team[] | undefined


}