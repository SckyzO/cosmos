import type { AvatarSize } from './Avatar';

/** Box and initials size per `AvatarSize`, shared by `Avatar` and the "+N" of `AvatarGroup`. */
export const AVATAR_SIZE_CLASS: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-3xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
  '3xl': 'h-24 w-24 text-2xl',
};
