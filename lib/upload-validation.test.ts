import { describe, it, expect } from 'vitest';
import { validateImageUpload } from './upload-validation';

function makeFile(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

function strBytes(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

describe('validateImageUpload magic bytes', () => {
  it('accepts valid JPEG', async () => {
    const f = makeFile([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10], 'photo.jpg', 'image/jpeg');
    expect(await validateImageUpload(f)).toBeNull();
  });

  it('accepts valid PNG', async () => {
    const f = makeFile([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], 'img.png', 'image/png');
    expect(await validateImageUpload(f)).toBeNull();
  });

  it('rejects PHP disguised as JPEG', async () => {
    const f = makeFile(strBytes('<?php echo 1; ?>'), 'evil.jpg', 'image/jpeg');
    expect(await validateImageUpload(f)).toMatch(/magic bytes/i);
  });

  it('rejects HTML disguised as PNG', async () => {
    const f = makeFile(strBytes('<html>'), 'evil.png', 'image/png');
    expect(await validateImageUpload(f)).toMatch(/magic bytes/i);
  });

  it('rejects file exceeding size limit', async () => {
    const f = new File([new Uint8Array(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    expect(await validateImageUpload(f)).toMatch(/10 MB/);
  });

  it('rejects disallowed MIME type', async () => {
    const f = makeFile([0x25, 0x50, 0x44, 0x46], 'doc.pdf', 'application/pdf');
    expect(await validateImageUpload(f)).toMatch(/not allowed/i);
  });
});
