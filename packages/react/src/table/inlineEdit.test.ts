import { describe, expect, it } from 'vitest';
import { isThenable, rowChanges, saveErrorMessage, triggerId } from './inlineEdit';

describe('rowChanges', () => {
  it('keeps only the cells whose draft moved', () => {
    expect(
      rowChanges({ rack: 'R-12', owner: 'Platform' }, { rack: 'R-15', owner: 'Platform' })
    ).toEqual({ rack: 'R-15' });
  });

  it('is empty when nothing moved', () => {
    expect(rowChanges({ rack: 'R-12' }, { rack: 'R-12' })).toEqual({});
  });

  it('keeps a cell that was emptied', () => {
    expect(rowChanges({ note: 'Fan 3' }, { note: '' })).toEqual({ note: '' });
  });
});

describe('saveErrorMessage', () => {
  it('reads an Error, a string, and falls back to a plain line', () => {
    expect(saveErrorMessage(new Error('Rack is full'))).toBe('Rack is full');
    expect(saveErrorMessage('Refused')).toBe('Refused');
    expect(saveErrorMessage(new Error(''))).toBe('Not saved');
    expect(saveErrorMessage(undefined)).toBe('Not saved');
    expect(saveErrorMessage({ code: 500 })).toBe('Not saved');
  });
});

describe('isThenable', () => {
  it('tells a promise from anything else', () => {
    expect(isThenable(Promise.resolve())).toBe(true);
    expect(isThenable({ then: () => undefined })).toBe(true);
    expect(isThenable(undefined)).toBe(false);
    expect(isThenable(null)).toBe(false);
    expect(isThenable('then')).toBe(false);
  });
});

describe('triggerId', () => {
  it('tells two cells apart, and a number key from a string one only by its text', () => {
    expect(triggerId('a', 'rack')).not.toBe(triggerId('a', 'owner'));
    expect(triggerId('a', 'rack')).not.toBe(triggerId('b', 'rack'));
    expect(triggerId(1, 'rack')).toBe(triggerId('1', 'rack'));
  });
});
