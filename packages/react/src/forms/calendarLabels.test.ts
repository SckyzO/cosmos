import { describe, expect, it } from 'vitest';
import { dayButtonName } from './calendarLabels';

describe('dayButtonName', () => {
  it('puts the number in front of a date that writes it as an ordinal', () => {
    expect(dayButtonName('Thursday, October 1st, 2026', '1')).toBe(
      '1, Thursday, October 1st, 2026'
    );
    expect(dayButtonName('Thursday, October 22nd, 2026', '22')).toBe(
      '22, Thursday, October 22nd, 2026'
    );
  });

  it('keeps the today and selected parts of the label', () => {
    expect(dayButtonName('Today, Thursday, May 7th, 2026, selected', '7')).toBe(
      '7, Today, Thursday, May 7th, 2026, selected'
    );
  });

  it('keeps a label that already holds the number as a word', () => {
    expect(dayButtonName('Donnerstag, 1. Oktober 2026', '1')).toBe('Donnerstag, 1. Oktober 2026');
    expect(dayButtonName('jueves, 1 de octubre de 2026', '1')).toBe('jueves, 1 de octubre de 2026');
  });

  it('does not take the number for part of the year or of a longer number', () => {
    expect(dayButtonName('Friday, October 2nd, 2026', '2')).toBe('2, Friday, October 2nd, 2026');
    expect(dayButtonName('Tuesday, October 20th, 2026', '2')).toBe(
      '2, Tuesday, October 20th, 2026'
    );
    expect(dayButtonName('Tuesday, October 6th, 2026', '26')).toBe(
      '26, Tuesday, October 6th, 2026'
    );
  });

  it('leaves a missing label, and a button with no text, alone', () => {
    expect(dayButtonName(undefined, '1')).toBeUndefined();
    expect(dayButtonName('Thursday, October 1st, 2026', '  ')).toBe('Thursday, October 1st, 2026');
  });

  it('matches a number written in another script', () => {
    expect(dayButtonName('गुरुवार, १ अक्टूबर २०२६', '१')).toBe('गुरुवार, १ अक्टूबर २०२६');
  });
});
