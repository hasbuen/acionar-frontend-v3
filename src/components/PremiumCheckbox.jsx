import React from 'react';
import { Check } from 'lucide-react';

export function PremiumCheckbox({ checked = false, onChange, label, description, id, disabled = false }) {
  const checkId = id || `check-${Math.random().toString(36).slice(2, 8)}`;
  
  return (
    <label
      htmlFor={checkId}
      className={`flex items-start gap-3 cursor-pointer select-none group min-h-[44px] items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="relative shrink-0">
        <input
          type="checkbox"
          id={checkId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            h-6 w-6 rounded-lg border-2 transition-all duration-200 ease-out
            flex items-center justify-center
            ${checked
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-blue-600 shadow-md shadow-blue-500/25 dark:shadow-blue-500/35 scale-105'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-400 dark:group-hover:border-blue-500'
            }
          `}
        >
          <Check
            className={`
              h-4 w-4 text-white transition-all duration-200
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
