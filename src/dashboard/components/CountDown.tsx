import { useEffect, useState } from "react";

export const CountdownTimer = ({ endTime }: { endTime: number }) => {
    const [timeLeft, setTimeLeft] = useState(endTime - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(endTime - Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [endTime]);

    if (timeLeft <= 0) return <span>Time expired</span>;

    const totalSeconds = Math.floor(timeLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Format string as HH:MM:SS or MM:SS if no hours
    const formattedTime = hours > 0
        ? `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes.toString().padStart(2, "0")}:${seconds
            .toString()
            .padStart(2, "0")}`;

    return <span>{formattedTime}</span>;
};

export default CountdownTimer;
