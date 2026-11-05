import { describe, expect, it } from 'vitest';
import { dayButtonName, dayPickerLabels } from './calendarLabels';
import { CALENDAR_LABELS, type CalendarLabels } from './labels';

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

describe('dayPickerLabels', () => {
  const thursday = new Date(2026, 4, 7);
  const state = (today: boolean, selected: boolean) => ({ today, selected }) as never;

  it('hands over nothing when the app set no label, so the locale keeps its own', () => {
    expect(dayPickerLabels(CALENDAR_LABELS, {})).toEqual({});
  });

  it('hands over only the keys the app set, written from the resolved labels', () => {
    const labels: CalendarLabels = { ...CALENDAR_LABELS, previousMonth: 'Mois précédent' };
    const handed = dayPickerLabels(labels, { previousMonth: 'Mois précédent' });
    expect(Object.keys(handed)).toEqual(['labelPrevious']);
    expect(handed.labelPrevious?.(undefined)).toBe('Mois précédent');
  });

  it('names the buttons, the dropdowns, the navigation and the week numbers', () => {
    const given = {
      navigation: 'Navigation du mois',
      nextMonth: 'Mois suivant',
      monthDropdown: 'Choisir le mois',
      yearDropdown: "Choisir l'année",
      weekNumber: (week: number) => `Semaine ${week}`,
      weekNumberHeader: 'Numéro de semaine',
    };
    const handed = dayPickerLabels({ ...CALENDAR_LABELS, ...given }, given);
    expect(handed.labelNav?.()).toBe('Navigation du mois');
    expect(handed.labelNext?.(undefined)).toBe('Mois suivant');
    expect(handed.labelMonthDropdown?.()).toBe('Choisir le mois');
    expect(handed.labelYearDropdown?.()).toBe("Choisir l'année");
    expect(handed.labelWeekNumber?.(19)).toBe('Semaine 19');
    expect(handed.labelWeekNumberHeader?.()).toBe('Numéro de semaine');
  });

  it('writes a day from its full date, its today and selected parts, as the button and the cell', () => {
    const day = (date: string, { today, selected }: { today: boolean; selected: boolean }) =>
      `${today ? "Aujourd'hui, " : ''}${date}${selected ? ', sélectionné' : ''}`;
    const handed = dayPickerLabels({ ...CALENDAR_LABELS, day }, { day });
    expect(handed.labelDayButton?.(thursday, state(true, true))).toBe(
      "Aujourd'hui, Thursday, May 7th, 2026, sélectionné"
    );
    expect(handed.labelDayButton?.(thursday, state(false, false))).toBe('Thursday, May 7th, 2026');
    // A cell with no `mode` is never selected.
    expect(handed.labelGridcell?.(thursday, state(true, true))).toBe(
      "Aujourd'hui, Thursday, May 7th, 2026"
    );
  });

  it("lets the app's own react-day-picker labels win, and drops the keys that are not its", () => {
    const own = { labelNext: () => 'raw', nextMonth: 'x', day: () => 'y' };
    const handed = dayPickerLabels(CALENDAR_LABELS, { nextMonth: 'Suivant' }, own);
    expect(handed.labelNext?.(undefined)).toBe('raw');
    expect(Object.keys(handed)).toEqual(['labelNext']);
  });
});
