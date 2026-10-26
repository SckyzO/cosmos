import {
  Archive,
  File as FileIcon,
  FileCode,
  FileText,
  FileType,
  Folder,
  Image as ImageIcon,
  Music,
  Sheet,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { Intent } from '../ui/intent';

export type FileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'archive'
  | 'code'
  | 'other';

/**
 * What a kind looks like: its icon and the `Intent` whose tint colours it. The meaning is loose (a
 * PDF is `danger` because that is the colour people expect, not because it is an error), so the
 * tint is the only thing a kind says; the name and the meta carry the rest.
 */
export const FILE_KIND_VISUAL: Record<FileKind, { icon: LucideIcon; intent: Intent }> = {
  folder: { icon: Folder, intent: 'brand' },
  pdf: { icon: FileText, intent: 'danger' },
  spreadsheet: { icon: Sheet, intent: 'success' },
  archive: { icon: Archive, intent: 'warning' },
  document: { icon: FileType, intent: 'info' },
  image: { icon: ImageIcon, intent: 'neutral' },
  video: { icon: Video, intent: 'neutral' },
  audio: { icon: Music, intent: 'neutral' },
  code: { icon: FileCode, intent: 'neutral' },
  other: { icon: FileIcon, intent: 'neutral' },
};
