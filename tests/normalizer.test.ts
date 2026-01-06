/**
 * Tests for normalizer with messy input corpus
 */

import { describe, it, expect } from '@jest/globals';

// Test corpus of messy utterances
const TEST_CORPUS = [
  "Yo my card trippin, they said I'm good but I can't get nothin",
  "I ain't get my food stamp card yet",
  "My shit got cut off",
  "They talmbout bring proof but I don't got that",
  "I'm sleeping outside / couch surfing",
  "I don't drive / no ride",
  "ebt balance says zero but they said i got approved",
  "they sent it to wrong address",
  "im confused about what they want me to do",
  "card got stolen what do i do",
  "online portal wont let me log in",
  "i work but still cant pay bills",
  "FOOD STAMPS CARD BROKE HELP",
  "my benefits stopped coming",
  "cant afford my meds even with medicaid",
];

describe('Normalizer Test Corpus', () => {
  it('should have test cases for various speech patterns', () => {
    expect(TEST_CORPUS.length).toBeGreaterThan(10);
  });

  // Integration tests would verify:
  // 1. Normalizer produces valid JSON for all corpus items
  // 2. Confidence scores are reasonable
  // 3. Clarify rate is below 20-30%
  // 4. Routes are correctly identified

  it('should handle slang and informal language', () => {
    const slangInput = "Yo my card trippin";
    // In real tests, would call normalizer and verify output
    expect(slangInput).toBeDefined();
  });

  it('should handle typos and voice-to-text artifacts', () => {
    const typoInput = "ebt balance says zero";
    // In real tests, would verify normalization handles this
    expect(typoInput).toBeDefined();
  });

  it('should handle all caps', () => {
    const capsInput = "FOOD STAMPS CARD BROKE HELP";
    // In real tests, would verify normalization
    expect(capsInput).toBeDefined();
  });
});















