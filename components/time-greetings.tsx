import React from 'react';

interface TimeGreetingsProps {
  user: string;
  className?: string;
}

const TimeGreetings: React.FC<TimeGreetingsProps> = ({ user, className }) => {
  const getGreeting = (): string => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 17) {
      return 'Good Afternoon';
    } else if (currentHour >= 17 && currentHour < 21) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  };

  return (
    <h2 className={className}>
      {getGreeting()}, {user}!
    </h2>
  );
};

export default TimeGreetings;
