import React, { useState } from 'react';

interface FounderAvatarProps {
  className?: string;
}

export const FounderAvatar: React.FC<FounderAvatarProps> = ({ className = 'w-14 h-14 rounded-2xl' }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        className={`${className} bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold select-none shrink-0`}
        aria-label="Praveen Verma, Founder & Director"
      >
        PV
      </div>
    );
  }

  return (
    <img
      src="/founder.jpg?v=2"
      alt="Praveen Verma, Founder & Director"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`${className} object-cover object-top shrink-0`}
    />
  );
};
