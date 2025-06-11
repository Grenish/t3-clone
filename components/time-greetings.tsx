import React, { useState, useEffect, useMemo } from 'react';

interface TimeGreetingsProps {
  user: string;
  className?: string;
  updateInterval?: number;
}

const TimeGreetings: React.FC<TimeGreetingsProps> = ({ 
  user, 
  className, 
  updateInterval = 60000 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(true);

  const getGreeting = useMemo((): string => {
    const currentHour = currentTime.getHours();
    
    if (currentHour >= 5 && currentHour < 9) {
      return 'Good Morning';
    } else if (currentHour >= 9 && currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 14) {
      return 'Good Afternoon';
    } else if (currentHour >= 14 && currentHour < 17) {
      return 'Good Afternoon';
    } else if (currentHour >= 17 && currentHour < 19) {
      return 'Good Evening';
    } else if (currentHour >= 19 && currentHour < 22) {
      return 'Good Evening';
    } else if (currentHour >= 22 || currentHour < 1) {
      return 'Go to Bed Already';
    } else {
      return 'Seriously? Go Sleep';
    }
  }, [currentTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = new Date();
      const currentHour = currentTime.getHours();
      const newHour = newTime.getHours();
      
      if (currentHour !== newHour) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentTime(newTime);
          setIsVisible(true);
        }, 150);
      } else {
        setCurrentTime(newTime);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [currentTime, updateInterval]);

  return (
    <h2 
      className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
      title={`Current time: ${currentTime.toLocaleTimeString()}`}
    >
      {getGreeting}, {user}!
    </h2>
  );
};

export default TimeGreetings;
