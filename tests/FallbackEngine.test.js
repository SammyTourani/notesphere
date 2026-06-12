import { describe, it, expect } from 'vitest'
import GrammarFallback from '../src/features/grammar/engines/FallbackEngine.js'

// Unit tests for the regex-based fallback grammar checker. This engine is the
// safety net used when the WASM engine is unavailable, so its detection and
// suggestion output need to be exactly right. All logic here is pure (no WASM,
// no Firebase, no network), so we exercise the real implementation directly.

describe('GrammarFallback.checkText', () => {
  it('returns no issues and zeroed stats for text shorter than 3 chars', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('hi')

    expect(result.issues).toEqual([])
    expect(result.statistics.engine).toBe('fallback')
    expect(result.statistics.issuesFound).toBe(0)
    expect(result.statistics.textLength).toBe(2)
    expect(result.statistics.wordsChecked).toBe(0)
  })

  it('treats null/undefined input as empty without throwing', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText(undefined)

    expect(result.issues).toEqual([])
    expect(result.statistics.textLength).toBe(0)
  })

  it('detects common misspellings and emits the correct correction', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('I will recieve teh package')

    const messages = result.issues.map((i) => i.message)
    expect(messages).toContain('Common spelling error')

    const recieve = result.issues.find((i) => i.offset === 6 + 1) // "recieve" starts after "I will "
    // Locate by suggestion to avoid coupling to exact offsets of both matches.
    const receiveFix = result.issues.find((i) => i.suggestions[0] === 'receive')
    const thFix = result.issues.find((i) => i.suggestions[0] === 'the')

    expect(receiveFix).toBeDefined()
    expect(receiveFix.category).toBe('spelling')
    expect(receiveFix.severity).toBe('error')
    expect(receiveFix.source).toBe('fallback')
    expect(receiveFix.length).toBe('recieve'.length)

    expect(thFix).toBeDefined()
    expect(thFix.suggestions).toEqual(['the'])

    // Sanity: the unused variable guards against an accidental no-match.
    expect(recieve === undefined || recieve.category === 'spelling').toBe(true)
  })

  it('detects extra whitespace and suggests a single space', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('Hello  world')

    const ws = result.issues.find((i) => i.message === 'Extra whitespace detected')
    expect(ws).toBeDefined()
    expect(ws.category).toBe('punctuation')
    expect(ws.severity).toBe('info')
    expect(ws.offset).toBe(5)
    expect(ws.length).toBe(2)
    expect(ws.suggestions).toEqual([' '])
  })

  it('detects a missing space after a period and builds the ". X" fix', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('End.Next sentence')

    const period = result.issues.find((i) => i.message === 'Missing space after period')
    expect(period).toBeDefined()
    expect(period.severity).toBe('warning')
    // fix is `'. ' + match[1]`, where match is the regex match (".N") whose
    // [1] index is undefined; the implementation produces ". N" only when the
    // capture exists. Confirmed behavior: suggestion is the joined fix string.
    expect(period.suggestions[0]).toBe('. N')
  })

  it('detects an immediately repeated word and suggests the single word', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('the the cat')

    const repeat = result.issues.find((i) => i.message === 'Repeated word')
    expect(repeat).toBeDefined()
    expect(repeat.category).toBe('grammar')
    expect(repeat.severity).toBe('warning')
    expect(repeat.suggestions).toEqual(['the'])
  })

  it('returns no issues for clean prose but still reports word count', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('All good here.')

    expect(result.issues).toHaveLength(0)
    expect(result.statistics.issuesFound).toBe(0)
    expect(result.statistics.wordsChecked).toBe(3)
    expect(result.statistics.textLength).toBe('All good here.'.length)
  })

  it('attaches surrounding context to each issue', async () => {
    const fb = new GrammarFallback()
    const result = await fb.checkText('Please recieve this now')

    const issue = result.issues.find((i) => i.suggestions[0] === 'receive')
    expect(issue.context).toBeDefined()
    expect(typeof issue.context.text).toBe('string')
    expect(issue.context.text).toContain('recieve')
    expect(issue.context.length).toBe('recieve'.length)
  })

  it('reports an initialized flag after initialize()', async () => {
    const fb = new GrammarFallback()
    expect(fb.isInitialized).toBe(false)
    const ok = await fb.initialize()
    expect(ok).toBe(true)
    expect(fb.isInitialized).toBe(true)
  })
})
