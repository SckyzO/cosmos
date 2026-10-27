import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeTicker } from './ticker';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('subscribeTicker', () => {
  it('calls the listener after each delay, and not before', () => {
    const listener = vi.fn();
    const stop = subscribeTicker(() => 1000, listener);
    vi.advanceTimersByTime(999);
    expect(listener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(3000);
    expect(listener).toHaveBeenCalledTimes(4);
    stop();
  });

  it('shares one timer between subscribers and wakes each at its own time', () => {
    const fast = vi.fn();
    const slow = vi.fn();
    const stopFast = subscribeTicker(() => 1000, fast);
    const stopSlow = subscribeTicker(() => 5000, slow);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(5000);
    expect(fast).toHaveBeenCalledTimes(5);
    expect(slow).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);
    stopFast();
    stopSlow();
  });

  it('asks for the delay again at every tick, so a boundary does not drift', () => {
    const delays = [1000, 400, 1000];
    const listener = vi.fn();
    const stop = subscribeTicker(() => delays.shift() ?? 1000, listener);
    vi.advanceTimersByTime(1000);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(399);
    expect(listener).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(listener).toHaveBeenCalledTimes(2);
    stop();
  });

  it('stops the timer with the last subscriber', () => {
    const stopA = subscribeTicker(() => 1000, vi.fn());
    const stopB = subscribeTicker(() => 1000, vi.fn());
    stopA();
    expect(vi.getTimerCount()).toBe(1);
    stopB();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('parks a subscriber whose delay is null', () => {
    const listener = vi.fn();
    const delays: (number | null)[] = [1000, null];
    const stop = subscribeTicker(() => delays.shift() ?? null, listener);
    vi.advanceTimersByTime(10_000);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    stop();
  });

  it('survives a listener that unsubscribes', () => {
    const other = vi.fn();
    let stopSelf = () => {};
    stopSelf = subscribeTicker(
      () => 1000,
      () => stopSelf()
    );
    const stopOther = subscribeTicker(() => 1000, other);
    vi.advanceTimersByTime(2000);
    expect(other).toHaveBeenCalledTimes(2);
    stopOther();
  });

  it('waits out a delay longer than a timeout can hold', () => {
    const listener = vi.fn();
    const stop = subscribeTicker(() => 30 * 24 * 3600 * 1000, listener);
    vi.advanceTimersByTime(29 * 24 * 3600 * 1000);
    expect(listener).not.toHaveBeenCalled();
    vi.advanceTimersByTime(24 * 3600 * 1000);
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });
});
