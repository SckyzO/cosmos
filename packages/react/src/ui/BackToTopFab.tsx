import { clsx } from 'clsx';
import { ArrowUp } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ComponentType,
} from 'react';

export type BackToTopFabPosition = 'bottom-right' | 'bottom-left';
export type BackToTopFabIntent = 'brand' | 'neutral';

export type BackToTopFabProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  /** Pixels of vertical scroll before the FAB fades in. Default `300`. */
  threshold?: number;
  /** Anchor corner. Default `bottom-right`. */
  position?: BackToTopFabPosition;
  /** Use smooth scrolling. Default `true`. */
  smoothScroll?: boolean;
  /** Override the icon. Default `ArrowUp`. */
  icon?: ComponentType<{ className?: string }>;
  /** Visual intent. Default `brand` (filled brand-500). `neutral` is gray. */
  intent?: BackToTopFabIntent;
  /** Override the click handler — defaults to `window.scrollTo({ top: 0 })`. */
  onActivate?: () => void;
  /** Distance from the viewport edges in px. Default `24`. */
  offset?: number;
  ariaLabel?: string;
};

const POSITION_CLASS: Record<BackToTopFabPosition, string> = {
  'bottom-right': 'right-0',
  'bottom-left': 'left-0',
};

const INTENT_CLASS: Record<BackToTopFabIntent, string> = {
  brand:
    'bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 active:scale-95',
  neutral:
    'bg-white text-gray-700 border border-gray-200 shadow-lg hover:bg-gray-50 active:scale-95 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700',
};

export const BackToTopFab = ({
  threshold = 300,
  position = 'bottom-right',
  smoothScroll = true,
  icon: Icon = ArrowUp,
  intent = 'brand',
  onActivate,
  offset = 24,
  ariaLabel = 'Back to top',
  className,
  style,
  ...rest
}: BackToTopFabProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > threshold);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  const handleClick = useCallback(() => {
    if (onActivate) {
      onActivate();
      return;
    }
    window.scrollTo({ top: 0, behavior: smoothScroll ? 'smooth' : 'auto' });
  }, [onActivate, smoothScroll]);

  const positionStyle = {
    bottom: offset,
    [position === 'bottom-right' ? 'right' : 'left']: offset,
    ...style,
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-hidden={!visible || undefined}
      tabIndex={visible ? 0 : -1}
      onClick={handleClick}
      style={positionStyle}
      className={clsx(
        'fixed z-40 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200',
        POSITION_CLASS[position],
        INTENT_CLASS[intent],
        visible
          ? 'pointer-events-auto opacity-100 translate-y-0'
          : 'pointer-events-none opacity-0 translate-y-2',
        className,
      )}
      {...rest}
    >
      <Icon className="h-5 w-5" aria-hidden />
    </button>
  );
};
