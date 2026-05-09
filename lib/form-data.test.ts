import { describe, it, expect } from 'vitest';
import { requireField, optionalField } from './form-data';

describe('requireField', () => {
  it('returns trimmed value when present', () => {
    const fd = new FormData();
    fd.set('name', '  JMC Solar  ');
    expect(requireField(fd, 'name')).toBe('JMC Solar');
  });

  it('returns null for blank string', () => {
    const fd = new FormData();
    fd.set('name', '   ');
    expect(requireField(fd, 'name')).toBeNull();
  });

  it('returns null for missing key', () => {
    expect(requireField(new FormData(), 'name')).toBeNull();
  });
});

describe('optionalField', () => {
  it('returns value when present', () => {
    const fd = new FormData();
    fd.set('notes', 'hello');
    expect(optionalField(fd, 'notes')).toBe('hello');
  });

  it('returns null for missing key', () => {
    expect(optionalField(new FormData(), 'notes')).toBeNull();
  });

  it('returns null for blank string', () => {
    const fd = new FormData();
    fd.set('notes', '  ');
    expect(optionalField(fd, 'notes')).toBeNull();
  });
});
