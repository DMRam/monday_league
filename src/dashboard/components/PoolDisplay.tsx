import { FaClock } from "react-icons/fa";
import type { Team } from "../../interfaces/Dashboards";

export const PoolDisplay = ({
    title,
    teams,
    colorClass,
    pointsBgClass,
    description,
    showTime = false,
}: {
    title: string;
    teams: Team[] | undefined;
    colorClass: string;
    pointsBgClass: string;
    description?: string;
    showTime?: boolean;
}) => (
    <div className={`rounded-lg p-4 ${colorClass}`}>
        <div className="flex justify-between items-center mb-4">
            <h4 className={`font-semibold text-lg`}>{title}</h4>
            {showTime && (
                <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="mr-1" />
                    {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            )}
        </div>
        {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
        <ul className="space-y-3">
            {teams ? teams.map((team) => (
                <li
                    key={team.id}
                    className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm"
                >
                    <span className="font-medium">{team.name}</span>
                    <span className={`${pointsBgClass} px-3 py-1 rounded-full text-sm`}>
                        {team.currentDayPoints?.toString() || "0"} pts
                    </span>
                </li>
            )) : []}
        </ul>
    </div>
);