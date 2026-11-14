import React from 'react';

export const TraceLogo: React.FC<{ size?: 'sm' | 'lg' }> = ({ size = 'sm' }) => {
  const dim = size === 'lg' ? 76 : 36;
  const rounded = size === 'lg' ? 'rounded-2xl shadow-md shadow-[#6C3BF5]/10' : 'rounded-xl';

  return (
    <div
      className={`flex items-center justify-center bg-[#F6F4FF] border border-[#E9E2FF] shrink-0 ${rounded}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        className={size === 'lg' ? 'h-12 w-12' : 'h-6 w-6'}
        aria-hidden="true"
      >
        <path
          d="M22 19C22 14.5817 25.5817 11 30 11H34C38.4183 11 42 14.5817 42 19V25H37.5V19C37.5 17.067 35.933 15.5 34 15.5H30C28.067 15.5 26.5 17.067 26.5 19V45C26.5 46.933 28.067 48.5 30 48.5H34C35.933 48.5 37.5 46.933 37.5 45V38.5H42V45C42 49.4183 38.4183 53 34 53H30C25.5817 53 22 49.4183 22 45V19Z"
          fill="#6C3BF5"
        />
        <path
          d="M13 22C13 18.6863 15.6863 16 19 16H24.5V20.5H19C18.1716 20.5 17.5 21.1716 17.5 22V28C17.5 28.8284 18.1716 29.5 19 29.5H45C48.3137 29.5 51 32.1863 51 35.5V41C51 44.3137 48.3137 47 45 47H39.5V42.5H45C45.8284 42.5 46.5 41.8284 46.5 41V35.5C46.5 34.6716 45.8284 34 45 34H19C15.6863 34 13 31.3137 13 28V22Z"
          fill="#2563EB"
          fillOpacity="0.88"
        />
        <circle cx="32" cy="31.75" r="3.5" fill="#6C3BF5" />
        <circle cx="32" cy="31.75" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
