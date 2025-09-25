import { FaClock } from "react-icons/fa";
import type { Team } from "../../interfaces/Dashboards";

export const PoolDisplay = ({
    title,
    teams,
    colorClass,
    pointsBgClass,
    description,
    showTime = false,
    t
}: {
    title: string;
    teams: Team[] | undefined;
    colorClass: string;
    pointsBgClass: string;
    description?: string;
    showTime?: boolean;
    t: any;
}) => {
    // Format time based on language (24h for French, 12h for English)
    const formatTime = () => {
        const now = new Date();
        if (t.language === 'fr') {
            // Quebec French uses 24-hour format
            return now.toLocaleTimeString('fr-CA', {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        } else {
            // English uses 12-hour format with AM/PM
            return now.toLocaleTimeString('en-US', {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    };

    return (
        <div className={`rounded-lg p-4 ${colorClass}`}>
            <div className="flex justify-between items-center mb-4">
                <h4 className={`font-semibold text-lg`}>{title}</h4>
                {showTime && (
                    <div className="flex items-center text-sm text-gray-600">
                        <FaClock className="mr-1" />
                        {formatTime()}
                    </div>
                )}
            </div>
            {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
            <ul className="space-y-3">
                {teams && teams.length > 0 ? teams.map((team, index) => (
                    <li
                        key={team.id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
                    >
                        <div className="flex items-center space-x-3">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold 
                                ${index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                {index + 1}
                            </span>
                            <span className="font-medium">{team.name}</span>
                        </div>
                        <span className={`${pointsBgClass} px-3 py-1 rounded-full text-sm font-semibold`}>
                            {team.currentDayPoints?.toString() || "0"} {t.points || 'pts'}
                        </span>
                    </li>
                )) : (
                    <li className="text-center py-4 text-gray-500 text-sm">
                        {t.noTeamsInPool || 'No teams in this pool'}
                    </li>
                )}
            </ul>
        </div>
    );
};