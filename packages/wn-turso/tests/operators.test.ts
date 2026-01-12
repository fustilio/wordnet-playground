/**
 * Operators tests
 */

import { describe, it, expect } from 'vitest';
import {
  filter,
  map,
  transform,
  extend,
  batch,
  unbatch,
  tap,
  take,
  skip,
  distinct,
  compose,
} from '../src/pipeline/operators.js';

// Helper to collect async iterable
async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) {
    result.push(item);
  }
  return result;
}

// Helper to create async iterable from array
async function* fromArray<T>(arr: T[]): AsyncIterable<T> {
  for (const item of arr) {
    yield item;
  }
}

describe('Operators', () => {
  const testData = [
    { id: 1, value: 10 },
    { id: 2, value: 20 },
    { id: 3, value: 30 },
    { id: 4, value: 40 },
    { id: 5, value: 50 },
  ];

  describe('filter()', () => {
    it('should filter items by predicate', async () => {
      const op = filter<typeof testData[0]>(item => item.value > 25);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual([3, 4, 5]);
    });

    it('should return empty for no matches', async () => {
      const op = filter<typeof testData[0]>(item => item.value > 100);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(0);
    });
  });

  describe('map()', () => {
    it('should transform items', async () => {
      const op = map<typeof testData[0], number>(item => item.value * 2);
      const result = await collect(op(fromArray(testData)));

      expect(result).toEqual([20, 40, 60, 80, 100]);
    });
  });

  describe('transform()', () => {
    it('should transform and filter nulls', async () => {
      const op = transform<typeof testData[0], number>(item =>
        item.value > 25 ? item.value : null
      );
      const result = await collect(op(fromArray(testData)));

      expect(result).toEqual([30, 40, 50]);
    });
  });

  describe('extend()', () => {
    it('should add properties', async () => {
      const op = extend<typeof testData[0], { doubled: number }>(item => ({
        doubled: item.value * 2,
      }));
      const result = await collect(op(fromArray(testData)));

      expect(result[0]).toEqual({ id: 1, value: 10, doubled: 20 });
    });
  });

  describe('batch()', () => {
    it('should batch items', async () => {
      const op = batch<typeof testData[0]>(2);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveLength(2);
      expect(result[2]).toHaveLength(1);
    });

    it('should handle empty input', async () => {
      const op = batch<typeof testData[0]>(2);
      const result = await collect(op(fromArray([])));

      expect(result).toHaveLength(0);
    });
  });

  describe('unbatch()', () => {
    it('should flatten batched items', async () => {
      const batched = [[1, 2], [3, 4], [5]];
      const op = unbatch<number>();
      const result = await collect(op(fromArray(batched)));

      expect(result).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('tap()', () => {
    it('should execute side effect', async () => {
      const sideEffects: number[] = [];
      const op = tap<typeof testData[0]>(item => sideEffects.push(item.id));
      const result = await collect(op(fromArray(testData)));

      expect(result).toEqual(testData);
      expect(sideEffects).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('take()', () => {
    it('should take first n items', async () => {
      const op = take<typeof testData[0]>(3);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual([1, 2, 3]);
    });

    it('should handle n > length', async () => {
      const op = take<typeof testData[0]>(100);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(5);
    });
  });

  describe('skip()', () => {
    it('should skip first n items', async () => {
      const op = skip<typeof testData[0]>(2);
      const result = await collect(op(fromArray(testData)));

      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual([3, 4, 5]);
    });
  });

  describe('distinct()', () => {
    it('should remove duplicates by key', async () => {
      const dataWithDupes = [
        { id: 1, group: 'a' },
        { id: 2, group: 'a' },
        { id: 3, group: 'b' },
        { id: 4, group: 'b' },
      ];
      const op = distinct<typeof dataWithDupes[0], string>(item => item.group);
      const result = await collect(op(fromArray(dataWithDupes)));

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual([1, 3]);
    });
  });

  describe('compose()', () => {
    it('should compose two operators', async () => {
      const composed = compose(
        filter<typeof testData[0]>(item => item.value > 20),
        map(item => item.value)
      );
      const result = await collect(composed(fromArray(testData)));

      expect(result).toEqual([30, 40, 50]);
    });

    it('should compose three operators', async () => {
      const composed = compose(
        filter<typeof testData[0]>(item => item.value > 20),
        map(item => ({ ...item, doubled: item.value * 2 })),
        take(2)
      );
      const result = await collect(composed(fromArray(testData)));

      expect(result).toHaveLength(2);
      expect(result[0].doubled).toBe(60);
    });
  });
});
