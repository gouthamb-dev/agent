import { describe, it, expect } from 'vitest';

describe('Project Setup', () => {
  it('should have jsdom environment configured', () => {
    expect(typeof document).toBe('object');
    expect(typeof window).toBe('object');
  });
});
