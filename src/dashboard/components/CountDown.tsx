// CountdownTimer.tsx
import { useEffect, useState, type JSX } from "react";

interface CountdownTimerProps {
    startTime: number;
    endTime: number;
    compact?: boolean;
    renderTime?: (msLeft: number, countdownType: 'starts' | 'ends' | 'ended') => JSX.Element; 
}

export const CountdownTimer = ({
    startTime,
    endTime,
    renderTime,
}: CountdownTimerProps) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Smart countdown logic - FIXED VERSION
    let msLeft: number;
    let countdownType: 'starts' | 'ends' | 'ended';

    const currentTime = now;

    if (currentTime < startTime) {
        // Match hasn't started yet - count to start time
        msLeft = Math.max(0, startTime - currentTime);
        countdownType = 'starts';
    } else if (currentTime >= startTime && currentTime < endTime) {
        // Match is ongoing - count to end time
        msLeft = Math.max(0, endTime - currentTime);
        countdownType = 'ends';
    } else {
        // Match has ended
        msLeft = 0;
        countdownType = 'ended';
    }

    console.log('🕒 Countdown State:', {
        currentTime: new Date(currentTime).toISOString(),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        msLeft,
        countdownType,
        timeUntilStart: startTime - currentTime,
        timeUntilEnd: endTime - currentTime
    });

    // Use custom render if provided
    if (renderTime) {
        return renderTime(msLeft, countdownType);
    }

    // Default formatted time
    const totalSeconds = Math.floor(msLeft / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = hours > 0
        ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${minutes}:${seconds.toString().padStart(2, "0")}`;

    return (
        <span className="text-blue-600 font-semibold">
            {formattedTime} {countdownType !== 'ended' && countdownType}
        </span>
    );
};