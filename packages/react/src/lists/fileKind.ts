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

const EXTENSIONS: Record<Exclude<FileKind, 'folder' | 'other'>, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'heic', 'bmp', 'tif', 'tiff'],
  video: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac'],
  pdf: ['pdf'],
  document: ['doc', 'docx', 'odt', 'rtf', 'txt', 'md'],
  spreadsheet: ['xls', 'xlsx', 'ods', 'csv', 'tsv'],
  archive: ['zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar'],
  code: [
    'js',
    'ts',
    'jsx',
    'tsx',
    'json',
    'html',
    'css',
    'py',
    'go',
    'rs',
    'java',
    'sh',
    'yml',
    'yaml',
    'xml',
    'sql',
    'c',
    'cpp',
    'rb',
    'php',
  ],
};

const KIND_BY_EXTENSION = new Map<string, FileKind>(
  (Object.entries(EXTENSIONS) as [FileKind, string[]][]).flatMap(([kind, list]) =>
    list.map((ext) => [ext, kind] as const)
  )
);

/**
 * The kind a file name suggests from its last extension, `other` when it has none or an unknown
 * one. A folder has no extension to tell it by: a caller that knows says so with `kind`.
 */
export const kindFromName = (name: string): FileKind => {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return 'other';
  return KIND_BY_EXTENSION.get(name.slice(dot + 1).toLowerCase()) ?? 'other';
};
