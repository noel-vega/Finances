import { useEffect, useState } from "react";

// "Expires in 14:32", turning red under a minute; "Code expired" at zero.
export function PairingCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = new Date(expiresAt).getTime() - now;

  if (remaining <= 0) {
    return <span className="text-sm font-medium text-destructive">Code expired</span>;
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const mm = Math.floor(totalSeconds / 60);
  const ss = String(totalSeconds % 60).padStart(2, "0");

  return (
    <span
      className={
        totalSeconds < 60
          ? "text-sm text-destructive"
          : "text-sm text-muted-foreground"
      }
    >
      Expires in {mm}:{ss}
    </span>
  );
}
