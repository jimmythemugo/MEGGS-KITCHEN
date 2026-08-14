import { describe, it, expect } from 'vitest';
import {
  cn,
  formatKES,
  telHref,
  formatPhone,
  formatDate,
  formatDateTime,
  slugify,
} from './utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('foo', false && 'bar', undefined, 'baz')).toBe('foo baz');
  });
});

describe('formatKES', () => {
  it('formats a number as Kenyan Shillings without decimals', () => {
    const result = formatKES(12500);
    expect(result).toContain('12,500');
    expect(result).toMatch(/ksh/i);
  });

  it('handles zero', () => {
    expect(formatKES(0)).toContain('0');
  });
});

describe('telHref', () => {
  it('strips non-numeric characters except the leading plus', () => {
    expect(telHref('+254 700 123 456')).toBe('tel:+254700123456');
    expect(telHref('(020) 123-4567')).toBe('tel:0201234567');
  });
});

describe('formatPhone', () => {
  it('formats a 254-prefixed international number', () => {
    expect(formatPhone('254700123456')).toBe('+254 700 123 456');
  });

  it('formats a local 0-prefixed 10-digit number', () => {
    expect(formatPhone('0700123456')).toBe('0700 123 456');
  });

  it('returns the input unchanged when it matches no known pattern', () => {
    expect(formatPhone('12345')).toBe('12345');
  });
});

describe('formatDate / formatDateTime', () => {
  it('formats an ISO date string', () => {
    const out = formatDate('2026-01-15T10:00:00Z');
    expect(out).toContain('2026');
  });

  it('formats an ISO date-time string', () => {
    const out = formatDateTime('2026-01-15T10:00:00Z');
    expect(out).toContain('2026');
  });
});

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Commercial Cookware & Pots')).toBe('commercial-cookware-pots');
  });

  it('collapses repeated hyphens', () => {
    expect(slugify('A---B')).toBe('a-b');
  });
});
