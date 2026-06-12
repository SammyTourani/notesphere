import { describe, it, expect, beforeEach } from 'vitest'
import { SuggestionIntelligenceService } from '../src/features/grammar/services/SuggestionService.js'

// Unit tests for the suggestion-classification engine. This is the safety gate
// that decides whether a grammar fix is applied automatically, offered for
// review, or left to the user. It is pure heuristic code (Levenshtein distance,
// pattern matching, weighted scoring) with no external dependencies, so we test
// the real algorithms directly. We deliberately pin the *actual* conservative
// outcomes the scoring produces rather than idealized expectations.

describe('SuggestionIntelligenceService.getEditDistance (Levenshtein)', () => {
  let svc
  beforeEach(() => {
    svc = new SuggestionIntelligenceService()
  })

  it('returns 0 for identical strings', () => {
    expect(svc.getEditDistance('abc', 'abc')).toBe(0)
  })

  it('returns the length when one string is empty', () => {
    expect(svc.getEditDistance('', 'abc')).toBe(3)
    expect(svc.getEditDistance('abc', '')).toBe(3)
  })

  it('counts the canonical kitten -> sitting distance of 3', () => {
    expect(svc.getEditDistance('kitten', 'sitting')).toBe(3)
  })

  it('counts a two-character transposition fix (recieve -> receive) as 2', () => {
    expect(svc.getEditDistance('recieve', 'receive')).toBe(2)
  })

  it('is symmetric', () => {
    expect(svc.getEditDistance('flaw', 'lawn')).toBe(svc.getEditDistance('lawn', 'flaw'))
  })
})

describe('SuggestionIntelligenceService scoring helpers', () => {
  let svc
  beforeEach(() => {
    svc = new SuggestionIntelligenceService()
  })

  it('calculateLengthSimilarity is the min/max length ratio', () => {
    expect(svc.calculateLengthSimilarity('abc', 'abcdef')).toBeCloseTo(0.5, 5)
    expect(svc.calculateLengthSimilarity('abcdef', 'abc')).toBeCloseTo(0.5, 5)
  })

  it('calculateLengthSimilarity returns 1 for two empty strings (no divide by zero)', () => {
    expect(svc.calculateLengthSimilarity('', '')).toBe(1)
  })

  it('calculateEditDistanceConfidence falls as normalized distance rises', () => {
    expect(svc.calculateEditDistanceConfidence('abc', 'abc')).toBe(1)
    // recieve->receive: distance 2 over length 7 => 1 - 2/7
    expect(svc.calculateEditDistanceConfidence('recieve', 'receive')).toBeCloseTo(1 - 2 / 7, 5)
  })

  it('getCategoryConfidence favors spelling over style and defaults unknowns', () => {
    expect(svc.getCategoryConfidence('spelling')).toBeGreaterThan(svc.getCategoryConfidence('style'))
    expect(svc.getCategoryConfidence('totally-unknown-category')).toBe(0.5)
  })

  it('assessMeaningPreservation measures the fraction of preserved words', () => {
    expect(svc.assessMeaningPreservation('the cat sat', 'the cat ran')).toBeCloseTo(2 / 3, 5)
    expect(svc.assessMeaningPreservation('cat', 'dog')).toBe(0)
  })
})

describe('SuggestionIntelligenceService pattern matching', () => {
  let svc
  beforeEach(() => {
    svc = new SuggestionIntelligenceService()
  })

  it('flags a known common misspelling as an auto-fix pattern', () => {
    expect(svc.matchesAutoFixPatterns('recieve', 'receive')).toBe(true)
  })

  it('flags a tiny single-word edit (distance <= 2) as an auto-fix pattern', () => {
    expect(svc.matchesAutoFixPatterns('color', 'colour')).toBe(true)
  })

  it('does not auto-fix an unrelated word swap', () => {
    expect(svc.matchesAutoFixPatterns('cat', 'elephant')).toBe(false)
  })

  it('flags very long suggestions as manual-only', () => {
    expect(svc.matchesManualOnlyPatterns('x', 'a'.repeat(55))).toBe(true)
  })

  it('flags multi-sentence suggestions as manual-only', () => {
    expect(svc.matchesManualOnlyPatterns('x', 'First idea. Second idea.')).toBe(true)
  })

  it('does not flag a short single-word suggestion as manual-only', () => {
    expect(svc.matchesManualOnlyPatterns('x', 'y')).toBe(false)
  })
})

describe('SuggestionIntelligenceService.classifySuggestion', () => {
  let svc
  beforeEach(() => {
    svc = new SuggestionIntelligenceService()
  })

  it('classifies an identical-word, high-confidence spelling fix as auto-fixable', () => {
    // Full meaning preservation + matching auto-fix pattern + low complexity.
    const result = svc.classifySuggestion(
      { originalText: 'hello', category: 'spelling', confidence: 0.9 },
      'hello',
    )
    expect(result.category).toBe('auto-fixable')
    expect(result.confidence).toBeGreaterThan(0.8)
    expect(result.metadata.patternMatches.editDistance).toBe(0)
  })

  it('is conservative: a word swap with no shared words is not auto-fixed', () => {
    // recieve -> receive shares no whole words, so meaning preservation is 0,
    // which drives the safety floor to 0 and blocks the auto-fix gate.
    const result = svc.classifySuggestion(
      { originalText: 'recieve', category: 'spelling', confidence: 0.9 },
      'receive',
    )
    expect(result.category).toBe('manual-only')
    expect(result.safetyScore).toBe(0)
  })

  it('falls back to manual-only when text data is missing', () => {
    const result = svc.classifySuggestion({ category: 'spelling' }, '')
    expect(result.category).toBe('manual-only')
    expect(result.metadata.manualReason).toBeTruthy()
  })

  it('routes a long suggestion to manual-only via the manual pattern gate', () => {
    const longSuggestion = 'This rewritten sentence is intentionally long enough to trip the manual gate.'
    const result = svc.classifySuggestion(
      { originalText: 'short', category: 'style', confidence: 0.9 },
      longSuggestion,
    )
    expect(result.category).toBe('manual-only')
  })

  it('returns the disabled fallback (semi-fixable) when the service is off', () => {
    svc.setEnabled(false)
    const result = svc.classifySuggestion({ originalText: 'a', category: 'spelling' }, 'b')
    expect(result.category).toBe('semi-fixable')
    expect(result.metadata.fallback).toBe(true)
  })

  it('updates running statistics after each classification', () => {
    expect(svc.getStatistics().totalAnalyzed).toBe(0)
    svc.classifySuggestion({ originalText: 'hello', category: 'spelling', confidence: 0.9 }, 'hello')
    svc.classifySuggestion({ originalText: 'recieve', category: 'spelling', confidence: 0.9 }, 'receive')
    const stats = svc.getStatistics()
    expect(stats.totalAnalyzed).toBe(2)
    expect(stats.averageConfidence).toBeGreaterThan(0)
  })

  it('produces a result carrying reasoning and metadata for downstream UI', () => {
    const result = svc.classifySuggestion(
      { originalText: 'hello', category: 'spelling', confidence: 0.9 },
      'hello',
    )
    expect(typeof result.reasoning).toBe('string')
    expect(result.reasoning.length).toBeGreaterThan(0)
    expect(result.metadata.originalLength).toBe(5)
    expect(result.metadata.suggestionLength).toBe(5)
  })
})
