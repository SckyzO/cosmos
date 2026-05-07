import { clsx } from 'clsx';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export type ZoomBarProps = {
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit?: () => void;
  onReset?: () => void;
  className?: string;
};

const ZoomBtn = ({
  onClick,
  title,
  children,
  dividerLeft = false,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  dividerLeft?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={clsx(
      'flex items-center px-2.5 py-2 text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5',
      dividerLeft && 'border-l border-gray-200 dark:border-gray-700'
    )}
  >
    {children}
  </button>
);

/**
 * ZoomBar — inline zoom control group: [−] [xx%] [+] [fit] [reset].
 * Use for canvas, map, and visualization views.
 */
export const ZoomBar = ({ zoom, onZoomOut, onZoomIn, onFit, onReset, className }: ZoomBarProps) => (
  <div
    className={clsx(
      'flex overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
      className
    )}
  >
    <ZoomBtn onClick={onZoomOut} title="Zoom out">
      <Minus className="h-4 w-4" />
    </ZoomBtn>
    <span className="flex min-w-[3.5rem] items-center justify-center border-x border-gray-200 px-3 py-2 font-mono text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
      {Math.round(zoom * 100)}%
    </span>
    <ZoomBtn onClick={onZoomIn} title="Zoom in">
      <Plus className="h-4 w-4" />
    </ZoomBtn>
    {onFit && (
      <ZoomBtn onClick={onFit} title="Fit to canvas" dividerLeft>
        <Maximize2 className="h-4 w-4" />
      </ZoomBtn>
    )}
    {onReset && (
      <ZoomBtn onClick={onReset} title="Reset to 100%" dividerLeft>
        <RotateCcw className="h-4 w-4" />
      </ZoomBtn>
    )}
  </div>
);
