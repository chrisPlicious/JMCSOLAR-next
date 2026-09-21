import { cn } from '@/lib/utils';
import { expect, test } from 'vitest';

test('cn keeps custom tokens', () => {
  expect(cn('text-h1', 'text-white')).toBe('text-h1 text-white');
  expect(cn('text-h1', 'text-h2')).toBe('text-h2');
  expect(cn('text-sm', 'text-h2')).toBe('text-h2');
  expect(cn('text-fg', 'text-white')).toBe('text-white');
  expect(cn('rounded-card', 'rounded-full')).toBe('rounded-full');
  expect(cn('shadow-soft', 'shadow-card-hover')).toBe('shadow-card-hover');
  expect(cn('shadow-soft', 'shadow-navy-900/10')).toBe('shadow-soft shadow-navy-900/10');
  expect(cn('bg-solar-500 text-navy-950', 'text-fg-muted')).toBe('bg-solar-500 text-fg-muted');
});
