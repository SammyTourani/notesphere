// CustomGrammarRules.js
// Adds extra grammar checks: contractions, word confusion, capitalization, punctuation

const CONTRACTIONS = [
  "don't", "doesn't", "can't", "won't", "isn't", "aren't", "weren't", "wasn't", "shouldn't", "wouldn't", "couldn't", "it's", "I'm", "you're", "they're", "we're", "I've", "you've", "they've", "we've", "I'll", "you'll", "he'll", "she'll", "they'll", "we'll", "I'd", "you'd", "he'd", "she'd", "they'd", "we'd"
];

const CONFUSIONS = [
  { wrong: "no", right: "know", context: /\bno\b[^.?!]*\bwhy|how|what|when|where|who\b/i },
  { wrong: "its", right: "it's", context: /\bits\s+(raining|a|an|the|not|been|is|was|seems|looks)/i },
  { wrong: "their", right: "there", context: /\btheir\s+(was|is|are|were|will|seems|appears)/i },
  { wrong: "there", right: "their", context: /\bthere\s+(car|house|dog|cat|book|friend|family)/i },
  { wrong: "your", right: "you're", context: /\byour\s+(welcome|right|wrong|amazing|awesome|funny|crazy)/i },
  { wrong: "you're", right: "your", context: /\byou're\s+(car|house|dog|cat|book|friend|family)/i },
];

function addCustomGrammarIssues(text, issues) {
  const newIssues = [...issues];
  const lines = text.split(/(?<=[.!?])\s+/);

  // 1. Capitalization check
  lines.forEach((sentence, idx) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 1 && /^[a-z]/.test(trimmed)) {
      newIssues.push({
        type: "capitalization",
        message: "Sentence should start with a capital letter.",
        displayText: trimmed.slice(0, Math.min(20, trimmed.length)) + (trimmed.length > 20 ? "..." : ""),
        offset: text.indexOf(trimmed),
        length: trimmed.split(" ")[0].length,
        suggestions: [trimmed.charAt(0).toUpperCase() + trimmed.slice(1)],
        isAutoFixable: false,
        category: "capitalization"
      });
    }
    // Special case: lowercase "i" as a pronoun
    if (/\bi\b/.test(trimmed)) {
      newIssues.push({
        type: "capitalization",
        message: "The pronoun 'I' should always be capitalized.",
        displayText: "i",
        offset: text.indexOf(" i "),
        length: 1,
        suggestions: ["I"],
        isAutoFixable: false,
        category: "capitalization"
      });
    }
    // 2. Punctuation check
    if (!/[.!?]$/.test(trimmed)) {
      newIssues.push({
        type: "punctuation",
        message: "Sentence may be missing an ending period, question mark, or exclamation mark.",
        displayText: trimmed.slice(0, Math.min(20, trimmed.length)) + (trimmed.length > 20 ? "..." : ""),
        offset: text.indexOf(trimmed),
        length: trimmed.length,
        suggestions: [trimmed + "."],
        isAutoFixable: false,
        category: "punctuation"
      });
    }
  });

  // 3. Spelling: contractions
  CONTRACTIONS.forEach(word => {
    const regex = new RegExp(`\\b${word.replace("'", "['’]?")}\\b`, "gi");
    if (!regex.test(text)) {
      // If a contraction is missing, don't flag; only flag if a similar misspelling is found
      // For example, flag "dont" instead of "don't"
      const misspelled = word.replace("'", "");
      const misspellRegex = new RegExp(`\\b${misspelled}\\b`, "gi");
      let match;
      while ((match = misspellRegex.exec(text)) !== null) {
        newIssues.push({
          type: "spelling",
          message: `Possible misspelling: '${match[0]}' should be '${word}'`,
          displayText: match[0],
          offset: match.index,
          length: match[0].length,
          suggestions: [word],
          isAutoFixable: true,
          category: "spelling"
        });
      }
    }
  });

  // 4. Word confusion
  CONFUSIONS.forEach(({ wrong, right, context }) => {
    const regex = new RegExp(`\\b${wrong}\\b`, "gi");
    let match;
    while ((match = regex.exec(text)) !== null) {
      // If context matches, flag
      const contextWindow = text.slice(Math.max(0, match.index - 20), match.index + 20);
      if (context.test(contextWindow)) {
        newIssues.push({
          type: "word_confusion",
          message: `Possible confusion: '${wrong}' vs '${right}'`,
          displayText: match[0],
          offset: match.index,
          length: match[0].length,
          suggestions: [right],
          isAutoFixable: false,
          category: "word_confusion"
        });
      }
    }
  });

  return newIssues;
}

export default addCustomGrammarIssues; 