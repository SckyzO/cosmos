import { describe, expect, it } from 'vitest';
import { kindFromName } from './fileKind';

describe('kindFromName', () => {
  it.each([
    ['report.pdf', 'pdf'],
    ['site-photo.JPG', 'image'],
    ['inventory.xlsx', 'spreadsheet'],
    ['notes.docx', 'document'],
    ['backup.tar.gz', 'archive'],
    ['kickoff.mp4', 'video'],
    ['interview.mp3', 'audio'],
    ['deploy.sh', 'code'],
  ])('reads %s as %s', (name, kind) => {
    expect(kindFromName(name)).toBe(kind);
  });

  it('uses the last extension only', () => {
    expect(kindFromName('archive.zip.pdf')).toBe('pdf');
  });

  it('falls back to other with no extension, an unknown one, or a dotfile', () => {
    expect(kindFromName('LICENSE')).toBe('other');
    expect(kindFromName('thing.unknownext')).toBe('other');
    expect(kindFromName('.gitignore')).toBe('other');
    expect(kindFromName('trailing.')).toBe('other');
    expect(kindFromName('')).toBe('other');
  });
});
