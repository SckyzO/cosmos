import { clsx } from 'clsx';
import { ArrowRight, Check, Dot } from 'lucide-react';
import { createContext, useContext, type ComponentType, type ReactNode } from 'react';

export type ListVariant = 'unordered' | 'ordered' | 'plain';
export type ListMarker = 'disc' | 'check' | 'arrow' | 'dot' | 'none';
export type ListSpacing = 'tight' | 'normal' | 'loose';
export type ListOrientation = 'vertical' | 'horizontal';

const MARKER_ICON: Partial<Record<ListMarker, ComponentType<{ className?: string }>>> = {
  check: Check,
  arrow: ArrowRight,
  dot: Dot,
};

const MARKER_COLOR: Partial<Record<ListMarker, string>> = {
  check: 'text-green-500',
  arrow: 'text-brand-500',
  dot: 'text-gray-400',
};

const SPACING_VERTICAL: Record<ListSpacing, string> = {
  tight: 'space-y-1',
  normal: 'space-y-2',
  loose: 'space-y-3',
};

const SPACING_HORIZONTAL: Record<ListSpacing, string> = {
  tight: 'gap-2',
  normal: 'gap-4',
  loose: 'gap-6',
};

// ── Context ──────────────────────────────────────────────────────────────────

type Ctx = {
  variant: ListVariant;
  marker: ListMarker;
  orientation: ListOrientation;
};

const ListContext = createContext<Ctx | null>(null);
const useCtx = (): Ctx => {
  const ctx = useContext(ListContext);
  if (!ctx) throw new Error('List.Item must be used inside <List>');
  return ctx;
};

// ── Root ─────────────────────────────────────────────────────────────────────

export type ListProps = {
  variant?: ListVariant;
  /** Marker style (only applies when `variant="unordered"`). Default `disc`. */
  marker?: ListMarker;
  spacing?: ListSpacing;
  orientation?: ListOrientation;
  className?: string;
  children: ReactNode;
};

const ListRoot = ({
  variant = 'unordered',
  marker = 'disc',
  spacing = 'normal',
  orientation = 'vertical',
  className,
  children,
}: ListProps) => {
  // For ordered or plain lists the `marker` prop is ignored — use 'none' so
  // we don't render a marker icon AND css list-style is set explicitly below.
  const effectiveMarker: ListMarker =
    variant === 'ordered' || variant === 'plain' ? 'none' : marker;
  const Tag = (variant === 'ordered' ? 'ol' : 'ul') as 'ul' | 'ol';
  // Use a native CSS bullet only for `disc` to keep semantics; for icon-based
  // markers (check/arrow/dot) and 'none' we render the marker ourselves so
  // colors and alignment are consistent.
  const useNativeMarker = variant === 'ordered' || effectiveMarker === 'disc';
  const listStyle =
    variant === 'ordered'
      ? 'list-decimal ps-5 marker:text-gray-400'
      : effectiveMarker === 'disc'
        ? 'list-disc ps-5 marker:text-gray-400'
        : 'list-none';
  const layout =
    orientation === 'horizontal'
      ? clsx('flex flex-wrap items-center', SPACING_HORIZONTAL[spacing])
      : SPACING_VERTICAL[spacing];
  return (
    <ListContext.Provider value={{ variant, marker: effectiveMarker, orientation }}>
      <Tag
        className={clsx(
          'text-sm text-gray-700 dark:text-gray-300',
          listStyle,
          // When using the native marker we don't need flex layout per item.
          // For icon markers, use vertical/horizontal flex layouts.
          !useNativeMarker && layout,
          useNativeMarker && (orientation === 'horizontal' ? layout : SPACING_VERTICAL[spacing]),
          className
        )}
      >
        {children}
      </Tag>
    </ListContext.Provider>
  );
};

// ── Item ─────────────────────────────────────────────────────────────────────

export type ListItemProps = {
  /** Override the parent marker for this single item. */
  icon?: ComponentType<{ className?: string }>;
  /** Override the icon color (Tailwind class). Default depends on the marker. */
  iconColor?: string;
  className?: string;
  children: ReactNode;
};

const ListItem = ({ icon, iconColor, className, children }: ListItemProps) => {
  const { variant, marker } = useCtx();
  // Ordered + disc + native: render plain <li> and let CSS draw the marker.
  if (variant === 'ordered' || marker === 'disc') {
    return <li className={className}>{children}</li>;
  }
  if (marker === 'none' && !icon) {
    return <li className={className}>{children}</li>;
  }
  const Icon = icon ?? MARKER_ICON[marker];
  const color = iconColor ?? MARKER_COLOR[marker] ?? 'text-gray-400';
  return (
    <li className={clsx('flex items-start gap-2', className)}>
      {Icon && <Icon className={clsx('mt-0.5 h-4 w-4 shrink-0', color)} aria-hidden />}
      <span className="flex-1">{children}</span>
    </li>
  );
};

// ── Compound export ──────────────────────────────────────────────────────────

export const List = Object.assign(ListRoot, { Item: ListItem });
