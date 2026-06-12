import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  getNoteTheme,
  noteThemes,
  getNoteIcon,
  getTimeSince,
  filterAndSortNotes,
  getPersonalizedGreeting,
  clearNoteCaches,
} from '../src/shared/utils/noteUtils.js'

// Unit tests for the note presentation helpers. These are pure functions
// (deterministic hashing, content classification, relative-time math, filter
// and sort, greeting selection) with no React, Firebase, or network usage.

describe('getNoteTheme', () => {
  beforeEach(() => clearNoteCaches())

  it('always returns a theme from the published palette', () => {
    const theme = getNoteTheme('any-note-id')
    expect(noteThemes).toContain(theme)
  })

  it('is deterministic for the same id', () => {
    expect(getNoteTheme('note-123')).toBe(getNoteTheme('note-123'))
  })

  it('stays deterministic across a cache clear (hash, not random)', () => {
    const first = getNoteTheme('stable-id').name
    clearNoteCaches()
    expect(getNoteTheme('stable-id').name).toBe(first)
  })

  it('distributes different ids across more than one theme', () => {
    const names = new Set()
    for (let i = 0; i < 50; i++) names.add(getNoteTheme(`id-${i}`).name)
    expect(names.size).toBeGreaterThan(1)
  })
})

describe('getNoteIcon', () => {
  it('maps known keywords to category icons', () => {
    expect(getNoteIcon({ id: 'a', title: 'Team meeting', content: '' })).toBe('💼')
    expect(getNoteIcon({ id: 'a', title: 'Big idea', content: '' })).toBe('💡')
    expect(getNoteIcon({ id: 'a', title: '', content: 'my todo list' })).toBe('✅')
    expect(getNoteIcon({ id: 'a', title: '', content: 'some code here' })).toBe('💻')
    expect(getNoteIcon({ id: 'a', title: 'trip plans', content: '' })).toBe('✈️')
    expect(getNoteIcon({ id: 'a', title: '', content: 'favorite song' })).toBe('🎵')
  })

  it('matches keywords regardless of case', () => {
    expect(getNoteIcon({ id: 'a', title: 'BRAINSTORM', content: '' })).toBe('💡')
  })

  it('falls back to a deterministic default icon when no keyword matches', () => {
    const note = { id: 'no-keyword-here', title: 'lorem', content: 'ipsum' }
    const icon = getNoteIcon(note)
    expect(['📝', '📄', '📋', '📌', '✏️', '🗒️', '📑']).toContain(icon)
    // Deterministic: same id/content yields the same default icon.
    expect(getNoteIcon(note)).toBe(icon)
  })
})

describe('getTimeSince', () => {
  it('returns "Just now" for falsy timestamps', () => {
    expect(getTimeSince(null)).toBe('Just now')
    expect(getTimeSince(undefined)).toBe('Just now')
    expect(getTimeSince(0)).toBe('Just now')
  })

  it('returns "Just now" for very recent timestamps', () => {
    expect(getTimeSince(Date.now())).toBe('Just now')
    expect(getTimeSince(Date.now() - 30 * 1000)).toBe('Just now')
  })

  it('returns minutes for sub-hour gaps', () => {
    expect(getTimeSince(Date.now() - 5 * 60 * 1000)).toBe('5m ago')
  })

  it('returns hours for sub-day gaps', () => {
    expect(getTimeSince(Date.now() - 3 * 60 * 60 * 1000)).toBe('3h ago')
  })

  it('returns days for sub-week gaps', () => {
    expect(getTimeSince(Date.now() - 2 * 24 * 60 * 60 * 1000)).toBe('2d ago')
  })

  it('falls back to a locale date string for gaps over a week', () => {
    const old = Date.now() - 30 * 24 * 60 * 60 * 1000
    const result = getTimeSince(old)
    expect(result).not.toMatch(/ago$/)
    expect(result).toBe(new Date(old).toLocaleDateString())
  })
})

describe('filterAndSortNotes', () => {
  const notes = [
    { id: '1', title: 'Apple', content: 'red fruit', pinned: true, lastUpdated: '2024-01-01' },
    { id: '2', title: 'Banana', content: 'yellow', pinned: false, lastUpdated: '2024-02-01' },
    { id: '3', title: 'apricot', content: 'orange', pinned: false, lastUpdated: '2024-03-01' },
  ]

  it('returns empty groups for empty or missing input', () => {
    expect(filterAndSortNotes([], '')).toEqual({ pinned: [], unpinned: [] })
    expect(filterAndSortNotes(null, '')).toEqual({ pinned: [], unpinned: [] })
  })

  it('splits notes into pinned and unpinned groups', () => {
    const { pinned, unpinned } = filterAndSortNotes(notes, '')
    expect(pinned.map((n) => n.id)).toEqual(['1'])
    expect(unpinned.map((n) => n.id).sort()).toEqual(['2', '3'])
  })

  it('sorts each group by lastUpdated, most recent first', () => {
    const { unpinned } = filterAndSortNotes(notes, '')
    // id 3 (March) is newer than id 2 (February)
    expect(unpinned.map((n) => n.id)).toEqual(['3', '2'])
  })

  it('filters case-insensitively across title and content', () => {
    const { pinned, unpinned } = filterAndSortNotes(notes, 'AP')
    // "Apple" (pinned) and "apricot" (unpinned) both contain "ap"
    expect(pinned.map((n) => n.id)).toEqual(['1'])
    expect(unpinned.map((n) => n.id)).toEqual(['3'])
  })

  it('matches content as well as title', () => {
    const { unpinned } = filterAndSortNotes(notes, 'yellow')
    expect(unpinned.map((n) => n.id)).toEqual(['2'])
  })

  it('returns all notes when search text is only whitespace', () => {
    const { pinned, unpinned } = filterAndSortNotes(notes, '   ')
    expect(pinned.length + unpinned.length).toBe(3)
  })
})

describe('getPersonalizedGreeting', () => {
  afterEach(() => clearNoteCaches())

  it('greets a guest with the explorer fallback name and onboarding subtitle', () => {
    clearNoteCaches()
    const greeting = getPersonalizedGreeting(null, [], true)
    expect(greeting.title).toContain('explorer')
    expect(greeting.subtitle).toMatch(/NoteSphere/)
  })

  it('prompts a logged-in user with zero notes to create their first', () => {
    clearNoteCaches()
    const greeting = getPersonalizedGreeting({ displayName: 'Sam' }, [], false)
    expect(greeting.title).toContain('Sam')
    expect(greeting.subtitle).toMatch(/first/i)
  })

  it('derives a display name from the email local-part when no displayName exists', () => {
    clearNoteCaches()
    const greeting = getPersonalizedGreeting({ email: 'jane@example.com' }, [{}], false)
    expect(greeting.title).toContain('jane')
    expect(greeting.subtitle).toBe('You have 1 note')
  })

  it('pluralizes the note count correctly', () => {
    clearNoteCaches()
    const greeting = getPersonalizedGreeting({ displayName: 'Sam' }, [{}, {}, {}], false)
    expect(greeting.subtitle).toBe('You have 3 notes')
  })

  it('celebrates the 10-note milestone', () => {
    clearNoteCaches()
    const tenNotes = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }))
    const greeting = getPersonalizedGreeting({ displayName: 'Sam' }, tenNotes, false)
    expect(greeting.title).toMatch(/Double digits/)
  })
})
