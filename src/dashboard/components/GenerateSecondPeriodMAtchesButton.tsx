import { useState } from 'react';
import { useDashboard } from "../../hooks/useDashboard";
import type { Match, Team } from "../../interfaces/Dashboards";
import type { TeamUser } from "../../interfaces/User";

interface GenerateSecondPeriodMatchesButtonProps {
    user: TeamUser;
    currentWeek: number;
    teams: Team[];
    matches: Match[];
    setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
    t: any;
}

export const GenerateSecondPeriodMatchesButton = ({
    user,
    currentWeek,
    teams,
    matches,
    setMatches,
    t
}: GenerateSecondPeriodMatchesButtonProps) => {
    const { generateSecondPeriodMatches } = useDashboard();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | null; text: string }>({ type: null, text: '' });

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

    const handleGenerateMatches = async () => {
        setIsLoading(true);
        setMessage({ type: null, text: '' });

        try {
            await generateSecondPeriodMatches(currentWeek, teams, matches, setMatches);
            setMessage({ type: 'success', text: t.matchesGeneratedSuccess });
        } catch (error) {
            setMessage({ type: 'error', text: t.errorGeneratingMatches });
        } finally {
            setIsLoading(false);
        }
    };

    if (hasSecondPeriodMatches) {
        return (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                {t.secondPeriodMatchesAlreadyGenerated}
            </div>
        );
    }

    if (!allFirstPeriodCompleted) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {t.completeFirstPeriodMatches}
            </div>
        );
    }

    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={handleGenerateMatches}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition flex items-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t.generatingMatches}
                    </>
                ) : (
                    t.generateSecondPeriodMatches
                )}
            </button>

            {message.type && (
                <div className={`mt-2 px-4 py-2 rounded ${message.type === 'success'
                        ? 'bg-green-100 border border-green-400 text-green-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};