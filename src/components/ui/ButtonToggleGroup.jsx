import React from 'react';

const ButtonToggleGroup = ({ options, value, onChange }) => {
  return (
    <div className="p-1.5 flex flex-col sm:flex-row rounded-2xl bg-gray-200/40 backdrop-blur-md border border-white/60 shadow-inner gap-1">
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              relative flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2
              ${isActive 
                ? 'bg-white text-emerald-600 shadow-lg shadow-gray-200/50 scale-[1.02] ring-1 ring-white' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/40 active:scale-95'
              }
            `}
          >
            {Icon && (
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-500' : 'text-gray-400'}`} />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default ButtonToggleGroup;