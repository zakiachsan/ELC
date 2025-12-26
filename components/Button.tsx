
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'accent';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Updated to use CSS Variables classes
  const variants = {
    // Primary: Uses --primary-color
    primary: "theme-bg-primary theme-bg-primary-hover text-white shadow-sm",
    // Accent: Uses --accent-color
    accent: "theme-bg-accent theme-bg-accent-hover theme-text-on-accent shadow-sm font-bold",
    // Secondary: Gray (Fixed)
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    // Outline: Uses --primary-color for border/text
    outline: "border theme-border-primary border-gray-300 text-gray-700 hover:theme-bg-primary-light theme-text-primary hover:border-current"
  };

  const selectedVariant = variant === 'primary' ? variants.primary : 
                          variant === 'outline' ? variants.outline :
                          variant === 'danger' ? variants.danger :
                          variant === 'secondary' ? variants.secondary :
                          variant === 'accent' ? variants.accent :
                          variants.primary; 

  return (
    <button 
      className={`${baseStyle} ${selectedVariant} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </span>
      ) : children}
    </button>
  );
};
