import { useEffect, useState } from "react";

export const CountdownTimer = ({ endTime }: { endTime: number }) => {
    const calculateTimeLeft = () => Math.max(0, endTime - Date.now());

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        if (endTime <= Date.now()) {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (timeLeft <= 0) {
        return <span className="text-gray-500">Time expired</span>;
    }

    const totalSeconds = Math.floor(timeLeft / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime =
        days > 0
            ? `${days}d ${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            : `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return (
        <span
            className={
                totalSeconds <= 60
                    ? "text-red-600 font-bold"
                    : "text-green-700 font-semibold"
            }
        >
            {formattedTime}
        </span>
    );
};

export default CountdownTimer;
