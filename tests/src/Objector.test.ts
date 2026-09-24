// npx jest test
/* eslint-disable prefer-regex-literals */
/* eslint-disable no-self-compare */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Objector } from '../../src/Objector.js';
import { jest } from '@jest/globals';


describe('Object.deepClone', () => {
  it('should not keep object references', () => {
    const baz = { foo: 2 };
    const source = { a: 1, b: baz };

    const assigned = Object.assign({}, source);

    const spread = { ...source };

    expect(source === source).toBe(true);
    expect(source === assigned).toBe(false);
    expect(source === spread).toBe(false);
    expect(source.b === assigned.b).toBe(true);
    expect(source.b === spread.b).toBe(true);
    expect(Objector.deepClone(source) !== source).toBe(true);
    expect(Objector.deepClone(source).b !== source.b).toBe(true);
    expect(Objector.deepClone(source).b === source.b).toBe(false);
  });

  it('should handle circular references without infinite loops', () => {
    const obj: any = {};
    obj.self = obj;
    const cloned = Objector.deepClone(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.self).toBe(cloned);
    expect(cloned.self).not.toBe(obj.self);
  });

  it('should clone an array of primitives', () => {
    const arr = [1, 'test', true, null];
    const clonedArr = Objector.deepClone(arr);
    expect(clonedArr).toEqual(arr);
    expect(clonedArr).not.toBe(arr);
  });

  it('should clone Date objects', () => {
    const date = new Date();
    const obj = { date };
    const cloned = Objector.deepClone(obj);
    expect(cloned.date).toEqual(date);
    expect(cloned.date).not.toBe(date);
  });

  it('should clone RegExp objects', () => {
    const regex = new RegExp('abc', 'gi');
    const obj = { regex };
    const cloned = Objector.deepClone(obj);
    expect(cloned.regex).toEqual(regex);
    expect(cloned.regex).not.toBe(regex);
  });

  it('should clone Map objects', () => {
    const map = new Map<unknown, unknown>([['a', 1], ['b', { c: 2 }]]);
    const cloned = Objector.deepClone(map);
    expect(cloned).toEqual(map);
    expect(cloned).not.toBe(map);
    expect(cloned.get('b')).toEqual({ c: 2 });
    expect(cloned.get('b')).not.toBe(map.get('b'));
  });

  it('should clone Set objects', () => {
    const set = new Set([1, { a: 1 }]);
    const obj = { set };
    const cloned = Objector.deepClone(obj);
    expect(cloned.set).toEqual(set);
    expect(cloned.set).not.toBe(set);
    // Optional: check nested object
    const setArray = Array.from(set);
    const clonedSetArray = Array.from(cloned.set);
    expect(clonedSetArray[1]).not.toBe(setArray[1]);
  });

  it('should handle symbol properties', () => {
    const sym = Symbol('test');
    const obj = { [sym]: 'value' };
    const cloned = Objector.deepClone(obj);
    expect(cloned[sym]).toBe('value');
    expect(Object.getOwnPropertySymbols(cloned).length).toBe(1);
  });

  it('should not clone non-enumerable properties', () => {
    const obj: Record<string, unknown> = {};
    Object.defineProperty(obj, 'hidden', {
      value: 'secret',
      enumerable: false,
    });
    const cloned = Objector.deepClone(obj);
    expect(Object.keys(cloned).length).toBe(0);
    expect(cloned.hidden).toBeUndefined();
  });

  it('should return primitive types directly', () => {
    const num = 123;
    const str = 'test';
    const bool = true;
    expect(Objector.deepClone(num)).toBe(num);
    expect(Objector.deepClone(str)).toBe(str);
    expect(Objector.deepClone(bool)).toBe(bool);
  });

  it('should return null directly', () => {
    const result = Objector.deepClone(null);
    expect(result).toBeNull();
  });
});

describe('Objector.extender', () => {
  it('should throw if target is null or undefined', () => {
    expect(() => Objector.extender(null as any)).toThrow(TypeError);
    expect(() => Objector.extender(undefined as any)).toThrow(TypeError);
  });

  it('should copy enumerable own string properties with deep clone', () => {
    const target = { a: 1 };
    const source = { b: { nested: 2 } };
    const result = Objector.extender(target, source);

    expect(result).toHaveProperty('a', 1);
    expect(result).toHaveProperty('b');
    expect(result.b).toEqual({ nested: 2 });
    expect(result.b).not.toBe(source.b); // deep cloned, different reference
    expect(result).toBe(target); // mutated target returned
  });

  it('should copy enumerable own symbol properties with deep clone', () => {
    const sym = Symbol('foo');
    const target = {};
    const source = { [sym]: { nested: 'bar' } };
    const result = Objector.extender(target, source);

    expect(result[sym]).toEqual({ nested: 'bar' });
    expect(result[sym]).not.toBe(source[sym]); // deep cloned
  });

  it('should overwrite properties from earlier sources with later sources', () => {
    const target = { a: 1, b: 2 };
    const source1 = { b: 3 };
    const source2 = { a: 4 };

    const result = Objector.extender(target, source1, source2);
    expect(result.a).toBe(4);
    expect(result.b).toBe(3);
  });

  it('should ignore null and undefined sources', () => {
    const target = { a: 1 };
    const result = Objector.extender(target, null as any, undefined as any, { b: 2 });
    expect(result).toEqual({ a: 1, b: 2 });
  });

  it('should handle multiple sources', () => {
    const target = {};
    const source1 = { a: 1 };
    const source2 = { b: { nested: 2 } };
    const source3 = { c: 3 };

    const result = Objector.extender(target, source1, source2, source3);
    expect(result).toEqual({ a: 1, b: { nested: 2 }, c: 3 });
    expect(result.b).not.toBe(source2.b); // deep cloned
  });
});

describe('Objector.deepClone memoization', () => {
  // Every branch must register its clone in the memo before recursing,
  // otherwise self-referential structures recurse until the stack overflows
  // and repeated references are cloned into separate objects.

  it('should survive a self-referential array', () => {
    const arr: any = [1];
    arr.push(arr);

    const cloned = Objector.deepClone(arr);

    expect(cloned).not.toBe(arr);
    expect(cloned[0]).toBe(1);
    expect(cloned[1]).toBe(cloned);
  });

  it('should survive a self-referential Set', () => {
    const set: Set<unknown> = new Set();
    set.add('a');
    set.add(set);

    const cloned = Objector.deepClone(set);

    expect(cloned).not.toBe(set);
    expect(cloned.has('a')).toBe(true);
    expect(cloned.has(cloned)).toBe(true);
  });

  it('should survive a self-referential Map', () => {
    const map = new Map<string, unknown>();
    map.set('self', map);

    const cloned = Objector.deepClone(map);

    expect(cloned).not.toBe(map);
    expect(cloned.get('self')).toBe(cloned);
  });

  it('should survive an array and object referencing each other', () => {
    const obj: any = { name: 'parent' };
    const arr: any[] = [obj];
    obj.children = arr;

    const cloned = Objector.deepClone(obj);

    expect(cloned).not.toBe(obj);
    expect(cloned.children[0]).toBe(cloned);
  });

  it('should preserve shared references inside a Set', () => {
    const shared = { n: 1 };
    const cloned = Objector.deepClone({ direct: shared, set: new Set([shared]) });

    expect(cloned.direct).not.toBe(shared);
    expect([...cloned.set][0]).toBe(cloned.direct);
  });

  it('should preserve shared references to a Date', () => {
    const date = new Date('2026-01-01T00:00:00Z');
    const cloned = Objector.deepClone({ start: date, end: date });

    expect(cloned.start).not.toBe(date);
    expect(cloned.start).toBe(cloned.end);
    expect(cloned.start.getTime()).toBe(date.getTime());
  });

  it('should preserve shared references to a RegExp', () => {
    const re = new RegExp('abc', 'gi');
    const cloned = Objector.deepClone({ a: re, b: re });

    expect(cloned.a).not.toBe(re);
    expect(cloned.a).toBe(cloned.b);
    expect(cloned.a.source).toBe('abc');
    expect(cloned.a.flags).toBe('gi');
  });

  it('should deeply clone values held in a Set', () => {
    const inner = { n: 1 };
    const cloned = Objector.deepClone(new Set([inner]));
    const [clonedInner] = [...cloned];

    expect(clonedInner).not.toBe(inner);
    expect(clonedInner).toEqual({ n: 1 });
  });

  it('should preserve array holes as undefined rather than dropping them', () => {
    const cloned = Objector.deepClone([1, 2, 3]);

    expect(cloned).toEqual([1, 2, 3]);
    expect(cloned).toHaveLength(3);
  });
});

describe('Objector.deepEqual', () => {
  it('should compare primitives', () => {
    expect(Objector.deepEqual(1, 1)).toBe(true);
    expect(Objector.deepEqual('a', 'a')).toBe(true);
    expect(Objector.deepEqual(true, true)).toBe(true);
    expect(Objector.deepEqual(null, null)).toBe(true);
    expect(Objector.deepEqual(undefined, undefined)).toBe(true);

    expect(Objector.deepEqual(1, 2)).toBe(false);
    expect(Objector.deepEqual('a', 'b')).toBe(false);
    expect(Objector.deepEqual(null, undefined)).toBe(false);
    expect(Objector.deepEqual(1, '1')).toBe(false);
  });

  it('should treat NaN as equal to itself', () => {
    expect(Objector.deepEqual(NaN, NaN)).toBe(true);
    expect(Objector.deepEqual({ v: NaN }, { v: NaN })).toBe(true);
  });

  it('should distinguish +0 from -0', () => {
    expect(Objector.deepEqual(0, -0)).toBe(false);
  });

  it('should compare flat objects regardless of key order', () => {
    expect(Objector.deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(Objector.deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });

  it('should require the same number of keys', () => {
    expect(Objector.deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(Objector.deepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it('should not treat a missing key as an undefined value', () => {
    expect(Objector.deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
  });

  it('should compare nested structures', () => {
    expect(Objector.deepEqual(
      { a: [1, { b: 2 }] },
      { a: [1, { b: 2 }] },
    )).toBe(true);

    expect(Objector.deepEqual(
      { a: [1, { b: 2 }] },
      { a: [1, { b: 3 }] },
    )).toBe(false);
  });

  it('should compare arrays by order and length', () => {
    expect(Objector.deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(Objector.deepEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    expect(Objector.deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should not consider an array equal to an object', () => {
    expect(Objector.deepEqual([], {})).toBe(false);
  });

  it('should compare Dates by their instant', () => {
    expect(Objector.deepEqual(new Date('2026-01-01'), new Date('2026-01-01'))).toBe(true);
    expect(Objector.deepEqual(new Date('2026-01-01'), new Date('2026-01-02'))).toBe(false);
  });

  it('should compare RegExps by source and flags', () => {
    expect(Objector.deepEqual(/abc/gi, /abc/gi)).toBe(true);
    expect(Objector.deepEqual(/abc/g, /abc/i)).toBe(false);
    expect(Objector.deepEqual(/abc/, /abd/)).toBe(false);
  });

  it('should compare Maps by key and deep value', () => {
    const a = new Map([['x', { n: 1 }]]);
    const b = new Map([['x', { n: 1 }]]);
    const c = new Map([['x', { n: 2 }]]);
    const d = new Map([['y', { n: 1 }]]);

    expect(Objector.deepEqual(a, b)).toBe(true);
    expect(Objector.deepEqual(a, c)).toBe(false);
    expect(Objector.deepEqual(a, d)).toBe(false);
    expect(Objector.deepEqual(a, new Map())).toBe(false);
  });

  it('should compare Sets irrespective of insertion order', () => {
    expect(Objector.deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(Objector.deepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
    expect(Objector.deepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it('should compare Set members structurally', () => {
    expect(Objector.deepEqual(new Set([{ n: 1 }]), new Set([{ n: 1 }]))).toBe(true);
    expect(Objector.deepEqual(new Set([{ n: 1 }]), new Set([{ n: 2 }]))).toBe(false);
  });

  it('should not match two Set members against the same counterpart', () => {
    // Both members are structurally {n:1}, but the right side only has one.
    expect(Objector.deepEqual(
      new Set([{ n: 1 }, { n: 1 }]),
      new Set([{ n: 1 }, { n: 2 }]),
    )).toBe(false);
  });

  it('should compare symbol keys', () => {
    const sym = Symbol('id');

    expect(Objector.deepEqual({ [sym]: 1 }, { [sym]: 1 })).toBe(true);
    expect(Objector.deepEqual({ [sym]: 1 }, { [sym]: 2 })).toBe(false);
    expect(Objector.deepEqual({ [sym]: 1 }, {})).toBe(false);
  });

  it('should require matching prototypes', () => {
    class Point { constructor(public x: number) {} }

    expect(Objector.deepEqual(new Point(1), new Point(1))).toBe(true);
    expect(Objector.deepEqual(new Point(1), { x: 1 })).toBe(false);
    expect(Objector.deepEqual(Object.create(null), {})).toBe(false);
  });

  it('should survive circular references', () => {
    const a: any = { name: 'a' };
    a.self = a;
    const b: any = { name: 'a' };
    b.self = b;

    expect(Objector.deepEqual(a, b)).toBe(true);
  });

  it('should still detect a difference behind a cycle', () => {
    const a: any = { name: 'a' };
    a.self = a;
    const b: any = { name: 'different' };
    b.self = b;

    expect(Objector.deepEqual(a, b)).toBe(false);
  });

  it('should survive mutually referencing structures', () => {
    const buildPair = () => {
      const parent: any = { name: 'p' };
      const child: any = { name: 'c', parent };
      parent.child = child;
      return parent;
    };

    expect(Objector.deepEqual(buildPair(), buildPair())).toBe(true);
  });

  it('should consider a deep clone equal to its source', () => {
    const source = {
      n: 1,
      list: [1, { deep: true }],
      when: new Date('2026-03-01'),
      pattern: /x/g,
      map: new Map([['k', 'v']]),
      set: new Set([1, 2]),
    };

    expect(Objector.deepEqual(source, Objector.deepClone(source))).toBe(true);
  });

  it('should notice a change made to a clone', () => {
    const source = { list: [1, 2, 3] };
    const clone = Objector.deepClone(source);
    clone.list[1] = 99;

    expect(Objector.deepEqual(source, clone)).toBe(false);
  });
});

