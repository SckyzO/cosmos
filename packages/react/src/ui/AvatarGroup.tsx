import { clsx } from 'clsx';
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Avatar, type AvatarProps, type AvatarShape, type AvatarSize } from './Avatar';
import { AVATAR_SHAPE_CLASS, AVATAR_SIZE_CLASS } from './avatarSizes';

export type AvatarGroupProps = {
  /** `Avatar` elements. Ignored when `avatars` is set. */
  children?: ReactNode;
  /** The avatars as data, instead of `children`. */
  avatars?: AvatarProps[];
  /** How many avatars show before the rest collapse into "+N". */
  max?: number;
  /** Applied to every avatar, whatever size they carry. */
  size?: AvatarSize;
  /** `tight` overlaps the avatars by about a third of their size, `normal` by about a quarter. */
  spacing?: 'tight' | 'normal';
  /** Names the group for assistive technology ("Assignees"). */
  'aria-label'?: string;
  /**
   * Makes the "+N" a button, called with the number of hidden avatars. The button carries
   * `ref`, so the host can anchor a popover on it.
   */
  onOverflowClick?: (hidden: number) => void;
  /** Ref of the "+N" button, when `onOverflowClick` is set. */
  ref?: Ref<HTMLButtonElement>;
  /**
   * Replaces the "+N" with the host's own element (a popover trigger, say), which then owns its
   * name, size and focus. It sits in the stack with the same overlap.
   */
  renderOverflow?: (hidden: number) => ReactNode;
  className?: string;
};

// About a quarter of each size, and about a third for `tight`. Whole class names, for Tailwind.
const OVERLAP_CLASS: Record<'tight' | 'normal', Record<AvatarSize, string>> = {
  normal: {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-2.5',
    lg: '-ml-3',
    xl: '-ml-4',
    '2xl': '-ml-5',
    '3xl': '-ml-6',
  },
  tight: {
    xs: '-ml-2',
    sm: '-ml-2.5',
    md: '-ml-3.5',
    lg: '-ml-4',
    xl: '-ml-5',
    '2xl': '-ml-7',
    '3xl': '-ml-8',
  },
};

// Neutral, so the count reads apart from the accent-tinted people. The gray scale follows the theme.
const OVERFLOW_CLASS =
  'inline-flex shrink-0 items-center justify-center bg-gray-100 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200';

const overflowName = (hidden: number) => (hidden === 1 ? '1 more person' : `${hidden} more people`);

/**
 * AvatarGroup — overlapping avatars with a "+N" for the rest.
 *
 * Each avatar is ringed with the surface color (`--color-bg-panel`), so the stack reads on any
 * theme. The ring follows each avatar's `shape`, and the "+N" takes the shape of the avatar before
 * it. The group is `role="group"`; the "+N" is an `img` named "N more people", or a button
 * with `onOverflowClick`.
 */
export const AvatarGroup = ({
  children,
  avatars,
  max = 4,
  size = 'md',
  spacing = 'normal',
  'aria-label': ariaLabel,
  onOverflowClick,
  ref,
  renderOverflow,
  className,
}: AvatarGroupProps) => {
  const items: ReactElement<AvatarProps>[] = avatars
    ? avatars.map((a, i) => <Avatar key={i} {...a} />)
    : Children.toArray(children).filter(isValidElement<AvatarProps>);
  const shown = Math.max(0, Math.floor(max));
  const visible = items.slice(0, shown);
  const hidden = items.length - visible.length;

  // The "+N" follows the avatar before it, so a group of squares does not end on a circle.
  const overflowShape = visible[visible.length - 1]?.props.shape ?? 'circle';

  const slot = (key: string | number, index: number, shape: AvatarShape, node: ReactNode) => (
    <span
      key={key}
      className={clsx(
        'relative inline-flex shrink-0 ring-2 ring-[var(--color-bg-panel)] has-focus-visible:z-10',
        AVATAR_SHAPE_CLASS[shape],
        index > 0 && OVERLAP_CLASS[spacing][size]
      )}
    >
      {node}
    </span>
  );

  let overflow: ReactNode = null;
  if (hidden > 0) {
    const label = overflowName(hidden);
    if (renderOverflow) {
      overflow = renderOverflow(hidden);
    } else if (onOverflowClick) {
      overflow = (
        <button
          ref={ref}
          type="button"
          aria-label={label}
          onClick={() => onOverflowClick(hidden)}
          className={clsx(
            OVERFLOW_CLASS,
            AVATAR_SHAPE_CLASS[overflowShape],
            AVATAR_SIZE_CLASS[size],
            'focus-visible:focus-indicator cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          +{hidden}
        </button>
      );
    } else {
      overflow = (
        <span
          role="img"
          aria-label={label}
          className={clsx(
            OVERFLOW_CLASS,
            AVATAR_SHAPE_CLASS[overflowShape],
            AVATAR_SIZE_CLASS[size]
          )}
        >
          +{hidden}
        </span>
      );
    }
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx('inline-flex items-center', className)}
    >
      {visible.map((item, i) =>
        slot(item.key ?? i, i, item.props.shape ?? 'circle', cloneElement(item, { size }))
      )}
      {overflow !== null && slot('overflow', visible.length, overflowShape, overflow)}
    </div>
  );
};
