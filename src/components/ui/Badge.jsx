import React from 'react';

const Badge = ({ children, color = 'gray', onClick, isInteractive = false }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-600',
    selected: 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
  };
  
  return (
    <span 
      onClick={onClick}
      className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide ${colors[color]} ${isInteractive ? 'cursor-pointer hover:opacity-80 hover:scale-105 transition-all' : ''}`}
    >
      {children}
    </span>
  );
};

export default Badge;