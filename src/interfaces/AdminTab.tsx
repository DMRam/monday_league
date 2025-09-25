import type { Dispatch, SetStateAction } from "react";
import type { Team, Match } from "./Dashboards";

// Create type aliases for better readability
type SetString = Dispatch<SetStateAction<string>>;
type SetStringArray = Dispatch<SetStateAction<string[]>>;
type SetMatchArray = Dispatch<SetStateAction<Match[]>>;
type SetBoolean = Dispatch<SetStateAction<boolean>>;
type SetNumber = Dispatch<SetStateAction<number>>;

export interface AdminTabProps {
    newTeamName: string
    setNewTeamName: SetString;
    newCoach: string
    setNewCoach: SetString;
    newTeamPool: string
    setNewTeamPool: SetString;
    newPlayerName: string
    setNewPlayerName: SetString;
    addPlayerToTeamForm: (newPlayerName: string, newPlayers: string[], setNewPlayers: SetStringArray, setNewPlayerName: SetString) => void;
    newPlayers: string[],
    setNewPlayers: SetStringArray;
    removePlayerFromTeamForm: (index: number, newPlayers: string[], setNewPlayers: SetStringArray) => void;

    // Simplified with type aliases
    addTeam: (
        setNewPlayers: SetStringArray,
        setNewPlayerName: SetString,
        setNewTeamPool: SetString,
        setNewCoach: SetString,
        setNewTeamName: SetString,
        newTeamName: string,
        newCoach: string,
        newPlayers: string[],
        newTeamPool: string,
        setTeams: any,
        teams: Team[]
    ) => Promise<void>;

    setShowMatchCreation: SetBoolean;
    showMatchCreation: boolean;
    weeksToGenerate: number;
    setWeeksToGenerate: SetNumber;
    generateMatches: (teams: Team[], matches: Match[], weeksToGenerate: number, setShowMatchCreation: SetBoolean, setMatches: SetMatchArray) => Promise<void>;

    setTeams: any;
    teams: Team[] | undefined;
    setMatches: SetMatchArray;
    matches: Match[];
    t:any
}