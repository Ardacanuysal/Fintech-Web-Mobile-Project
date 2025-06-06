import React, { forwardRef } from 'react';
import classNames from 'classnames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, leftIcon, rightIcon, className, ...rest }, ref) => {
    const inputClasses = classNames(
      'block w-full px-4 py-3 bg-gray-50 border transition-all duration-200',
      'focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white',
      'rounded-lg text-gray-900 placeholder:text-gray-500',
      {
        'pl-11': leftIcon,
        'pr-11': rightIcon,
        'border-red-300 bg-red-50': error,
        'border-gray-200 hover:border-gray-300': !error,
      },
      className
    );

    const containerClasses = classNames(
      'group',
      {
        'w-full': fullWidth,
      }
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-500 transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input 
            ref={ref} 
            className={inputClasses} 
            {...rest} 
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;