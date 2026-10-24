import { describe, expect, it, vi } from 'vitest';
import type { MutableRefObject } from 'react';
import { mergeRefs } from './mergeRefs';

const objectRef = <T>(): MutableRefObject<T | null> => ({ current: null });

describe('mergeRefs', () => {
  it('calls every callback ref with the node', () => {
    const a = vi.fn();
    const b = vi.fn();
    const node = { id: 'node' };
    mergeRefs<object>(a, b)(node);
    expect(a).toHaveBeenCalledExactlyOnceWith(node);
    expect(b).toHaveBeenCalledExactlyOnceWith(node);
  });

  it('assigns the node to every object ref', () => {
    const a = objectRef<object>();
    const b = objectRef<object>();
    const node = { id: 'node' };
    mergeRefs<object>(a, b)(node);
    expect(a.current).toBe(node);
    expect(b.current).toBe(node);
  });

  it('mixes callback and object refs', () => {
    const callback = vi.fn();
    const object = objectRef<object>();
    const node = {};
    mergeRefs<object>(callback, object)(node);
    expect(callback).toHaveBeenCalledWith(node);
    expect(object.current).toBe(node);
  });

  it('passes null on to every ref, as React does on unmount', () => {
    const callback = vi.fn();
    const object = objectRef<object>();
    object.current = {};
    mergeRefs<object>(callback, object)(null);
    expect(callback).toHaveBeenCalledWith(null);
    expect(object.current).toBeNull();
  });

  it('skips undefined and null refs', () => {
    const callback = vi.fn();
    const merged = mergeRefs<object>(undefined, callback, null);
    expect(() => merged({})).not.toThrow();
    expect(callback).toHaveBeenCalledOnce();
  });

  it('merges nothing into a ref that does nothing', () => {
    expect(() => mergeRefs<object>()({})).not.toThrow();
  });

  it('returns one cleanup that runs the cleanups the refs returned', () => {
    const cleanup = vi.fn();
    const ref = vi.fn(() => cleanup);
    const detach = mergeRefs<object>(ref)({});
    expect(cleanup).not.toHaveBeenCalled();
    (detach as () => void)();
    expect(cleanup).toHaveBeenCalledOnce();
    // React 19 calls the cleanup instead of the ref with null: so must the merge.
    expect(ref).toHaveBeenCalledOnce();
  });

  it('resets, on cleanup, the refs that returned none', () => {
    const callback = vi.fn();
    const object = objectRef<object>();
    const detach = mergeRefs<object>(callback, object)({});
    (detach as () => void)();
    expect(callback).toHaveBeenLastCalledWith(null);
    expect(object.current).toBeNull();
  });
});
