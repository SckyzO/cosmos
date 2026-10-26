import { ReferenceArea, ReferenceLine } from 'recharts';
import { describe, expect, it } from 'vitest';
import { INTENT_COLORS } from './colors';
import { referenceMarks } from './reference';

const props = (mark: { props: unknown }) => mark.props as Record<string, unknown>;

describe('referenceMarks', () => {
  it('draws the bands first, then the lines', () => {
    const marks = referenceMarks({
      referenceLines: [{ value: 80 }],
      referenceBands: [{ from: 10, to: 20 }],
    });
    expect(marks.map((m) => m.type)).toEqual([ReferenceArea, ReferenceLine]);
  });

  it('puts the value on y, or on x for horizontal bars', () => {
    const [line] = referenceMarks({ referenceLines: [{ value: 5 }] });
    expect(props(line)).toMatchObject({ y: 5 });
    expect(props(line)).not.toHaveProperty('x');
    const [band] = referenceMarks({ referenceBands: [{ from: 2, to: 4 }], axis: 'x' });
    expect(props(band)).toMatchObject({ x1: 2, x2: 4 });
    expect(props(band)).not.toHaveProperty('y1');
  });

  it('orders the ends of a band', () => {
    const [band] = referenceMarks({ referenceBands: [{ from: 9, to: 3 }] });
    expect(props(band)).toMatchObject({ y1: 3, y2: 9 });
  });

  it('takes its color from the intent, neutral by default', () => {
    const [plain, danger] = referenceMarks({
      referenceLines: [{ value: 1 }, { value: 2, intent: 'danger' }],
    });
    expect(props(plain).stroke).toBe(INTENT_COLORS.neutral);
    expect(props(danger).stroke).toBe(INTENT_COLORS.danger);
  });

  it('dashes a line only when asked', () => {
    const [solid, dashed] = referenceMarks({
      referenceLines: [{ value: 1 }, { value: 2, dashed: true }],
    });
    expect(props(solid).strokeDasharray).toBeUndefined();
    expect(props(dashed).strokeDasharray).toBeTruthy();
  });

  it('reads another axis by id', () => {
    const [line] = referenceMarks({ referenceLines: [{ value: 1 }], axisId: 'right' });
    expect(props(line)).toMatchObject({ yAxisId: 'right' });
  });

  it('draws a label only when there is one', () => {
    const [bare, labelled] = referenceMarks({
      referenceLines: [{ value: 1 }, { value: 2, label: 'Limit' }],
    });
    expect(props(bare).label).toBeUndefined();
    expect(props(labelled).label).toMatchObject({ value: 'Limit' });
  });
});
