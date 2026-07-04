import { describe, it, expect } from 'vitest';
import { kindFromBody, eventIdFromBody } from './webhook';

// Pure parsing helpers — no Firestore, no network. They read deeply-nested PayMongo
// event shapes defensively and must never throw.

describe('kindFromBody', () => {
  it('reads data.attributes.data.attributes.metadata.kind', () => {
    const body = JSON.stringify({
      data: { attributes: { data: { attributes: { metadata: { kind: 'order' } } } } },
    });
    expect(kindFromBody(body)).toBe('order');
  });

  it('reads a booking kind the same way', () => {
    const body = JSON.stringify({
      data: { attributes: { data: { attributes: { metadata: { kind: 'booking' } } } } },
    });
    expect(kindFromBody(body)).toBe('booking');
  });

  it('returns null when the metadata.kind is missing', () => {
    const body = JSON.stringify({
      data: { attributes: { data: { attributes: { metadata: {} } } } },
    });
    expect(kindFromBody(body)).toBeNull();
  });

  it('returns null when intermediate nodes are absent', () => {
    expect(kindFromBody(JSON.stringify({ data: { attributes: {} } }))).toBeNull();
    expect(kindFromBody(JSON.stringify({}))).toBeNull();
  });

  it('returns null on malformed JSON instead of throwing', () => {
    expect(kindFromBody('not-json{')).toBeNull();
    expect(kindFromBody('')).toBeNull();
  });
});

describe('eventIdFromBody', () => {
  it('reads data.id', () => {
    expect(eventIdFromBody(JSON.stringify({ data: { id: 'evt_123' } }))).toBe('evt_123');
  });

  it('returns null when data.id is missing', () => {
    expect(eventIdFromBody(JSON.stringify({ data: {} }))).toBeNull();
    expect(eventIdFromBody(JSON.stringify({}))).toBeNull();
  });

  it('returns null on malformed JSON instead of throwing', () => {
    expect(eventIdFromBody('garbage')).toBeNull();
    expect(eventIdFromBody('')).toBeNull();
  });
});
