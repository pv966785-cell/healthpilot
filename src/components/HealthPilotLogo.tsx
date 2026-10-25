import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only' | 'monochrome' | 'white';
  showTagline?: boolean;
  className?: string;
}

export const HealthPilotLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  showTagline = true,
  className = ''
}) => {
  const iconDimensions = {
    sm: { width: 28, height: 28, radius: 'rounded-lg' },
    md: { width: 38, height: 38, radius: 'rounded-xl' },
    lg: { width: 52, height: 52, radius: 'rounded-2xl' },
    xl: { width: 72, height: 72, radius: 'rounded-3xl' },
  }[size];

  const textSizes = {
    sm: { title: 'text-sm', tagline: 'text-[9px]' },
    md: { title: 'text-base', tagline: 'text-[10px]' },
    lg: { title: 'text-xl', tagline: 'text-xs' },
    xl: { title: 'text-3xl', tagline: 'text-sm' },
  }[size];

  const renderIcon = () => (
    <img
      src="/logo-mark.png"
      alt="HealthPilot Logo"
      width={iconDimensions.width}
      height={iconDimensions.height}
      style={{ width: iconDimensions.width, height: iconDimensions.height }}
      className={`shrink-0 ${iconDimensions.radius} object-contain drop-shadow-md transition-transform duration-300 hover:scale-105`}
    />
  );

  if (variant === 'icon-only') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIcon()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderIcon()}
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight leading-none ${textSizes.title}`}>
          <span className={variant === 'white' ? 'text-white' : 'text-[#0A1A45] dark:text-white'}>Health</span>
          <span className={
            variant === 'white' 
              ? 'bg-gradient-to-r from-[#E9A21F] via-[#F8CF63] to-[#E39B14] bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-[#C98A12] to-[#E3A21F] dark:from-[#E9A21F] dark:via-[#F8CF63] dark:to-[#E39B14] bg-clip-text text-transparent'
          }>Pilot</span>
        </span>
        {showTagline && (
          <span
            className={`font-semibold tracking-wide uppercase mt-0.5 ${textSizes.tagline} ${
              variant === 'white' ? 'text-blue-200' : 'text-[#475569] dark:text-[#BFD0EE]'
            }`}
          >
            Health Beyond Borders
          </span>
        )}
      </div>
    </div>
  );
};
