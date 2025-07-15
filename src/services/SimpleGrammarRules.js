/**
 * Enhanced Simple Grammar Rules - Advanced Pattern Recognition
 * Expanded from 12 to 40+ critical grammar rules that nlprule misses
 * Covers advanced patterns, edge cases, and sophisticated error detection
 */

export class SimpleGrammarRules {
  constructor() {
    this.rules = [
      // ===== ORIGINAL 12 RULES (Enhanced) =====
      
      // 1. Subject-verb agreement: I/you/we/they + singular verbs
      {
        id: 'SUBJ_VERB_PLURAL_SINGULAR',
        pattern: /\b(I|you|we|they)\s+(has|was|is|does)\b/gi,
        message: 'Subject-verb disagreement',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => {
          const subject = match[1].toLowerCase();
          const verb = match[2].toLowerCase();
          const corrections = {
            'has': 'have',
            'was': subject === 'you' ? 'were' : 'were',
            'is': 'are', 
            'does': 'do'
          };
          return `${match[1]} ${corrections[verb]}`;
        }
      },

      // 2. Subject-verb agreement: he/she/it + plural verbs  
      {
        id: 'SUBJ_VERB_SINGULAR_PLURAL',
        pattern: /\b(he|she|it|this|that)\s+(have|are|do|were)\b/gi,
        message: 'Subject-verb disagreement',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => {
          const subject = match[1];
          const verb = match[2].toLowerCase();
          const corrections = {
            'have': 'has',
            'are': 'is',
            'do': 'does',
            'were': 'was'
          };
          return `${subject} ${corrections[verb]}`;
        }
      },

      // 3. Modal + of errors
      {
        id: 'MODAL_OF_ERROR',
        pattern: /\b(should|could|would|might|must)\s+of\b/gi,
        message: 'Use "have" instead of "of" after modal verbs',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `${match[1]} have`
      },

      // 4. Your vs you're (Enhanced)
      {
        id: 'YOUR_YOURE_ERROR',
        pattern: /\byour\s+(going|coming|doing|being|having|getting|looking|trying|working|thinking|saying|feeling)\b/gi,
        message: 'Use "you\'re" (you are) instead of "your"',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `you're ${match[1]}`
      },

      // 5. Its vs it's possessive (Enhanced)
      {
        id: 'ITS_POSSESSIVE_ERROR', 
        pattern: /\bit's\s+(job|role|purpose|function|place|time|turn|way|color|size|shape|design|style|fault|problem)\b/gi,
        message: 'Use "its" (possessive) instead of "it\'s" (it is)',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `its ${match[1]}`
      },

      // 6. There is/are with plural (Enhanced)
      {
        id: 'THERE_IS_PLURAL_ERROR',
        pattern: /\bthere\s+is\s+(?:\w+\s+)*(many|several|multiple|few|some|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/gi,
        message: 'Use "there are" with plural quantities',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => match[0].replace(/there\s+is/i, 'there are')
      },

      // 7. A vs an before vowels (Enhanced)
      {
        id: 'A_AN_VOWEL_ERROR',
        pattern: /\ba\s+([aeiou]\w*)\b/gi,
        message: 'Use "an" before vowel sounds',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `an ${match[1]}`,
        exceptions: /\ba\s+(university|uniform|european|one|unicorn|unique)\b/gi
      },

      // 8. An vs a before consonants (Enhanced)
      {
        id: 'AN_A_CONSONANT_ERROR',
        pattern: /\ban\s+([bcdfgjklmnpqrstvwxyz]\w*)\b/gi,
        message: 'Use "a" before consonant sounds',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `a ${match[1]}`,
        exceptions: /\ban\s+(hour|honest|honor|heir)\b/gi
      },

      // 9. Double negatives (Enhanced)
      {
        id: 'DOUBLE_NEGATIVE_ERROR',
        pattern: /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't|isn't|aren't|wasn't|weren't)\s+(?:\w+\s+)*(nothing|nobody|nowhere|never|none|no\s+one)\b/gi,
        message: 'Avoid double negatives',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => {
          const negative = match[1];
          const word = match[2];
          const positive = word.replace(/^n(o|ever)/, m => m === 'no' ? 'any' : 'ever')
                             .replace(/nobody/, 'anybody')
                             .replace(/nowhere/, 'anywhere')
                             .replace(/nothing/, 'anything')
                             .replace(/none/, 'any');
          return match[0].replace(word, positive);
        }
      },

      // 10. Then vs than (Enhanced)
      {
        id: 'THEN_THAN_COMPARISON',
        pattern: /\b(better|worse|more|less|greater|smaller|faster|slower|higher|lower|stronger|weaker|bigger|larger)\s+then\b/gi,
        message: 'Use "than" for comparisons',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `${match[1]} than`
      },

      // 11. Could care less
      {
        id: 'COULD_CARE_LESS_ERROR',
        pattern: /\bcould\s+care\s+less\b/gi,
        message: 'Did you mean "couldn\'t care less"?',
        category: 'idiom',
        severity: 'warning',
        getSuggestion: () => 'couldn\'t care less'
      },

      // 12. Loose vs lose (Enhanced)
      {
        id: 'LOOSE_LOSE_ERROR',
        pattern: /\bloose\s+(the|my|your|his|her|their|our|a|an)\s+(game|match|key|way|job|money|weight|battle|fight|opportunity|chance)\b/gi,
        message: 'Use "lose" (to misplace) instead of "loose" (not tight)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => `lose ${match[1]} ${match[2]}`
      },

      // ===== NEW ENHANCED RULES (30+ Additional) =====

      // 13. Who vs whom (Object)
      {
        id: 'WHO_WHOM_OBJECT_ERROR',
        pattern: /\b(to|for|with|by|from)\s+who\b/gi,
        message: 'Use "whom" after prepositions',
        category: 'grammar',
        severity: 'warning',
        getSuggestion: (match) => `${match[1]} whom`
      },

      // 14. Between you and I 
      {
        id: 'BETWEEN_YOU_AND_I_ERROR',
        pattern: /\bbetween\s+(you\s+and\s+I|me\s+and\s+you|I\s+and\s+you)\b/gi,
        message: 'Use "between you and me" (objective case)',
        category: 'grammar',
        severity: 'error',
        getSuggestion: () => 'between you and me'
      },

      // 15. Myself misuse
      {
        id: 'MYSELF_MISUSE_ERROR',
        pattern: /\b(give|send|tell|show)\s+(?:it\s+to\s+)?myself\s+and\b/gi,
        message: 'Use "me" instead of "myself" here',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => match[0].replace('myself', 'me')
      },

      // 16. Each vs Every
      {
        id: 'EACH_EVERY_PLURAL_ERROR',
        pattern: /\b(each|every)\s+\w+\s+(are|have|were)\b/gi,
        message: 'Use singular verbs with "each" and "every"',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => {
          const verb = match[2].toLowerCase();
          const corrections = {'are': 'is', 'have': 'has', 'were': 'was'};
          return match[0].replace(match[2], corrections[verb]);
        }
      },

      // 17. Neither/nor agreement
      {
        id: 'NEITHER_NOR_AGREEMENT_ERROR',
        pattern: /\bneither\s+\w+\s+nor\s+\w+\s+(are|have|were)\b/gi,
        message: 'Use singular verbs with "neither...nor"',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => {
          const verb = match[1].toLowerCase();
          const corrections = {'are': 'is', 'have': 'has', 'were': 'was'};
          return match[0].replace(match[1], corrections[verb]);
        }
      },

      // 18. Effect vs affect (common patterns)
      {
        id: 'EFFECT_AFFECT_ERROR',
        pattern: /\b(the|this|that|his|her|my|your|their|our)\s+affect\b/gi,
        message: 'Use "effect" (noun) instead of "affect" (verb)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => `${match[1]} effect`
      },

      // 19. Complement vs compliment
      {
        id: 'COMPLEMENT_COMPLIMENT_ERROR',
        pattern: /\b(pay|give|receive)\s+(?:a|an)?\s*complement\b/gi,
        message: 'Use "compliment" (praise) instead of "complement" (complete)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => match[0].replace('complement', 'compliment')
      },

      // 20. Alot error
      {
        id: 'ALOT_ERROR',
        pattern: /\balot\b/gi,
        message: 'Use "a lot" (two words)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: () => 'a lot'
      },

      // 21. Everyday vs every day
      {
        id: 'EVERYDAY_ERROR',
        pattern: /\beveryday\s+(I|you|he|she|it|we|they|people|someone)\b/gi,
        message: 'Use "every day" (two words) when referring to frequency',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => `every day ${match[1]}`
      },

      // 22. Irregardless
      {
        id: 'IRREGARDLESS_ERROR',
        pattern: /\birregardless\b/gi,
        message: 'Use "regardless" instead of "irregardless"',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: () => 'regardless'
      },

      // 23. Would of, should of, could of (extended)
      {
        id: 'AUXILIARY_OF_ERROR',
        pattern: /\b(would|should|could|might|must|ought)\s+(to\s+)?of\b/gi,
        message: 'Use "have" instead of "of"',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => match[2] ? `${match[1]} to have` : `${match[1]} have`
      },

      // 24. Apostrophe in plurals
      {
        id: 'APOSTROPHE_PLURAL_ERROR',
        pattern: /\b(\w+)'s\s+(are|were|have)\b/gi,
        message: 'Remove apostrophe for plurals (use apostrophe only for possession)',
        category: 'punctuation',
        severity: 'error',
        getSuggestion: (match) => `${match[1]}s ${match[2]}`
      },

      // 25. Definite vs definitive
      {
        id: 'DEFINITE_DEFINITIVE_ERROR',
        pattern: /\b(a|the)\s+definitive\s+(answer|date|time|yes|no)\b/gi,
        message: 'Use "definite" (certain) instead of "definitive" (final)',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: (match) => `${match[1]} definite ${match[2]}`
      },

      // 26. Literally misuse
      {
        id: 'LITERALLY_MISUSE_ERROR',
        pattern: /\bliterally\s+(died|exploded|melted|froze|flew|disappeared)\b/gi,
        message: 'Consider if "literally" is meant literally here',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: (match) => `${match[1]}` // suggest removing literally
      },

      // 27. Unique modifiers
      {
        id: 'UNIQUE_MODIFIER_ERROR',
        pattern: /\b(very|more|most|quite|rather|extremely)\s+unique\b/gi,
        message: 'Remove modifier - "unique" means one of a kind',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: () => 'unique'
      },

      // 28. Data is/are
      {
        id: 'DATA_AGREEMENT_ERROR',
        pattern: /\bdata\s+(is|was|has)\b/gi,
        message: 'Consider using "are" - "data" is traditionally plural',
        category: 'grammar',
        severity: 'warning',
        getSuggestion: (match) => {
          const corrections = {'is': 'are', 'was': 'were', 'has': 'have'};
          return `data ${corrections[match[1].toLowerCase()]}`;
        }
      },

      // 29. Try and vs try to
      {
        id: 'TRY_AND_ERROR',
        pattern: /\btry\s+and\s+(get|go|do|make|find|see|understand|learn)\b/gi,
        message: 'Use "try to" instead of "try and"',
        category: 'grammar',
        severity: 'warning',
        getSuggestion: (match) => `try to ${match[1]}`
      },

      // 30. Different than vs different from
      {
        id: 'DIFFERENT_THAN_ERROR',
        pattern: /\bdifferent\s+than\b/gi,
        message: 'Use "different from" instead of "different than"',
        category: 'grammar',
        severity: 'warning',
        getSuggestion: () => 'different from'
      },

      // 31. Comprised of
      {
        id: 'COMPRISED_OF_ERROR',
        pattern: /\bcomprised\s+of\b/gi,
        message: 'Use "composed of" or "comprises" (not "comprised of")',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: () => 'composed of'
      },

      // 32. For all intensive purposes
      {
        id: 'INTENSIVE_PURPOSES_ERROR',
        pattern: /\bfor\s+all\s+intensive\s+purposes\b/gi,
        message: 'Use "for all intents and purposes"',
        category: 'idiom',
        severity: 'error',
        getSuggestion: () => 'for all intents and purposes'
      },

      // 33. Peaked vs piqued
      {
        id: 'PEAKED_INTEREST_ERROR',
        pattern: /\bpeaked\s+(my|your|his|her|their|our)\s+interest\b/gi,
        message: 'Use "piqued" (aroused) instead of "peaked"',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => `piqued ${match[1]} interest`
      },

      // 34. Weary vs wary
      {
        id: 'WEARY_WARY_ERROR',
        pattern: /\b(be|being|am|is|are|was|were)\s+weary\s+of\b/gi,
        message: 'Use "wary of" (cautious) instead of "weary of" (tired)',
        category: 'word_choice',
        severity: 'error',
        getSuggestion: (match) => `${match[1]} wary of`
      },

      // 35. Reign vs rein
      {
        id: 'REIGN_REIN_ERROR',
        pattern: /\b(free|tight)\s+reign\b/gi,
        message: 'Use "rein" (control) instead of "reign" (rule)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: (match) => `${match[1]} rein`
      },

      // 36. Past tense "use to"
      {
        id: 'USE_TO_ERROR',
        pattern: /\buse\s+to\s+(be|have|go|do|get|make|see|know)\b/gi,
        message: 'Use "used to" for past habits',
        category: 'grammar',
        severity: 'error',
        getSuggestion: (match) => `used to ${match[1]}`
      },

      // 37. Sneak peaked
      {
        id: 'SNEAK_PEAK_ERROR',
        pattern: /\bsneak\s+peak\b/gi,
        message: 'Use "sneak peek" (quick look)',
        category: 'spelling',
        severity: 'error',
        getSuggestion: () => 'sneak peek'
      },

      // 38. Firstly, secondly (prefer simpler forms)
      {
        id: 'FIRSTLY_ERROR',
        pattern: /\b(firstly|secondly|thirdly)\b/gi,
        message: 'Consider using "first", "second", "third" instead',
        category: 'style',
        severity: 'suggestion',
        getSuggestion: (match) => match[1].replace('ly', '')
      },

      // 39. Orientated vs oriented
      {
        id: 'ORIENTATED_ERROR',
        pattern: /\borientated\b/gi,
        message: 'Use "oriented" instead of "orientated"',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: () => 'oriented'
      },

      // 40. Preventative vs preventive
      {
        id: 'PREVENTATIVE_ERROR',
        pattern: /\bpreventative\b/gi,
        message: 'Use "preventive" (more concise) instead of "preventative"',
        category: 'word_choice',
        severity: 'suggestion',
        getSuggestion: () => 'preventive'
      },

      // 41. Intensive vs extensive
      {
        id: 'INTENSIVE_EXTENSIVE_ERROR',
        pattern: /\ban\s+intensive\s+(study|research|investigation|analysis)\b/gi,
        message: 'Consider "extensive" (broad) vs "intensive" (focused)',
        category: 'word_choice',
        severity: 'suggestion',
        getSuggestion: (match) => match[0].replace('intensive', 'extensive')
      },

      // 42. Alternate vs alternative
      {
        id: 'ALTERNATE_ALTERNATIVE_ERROR',
        pattern: /\ban\s+alternate\s+(solution|method|approach|way)\b/gi,
        message: 'Use "alternative" (different option) instead of "alternate" (every other)',
        category: 'word_choice',
        severity: 'warning',
        getSuggestion: (match) => match[0].replace('alternate', 'alternative')
      }
    ];
  }

  /**
   * Check text for grammar issues with enhanced error detection
   */
  checkGrammar(text) {
    const issues = [];

    this.rules.forEach(rule => {
      // Skip if this rule has exceptions and text matches exception
      if (rule.exceptions && rule.exceptions.test(text)) {
        rule.exceptions.lastIndex = 0; // Reset regex
        return;
      }

      let match;
      while ((match = rule.pattern.exec(text)) !== null) {
        const suggestion = typeof rule.getSuggestion === 'function' 
          ? rule.getSuggestion(match) 
          : rule.getSuggestion;

        issues.push({
          id: `simple-${rule.id}-${match.index}`,
          category: rule.category || 'grammar',
          type: rule.id,
          message: rule.message,
          shortMessage: this.getShortMessage(rule.category),
          offset: match.index,
          length: match[0].length,
          severity: rule.severity || 'error',
          suggestions: Array.isArray(suggestion) ? suggestion : [suggestion],
          rule: {
            id: rule.id,
            description: rule.message,
            category: rule.category
          },
          context: {
            text: text.substring(Math.max(0, match.index - 20), match.index + match[0].length + 20),
            offset: Math.max(0, match.index - 20),
            length: match[0].length
          },
          confidence: this.getConfidence(rule.severity),
          source: 'enhanced-simple-grammar-rules'
        });
      }
      
      // Reset regex lastIndex to avoid issues
      rule.pattern.lastIndex = 0;
    });

    return issues;
  }

  /**
   * Get short message based on category
   */
  getShortMessage(category) {
    const messageMap = {
      'grammar': 'Grammar',
      'spelling': 'Spelling',
      'punctuation': 'Punctuation',
      'word_choice': 'Word Choice',
      'style': 'Style',
      'idiom': 'Idiom'
    };
    return messageMap[category] || 'Grammar';
  }

  /**
   * Get confidence score based on severity
   */
  getConfidence(severity) {
    const confidenceMap = {
      'error': 0.95,
      'warning': 0.85,
      'suggestion': 0.75
    };
    return confidenceMap[severity] || 0.90;
  }

  /**
   * Get statistics about the rules
   */
  getStats() {
    const categories = {};
    const severities = {};
    
    this.rules.forEach(rule => {
      const cat = rule.category || 'grammar';
      const sev = rule.severity || 'error';
      
      categories[cat] = (categories[cat] || 0) + 1;
      severities[sev] = (severities[sev] || 0) + 1;
    });

    return {
      totalRules: this.rules.length,
      categories,
      severities,
      enhancedFeatures: [
        'Exception handling',
        'Category classification', 
        'Severity levels',
        'Confidence scoring',
        'Enhanced suggestions'
      ]
    };
  }
}

export const simpleGrammarRules = new SimpleGrammarRules(); 