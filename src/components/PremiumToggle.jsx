import React from 'react';
import { Check } from 'lucide-react';

export function PremiumToggle({ checked = false, onChange, label, description, id, disabled = false, size = 'md' }) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 8)}`;
  const isSmall = size === 'sm';
  
  return (
    <label
      htmlFor={toggleId}
      className={`flex items-start gap-3 cursor-pointer select-none group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            ${isSmall ? 'w-10 h-[22px]' : 'w-12 h-7'}
            rounded-full transition-all duration-300 ease-out
            ${checked 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/30 dark:shadow-blue-500/40' 
              : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-600'
            }
          `}
        />
        <div
          className={`
            absolute top-0.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isSmall ? 'h-[18px] w-[18px]' : 'h-6 w-6'}
            rounded-full bg-white shadow-md
            flex items-center justify-center
            ${checked 
              ? (isSmall ? 'left-[22px]' : 'left-[26px]')
              : 'left-0.5'
            }
          `}
        >
          <Check 
            className={`
              ${isSmall ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}
              text-blue-600 transition-all duration-200
              ${checked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}
            `}
            strokeWidth={3}
          />
        </div>
      </div>
      
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight block">
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}
