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
    xs: '-ms-1.5',
    sm: '-ms-2',
    md: '-ms-2.5',
    lg: '-ms-3',
    xl: '-ms-4',
    '2xl': '-ms-5',
    '3xl': '-ms-6',
  },
  tight: {
    xs: '-ms-2',
    sm: '-ms-2.5',
    md: '-ms-3.5',
    lg: '-ms-4',
    xl: '-ms-5',
    '2xl': '-ms-7',
    '3xl': '-ms-8',
  },
};

// Initials sit in the middle of the part the next avatar leaves visible: half its overlap plus
// its 2px ring. Centred on the whole avatar, two wide capitals ran under the next one at every
// size. A margin on the end side moves a centred box by half of it: twice the shift, and it
// follows the direction, where a translate would not. Whole class names, for Tailwind.
const INITIALS_SHIFT_CLASS: Record<'tight' | 'normal', Record<AvatarSize, string>> = {
  normal: {
    xs: '[&>[role=img]>span:first-child]:me-2',
    sm: '[&>[role=img]>span:first-child]:me-2.5',
    md: '[&>[role=img]>span:first-child]:me-3',
    lg: '[&>[role=img]>span:first-child]:me-3.5',
    xl: '[&>[role=img]>span:first-child]:me-4.5',
    '2xl': '[&>[role=img]>span:first-child]:me-5.5',
    '3xl': '[&>[role=img]>span:first-child]:me-6.5',
  },
  tight: {
    xs: '[&>[role=img]>span:first-child]:me-2.5',
    sm: '[&>[role=img]>span:first-child]:me-3',
    md: '[&>[role=img]>span:first-child]:me-4',
    lg: '[&>[role=img]>span:first-child]:me-4.5',
    xl: '[&>[role=img]>span:first-child]:me-5.5',
    '2xl': '[&>[role=img]>span:first-child]:me-7.5',
    '3xl': '[&>[role=img]>span:first-child]:me-8.5',
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

  // Every slot but the last one has another slot over its end side.
  const last = visible.length - (hidden > 0 ? 0 : 1);
  const slot = (key: string | number, index: number, shape: AvatarShape, node: ReactNode) => (
    <span
      key={key}
      className={clsx(
        // The surface behind each avatar: a tinted fill lets the one before it, and its ring, show
        // through otherwise.
        'relative inline-flex shrink-0 bg-[var(--color-bg-panel)] ring-2 ring-[var(--color-bg-panel)] has-focus-visible:z-10',
        AVATAR_SHAPE_CLASS[shape],
        index > 0 && OVERLAP_CLASS[spacing][size],
        index < last && INITIALS_SHIFT_CLASS[spacing][size]
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
          <bdi>+{hidden}</bdi>
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
          <bdi>+{hidden}</bdi>
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
