import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * ServerTimeClock Component
 *
 * Displays the current UTC time with automatic updates.
 * Updates every second to show real-time UTC clock.
 */

interface ServerTimeClockProps {
  className?: string;
  showDate?: boolean;
  variant?: "default" | "compact" | "minimal";
}

export default function ServerTimeClock({
  className = "",
  showDate = true,
  variant = "default",
}: ServerTimeClockProps) {
  const [utcTime, setUtcTime] = useState<Date>(new Date());

  // Update time every second
  useEffect(() => {
    // Set up interval to update every second
    const interval = setInterval(() => {
      setUtcTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-1 text-sm ${className}`}>
        <Clock className="w-3 h-3" />
        <span>
          {formatTime(utcTime)} ({formatDate(utcTime)})
        </span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="w-4 h-4" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {formatTime(utcTime)} {showDate && `(${formatDate(utcTime)})`}
          </span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={`w-fit ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary" />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-semibold">
                {formatTime(utcTime)} {showDate && `(${formatDate(utcTime)})`}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
