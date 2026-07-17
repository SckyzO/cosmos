import { clsx } from 'clsx';
import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ElementType, KeyboardEvent as ReactKeyboardEvent } from 'react';

export type DropdownOption = {
  value: string;
  label: string;
  icon?: ElementType;
  disabled?: boolean;
};

export type DropdownDivider = { divider: true };

export type DropdownItem = DropdownOption | DropdownDivider;

const isDivider = (item: DropdownItem): item is DropdownDivider =>
  (item as DropdownDivider).divider === true;

export type DropdownProps = {
  label?: string;
  icon?: ElementType;
  options: DropdownItem[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  className?: string;
};

export const Dropdown = ({
  label,
  icon: TriggerIcon,
  options,
  value,
  onChange,
  placeholder,
  align = 'left',
  disabled = false,
  className,
}: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Move focus to the first item when the menu opens (ARIA menu pattern).
  useEffect(() => {
    if (!open) return;
    const first = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)');
    first?.focus();
  }, [open]);

  const closeAndRefocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  // Roving focus between menu items; Escape closes and returns focus to trigger.
  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAndRefocus();
      return;
    }
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => {
      e.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    if (e.key === 'ArrowDown') focusAt(currentIndex + 1);
    else if (e.key === 'ArrowUp') focusAt(currentIndex - 1);
    else if (e.key === 'Home') focusAt(0);
    else if (e.key === 'End') focusAt(items.length - 1);
  };

  const selected = options.find((o): o is DropdownOption => !isDivider(o) && o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? label ?? 'Select…';

  return (
    <div ref={ref} className={clsx('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          'flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
          open && 'ring-brand-500/30 ring-2'
        )}
      >
        {TriggerIcon && <TriggerIcon className="h-4 w-4 shrink-0 text-gray-400" />}
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-gray-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            className={clsx(
              'absolute top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {options.map((opt, idx) => {
              if (isDivider(opt)) {
                return (
                  <div
                    key={`divider-${idx}`}
                    role="separator"
                    className="my-1 border-t border-gray-100 dark:border-gray-800"
                  />
                );
              }
              const Icon = opt.icon;
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="menuitem"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange?.(opt.value);
                    closeAndRefocus();
                  }}
                  className={clsx(
                    'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    isSelected
                      ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {isSelected && <Check className="text-brand-500 h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
