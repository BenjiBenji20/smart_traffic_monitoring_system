import { useEffect, useState } from 'react';

interface LivestreamHeaderProps {
  location: string;
}

export function LivestreamHeader({ location }: LivestreamHeaderProps) {
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setDateTime(formatted);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Live Traffic Feed</h2>
      <div className="text-right text-sm">
        <p className="text-muted-foreground">{dateTime}</p>
        {location && (
          <p className="text-xs text-muted-foreground mt-0.5">{location}</p>
        )}
      </div>
    </div>
  );
}