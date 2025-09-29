// CountdownTimer.tsx
import { useEffect, useState, type JSX } from "react";

interface CountdownTimerProps {
    startTime: number;
    endTime: number;
    compact?: boolean;
    renderTime?: (msLeft: number) => JSX.Element; 
}

export const CountdownTimer = ({
    endTime,
    renderTime,
}: CountdownTimerProps) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    const msLeft = Math.max(0, endTime - now);

    // Use custom render if provided
    if (renderTime) {
        return renderTime(msLeft);
    }

    // default formatted time
    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = hours > 0
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return <span className="text-blue-600 font-semibold">{formattedTime}</span>;
};
