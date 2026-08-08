import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export function PremiumSelect({ value, defaultValue, onChange, children, className = '', required = false, disabled = false, name, ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const containerRef = useRef(null);

  // Parse standard React children to extract options
  const options = React.Children.toArray(children)
    .map(child => {
      if (child.type === 'option') {
        return {
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children,
          disabled: child.props.disabled || false
        };
      }
      return null;
    })
    .filter(Boolean);

  const activeValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => String(opt.value) === String(activeValue)) || options[0];

  useEffect(() => {
    setInternalValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optValue) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalValue(optValue);
    }
    if (onChange) {
      onChange({
        target: {
          value: optValue,
          name: name
        }
      });
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const cleanClassName = className
    .split(' ')
    .filter(c => {
      const exclude = [
        'w-full', 'rounded-2xl', 'border', 'border-slate-200', 'border-slate-300',
        'bg-slate-50', 'bg-slate-50/50', 'bg-white', 'px-4', 'py-3', 'text-sm',
        'text-slate-900', 'outline-none', 'transition', 'focus:border-blue-500',
        'focus:ring-4', 'focus:ring-blue-500/10', 'dark:border-slate-800',
        'dark:bg-slate-950', 'dark:bg-slate-950/40', 'dark:bg-slate-900',
        'dark:text-slate-100', 'dark:focus:border-blue-500', 'font-bold',
        'font-semibold', 'pr-10', 'py-3.5', 'appearance-none', 'cursor-pointer',
        'shadow-sm'
      ];
      return !exclude.includes(c);
    })
    .join(' ');

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${cleanClassName}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between text-left transition-all duration-200 outline-none
          bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800
          rounded-2xl px-4 py-3.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white
          focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      >
        <span className="truncate pr-4">
          {selectedOption ? selectedOption.label : 'Selecione...'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 dark:text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`
            absolute top-full left-0 w-full mt-1.5 z-50 rounded-2xl border shadow-xl
            bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800
            py-1.5 max-h-60 overflow-y-auto animate-scale-in
          `}
        >
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-slate-400 dark:text-slate-600">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              if (opt.disabled) {
                return (
                  <div
                    key={idx}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50"
                  >
                    {opt.label}
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors
                    ${
                      isSelected
                        ? 'font-bold bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'
                        : 'font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  <span className="truncate mr-2">{opt.label}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
