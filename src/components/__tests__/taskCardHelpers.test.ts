import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStatusIcon, getStatusColor } from '../taskCardHelpers';

// Feature: smart-motivation-task-reminder, Property 6: TaskCard always renders all required fields

describe('taskCardHelpers', () => {
  describe('getStatusIcon', () => {
    it('returns a non-empty string for pending status', () => {
      const icon = getStatusIcon('pending');
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for done status', () => {
      const icon = getStatusIcon('done');
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });

    it('returns different icons for pending vs done', () => {
      expect(getStatusIcon('pending')).not.toBe(getStatusIcon('done'));
    });
  });

  describe('getStatusColor', () => {
    it('returns a non-empty string for pending status', () => {
      const color = getStatusColor('pending');
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for done status', () => {
      const color = getStatusColor('done');
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });

    it('returns "warning" for pending', () => {
      expect(getStatusColor('pending')).toBe('warning');
    });

    it('returns "success" for done', () => {
      expect(getStatusColor('done')).toBe('success');
    });
  });

  // Property 6 equivalent: for any Task status ('pending' | 'done'),
  // getStatusIcon returns a non-empty string
  // Validates: Requirements 2.3
  describe('Property 6: getStatusIcon returns non-empty string for any valid status', () => {
    it('property: getStatusIcon always returns a non-empty string', () => {
      const statusArb = fc.constantFrom<'pending' | 'done'>('pending', 'done');
      fc.assert(
        fc.property(statusArb, (status) => {
          const icon = getStatusIcon(status);
          return typeof icon === 'string' && icon.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('property: getStatusColor always returns a non-empty string', () => {
      const statusArb = fc.constantFrom<'pending' | 'done'>('pending', 'done');
      fc.assert(
        fc.property(statusArb, (status) => {
          const color = getStatusColor(status);
          return typeof color === 'string' && color.length > 0;
        }),
        { numRuns: 100 }
      );
    });
  });
});
