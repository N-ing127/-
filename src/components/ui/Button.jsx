import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false }) => {
  const baseStyle = "px-5 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-emerald-600 text-white shadow-xl shadow-emerald-200/40 hover:bg-emerald-700 dark:shadow-emerald-900/20 active:scale-[0.98]",
    secondary: "bg-orange-500 text-white hover:bg-orange-600 dark:shadow-orange-900/20 active:scale-[0.98]",
    outline: "border-2 border-emerald-700 text-emerald-700 dark:text-emerald-400 dark:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.98]",
    ghost: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 active:scale-[0.95]",
    disabled: "bg-gray-200 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export default Button;