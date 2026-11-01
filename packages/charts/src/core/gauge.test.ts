import { describe, expect, it } from 'vitest';
import { STATUS_CRIT, STATUS_WARN, SUCCESS } from './colors';
import {
  arcAngle,
  arcMark,
  clampTo,
  gaugeName,
  needleOf,
  percent,
  rangeShare,
  statusColor,
  trackRing,
  zoneSpans,
} from './gauge';

describe('percent', () => {
  it('appends a percent sign to the value', () => {
    expect(percent(0)).toBe('0%');
    expect(percent(99.5)).toBe('99.5%');
    expect(percent(-3)).toBe('-3%');
  });
});

describe('clampTo', () => {
  it('keeps a value in the range and stops one outside at its end', () => {
    expect(clampTo(50, 0, 100)).toBe(50);
    expect(clampTo(2600, 0, 2000)).toBe(2000);
    expect(clampTo(120, 500, 2000)).toBe(500);
  });
});

describe('gaugeName', () => {
  it('ends the name with the formatted value', () => {
    expect(gaugeName('Cluster load', '67%')).toBe('Cluster load: 67%');
  });
});

describe('statusColor', () => {
  it('is success below the warning threshold', () => {
    expect(statusColor(69.9, 70, 90)).toBe(SUCCESS);
  });

  it('turns to warning at warnAt and to critical at critAt', () => {
    expect(statusColor(70, 70, 90)).toBe(STATUS_WARN);
    expect(statusColor(89.9, 70, 90)).toBe(STATUS_WARN);
    expect(statusColor(90, 70, 90)).toBe(STATUS_CRIT);
  });

  it('reaches only the thresholds that are set', () => {
    expect(statusColor(99, undefined, 90)).toBe(STATUS_CRIT);
    expect(statusColor(80, undefined, 90)).toBe(SUCCESS);
    expect(statusColor(99, 70, undefined)).toBe(STATUS_WARN);
  });
});

describe('rangeShare', () => {
  it('is the place of the value in the range', () => {
    expect(rangeShare(50, 0, 100)).toBe(0.5);
    expect(rangeShare(1450, 0, 2000)).toBe(0.725);
    expect(rangeShare(27, 10, 45)).toBeCloseTo(17 / 35);
  });

  it('stops a value outside the range at an end', () => {
    expect(rangeShare(2600, 0, 2000)).toBe(1);
    expect(rangeShare(120, 500, 2000)).toBe(0);
  });
});

describe('arcMark', () => {
  const center = { cx: 100, cy: 100 };
  const across = { inner: 60, outer: 80 };

  it('lies along the left of the center at the start of the arc', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([40, 100, 20, 100]);
  });

  it('stands straight above the center halfway', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0.5);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([100, 40, 100, 20]);
  });

  it('lies along the right of the center at the end of the arc', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 1);
    expect([x1, y1, x2, y2].map(Math.round)).toEqual([160, 100, 180, 100]);
  });

  it('turns clockwise from the left end: 80% is 36 degrees above the right end', () => {
    const { x1, y1, x2, y2 } = arcMark(center, across, 0.8);
    const degrees = (Math.atan2(y1 - y2, x2 - x1) * 180) / Math.PI;
    expect(degrees).toBeCloseTo(36);
  });
});

describe('zoneSpans', () => {
  it('cuts the range into success, warning and critical at the two thresholds', () => {
    expect(zoneSpans(0, 100, 70, 90)).toEqual([
      { status: 'ok', from: 0, to: 0.7 },
      { status: 'warn', from: 0.7, to: 0.9 },
      { status: 'crit', from: 0.9, to: 1 },
    ]);
  });

  it('reads the thresholds in the units of the value, on min to max', () => {
    const spans = zoneSpans(10, 45, 24.5, 38);
    expect(spans.map((span) => span.status)).toEqual(['ok', 'warn', 'crit']);
    expect(spans.map((span) => span.from)).toEqual([0, expect.closeTo(0.4143, 3), 0.8]);
    expect(spans.map((span) => span.to)).toEqual([expect.closeTo(0.4143, 3), 0.8, 1]);
  });

  it('draws only the zones of the thresholds that are set', () => {
    expect(zoneSpans(0, 100, undefined, 90)).toEqual([
      { status: 'ok', from: 0, to: 0.9 },
      { status: 'crit', from: 0.9, to: 1 },
    ]);
    expect(zoneSpans(0, 100, 70, undefined)).toEqual([
      { status: 'ok', from: 0, to: 0.7 },
      { status: 'warn', from: 0.7, to: 1 },
    ]);
  });

  it('draws no zone without a threshold', () => {
    expect(zoneSpans(0, 100)).toEqual([]);
  });

  it('stops a threshold outside the range at an end and drops the zone that leaves', () => {
    expect(zoneSpans(0, 100, -20, 90)).toEqual([
      { status: 'warn', from: 0, to: 0.9 },
      { status: 'crit', from: 0.9, to: 1 },
    ]);
    expect(zoneSpans(0, 100, 70, 400)).toEqual([
      { status: 'ok', from: 0, to: 0.7 },
      { status: 'warn', from: 0.7, to: 1 },
    ]);
  });

  it('agrees with statusColor: a warning threshold above the critical one never shows', () => {
    expect(zoneSpans(0, 100, 90, 70)).toEqual([
      { status: 'ok', from: 0, to: 0.7 },
      { status: 'crit', from: 0.7, to: 1 },
    ]);
    expect(statusColor(80, 90, 70)).toBe(STATUS_CRIT);
  });
});

describe('arcAngle', () => {
  it('is the angle, in degrees counterclockwise from the right, of a share of the arc', () => {
    expect(arcAngle(0)).toBe(180);
    expect(arcAngle(0.5)).toBe(90);
    expect(arcAngle(1)).toBe(0);
    expect(arcAngle(0.8)).toBeCloseTo(36);
  });
});

describe('needleOf', () => {
  const center = { cx: 100, cy: 100 };
  const size = { from: 40, to: 70, halfWidth: 4 };
  const rounded = (point: { x: number; y: number }) => [point.x, point.y].map(Math.round);

  it('stands straight above the center halfway, with its base across the radius', () => {
    const { tip, left, right } = needleOf(center, size, 0.5);
    expect(rounded(tip)).toEqual([100, 30]);
    expect([rounded(left), rounded(right)].sort()).toEqual([
      [104, 60],
      [96, 60],
    ]);
  });

  it('lies along the left of the center at the start of the arc, and the right at its end', () => {
    expect(rounded(needleOf(center, size, 0).tip)).toEqual([30, 100]);
    expect(rounded(needleOf(center, size, 1).tip)).toEqual([170, 100]);
  });

  it('turns clockwise from the left end: 80% is 36 degrees above the right end', () => {
    const { tip } = needleOf(center, size, 0.8);
    const degrees = (Math.atan2(center.cy - tip.y, tip.x - center.cx) * 180) / Math.PI;
    expect(degrees).toBeCloseTo(36);
    expect(Math.hypot(tip.x - center.cx, tip.y - center.cy)).toBeCloseTo(70);
  });

  it('puts the two corners of its base at the inner radius, half a width from the radius', () => {
    const { tip, left, right } = needleOf(center, size, 0.3);
    const along = [tip.x - center.cx, tip.y - center.cy].map((v) => v / 70);
    for (const corner of [left, right]) {
      const [dx, dy] = [corner.x - center.cx, corner.y - center.cy];
      // 40 along the radius, 4 across it.
      expect(dx * along[0] + dy * along[1]).toBeCloseTo(40);
      expect(Math.abs(dx * along[1] - dy * along[0])).toBeCloseTo(4);
    }
    expect(left).not.toEqual(right);
  });
});

describe('trackRing', () => {
  it('is nine tenths of the band, centered, with the offset rounded to a pixel', () => {
    const { innerRadius, outerRadius } = trackRing(116, 23);
    expect(innerRadius).toBe(94);
    expect(outerRadius).toBeCloseTo(114.7);
  });

  it('stays inside the band of a thin ring', () => {
    const { innerRadius, outerRadius } = trackRing(60, 8);
    expect(innerRadius).toBe(52);
    expect(outerRadius).toBeCloseTo(59.2);
  });
});
