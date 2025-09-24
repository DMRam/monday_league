import { useDashboard } from "../../hooks/useDashboard";
import type { Match, Team } from "../../interfaces/Dashboards";
import type { TeamUser } from "../../interfaces/User";

interface GenerateSecondPeriodMatchesButtonProps {
    user: TeamUser;
    currentWeek: number;
    teams: Team[];
    matches: Match[];
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}

export const GenerateSecondPeriodMatchesButton = ({
    user,
    currentWeek,
    teams,
    matches,
    setMatches
}: GenerateSecondPeriodMatchesButtonProps) => {
    const { generateSecondPeriodMatches } = useDashboard();

    console.log("Teams for second period: ", teams);

    if (user?.role !== 'admin') return null;

    // Check if first period matches are completed
    const firstPeriodMatches = matches.filter(
        m => m.week === currentWeek && m.timeSlot <= "21:30"
    );
    const allFirstPeriodCompleted = firstPeriodMatches.every(m => m.completed);
    const hasSecondPeriodMatches = matches.some(
        m => m.week === currentWeek && m.timeSlot >= "21:50"
    );

    if (hasSecondPeriodMatches) {
        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                Second period matches already generated
            </div>
        );
    }

    if (!allFirstPeriodCompleted) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                Complete all first period matches before generating second period
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() =>
                generateSecondPeriodMatches(currentWeek, teams, matches, setMatches)
            }
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition mb-4"
        >
            Generate Second Period Matches
        </button>
    );
};