/**
 * 🧠 SUGGESTION INTELLIGENCE SERVICE
 * 
 * Advanced AI-powered suggestion analysis and classification system.
 * Determines which grammar suggestions are safe for auto-fixing vs. manual review.
 * 
 * Classification Categories:
 * ✅ AUTO-FIXABLE: Safe, confident, simple fixes (typos, obvious corrections)
 * 🛠️ SEMI-FIXABLE: Grammar/style changes that benefit from user review
 * 👁️ MANUAL-ONLY: Complex changes requiring human judgment
 * 
 * Features:
 * - Pattern-based classification using regex and heuristics
 * - Confidence scoring and safety assessment
 * - Context awareness and suggestion validation
 * - Comprehensive logging for debugging and learning
 * - Conservative approach to prevent incorrect auto-fixes
 */

export class SuggestionIntelligenceService {
  constructor() {
    this.isEnabled = true; // Feature flag for easy disable
    this.conservativeMode = true; // Start conservative for safety
    
    // Classification statistics for learning
    this.stats = {
      totalAnalyzed: 0,
      autoFixable: 0,
      semiFixable: 0,
      manualOnly: 0,
      averageConfidence: 0
    };
    
    // Common patterns for classification
    this.patterns = this.initializePatterns();
    
    console.log('🧠 SuggestionIntelligenceService initialized');
  }
  
  /**
   * Initialize classification patterns and rules
   */
  initializePatterns() {
    return {
      // HIGH CONFIDENCE AUTO-FIX PATTERNS
      autoFixable: {
        // Simple typos (single character errors)
        singleCharTypos: /^.{1,3}$/, // Single char changes in short words
        
        // Common misspellings with high confidence
        commonMisspellings: [
          'recieve', 'definately', 'seperate', 'occured', 'accomodate',
          'begining', 'occassion', 'embarass', 'neccessary', 'wierd',
          'freind', 'loose', 'your', 'there', 'its', 'alot'
        ],
        
        // Simple punctuation fixes
        punctuationFixes: /^[.,;:!?'"]+$|^[A-Za-z]+[.,;:!?'"]$|^[.,;:!?"'][A-Za-z]+$/,
        
        // Obvious word substitutions
        singleWordReplace: /^\w+$/,
        
        // Capitalization fixes
        capitalizationFix: /^[A-Z][a-z]*$/
      },
      
      // MEDIUM CONFIDENCE SEMI-FIX PATTERNS  
      semiFixable: {
        // Grammar changes (be more careful)
        grammarChanges: /\b(is|are|was|were|have|has|had)\b/,
        
        // Style suggestions
        styleChanges: /\b(very|really|quite|rather|somewhat)\b/,
        
        // Multi-word changes
        multiWordChanges: /\s+/,
        
        // Verb tense changes
        verbTenseChanges: /\b\w+ed\b|\b\w+ing\b|\b\w+s\b/
      },
      
      // LOW CONFIDENCE MANUAL-ONLY PATTERNS
      manualOnly: {
        // Sentence restructuring
        sentenceRestructure: /[.!?].*[.!?]/,
        
        // Complex grammar with conjunctions
        complexGrammar: /\b(because|although|however|therefore|meanwhile|furthermore)\b/,
        
        // Very long suggestions (likely complex changes)
        longSuggestions: /.{50,}/,
        
        // Multiple sentences
        multipleSentences: /[.!?].*[.!?]/
      }
    };
  }
  
  /**
   * MAIN CLASSIFICATION METHOD
   * Analyzes a grammar issue and its suggestion to determine fix category
   */
  classifySuggestion(issue, suggestion) {
    if (!this.isEnabled) {
      return this.createFallbackClassification();
    }
    
    try {
      console.log('🔍 Analyzing suggestion:', {
        original: issue.originalText || issue.text,
        suggestion: suggestion,
        category: issue.category,
        confidence: issue.confidence
      });
      
      // Extract text components
      const originalText = issue.originalText || issue.text || '';
      const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text || '';
      
      if (!originalText || !suggestionText) {
        return this.classifyAsManual('Missing text data');
      }
      
      // Calculate various confidence scores
      const confidence = this.calculateConfidence(issue, suggestionText, originalText);
      const safety = this.assessSafety(issue, suggestionText, originalText);
      const complexity = this.assessComplexity(originalText, suggestionText);
      
      // Determine category based on analysis
      const category = this.determineCategory(issue, originalText, suggestionText, confidence, safety, complexity);
      
      // Create comprehensive result
      const result = {
        category,
        confidence: confidence.overall,
        safetyScore: safety.overall,
        complexityScore: complexity.overall,
        reasoning: this.generateReasoning(category, confidence, safety, complexity),
        metadata: {
          originalLength: originalText.length,
          suggestionLength: suggestionText.length,
          engineConfidence: issue.confidence || 0.5,
          issueCategory: issue.category,
          patternMatches: this.getPatternMatches(originalText, suggestionText)
        }
      };
      
      // Update statistics
      this.updateStats(result);
      
      console.log('✅ Classification result:', result);
      return result;
      
    } catch (error) {
      console.error('❌ Error in suggestion classification:', error);
      return this.createFallbackClassification();
    }
  }
  
  /**
   * Calculate confidence scores from multiple factors
   */
  calculateConfidence(issue, suggestionText, originalText) {
    const scores = {
      // Engine confidence (if provided)
      engine: issue.confidence || 0.5,
      
      // Length similarity (shorter changes = higher confidence)
      lengthSimilarity: this.calculateLengthSimilarity(originalText, suggestionText),
      
      // Pattern recognition confidence
      pattern: this.calculatePatternConfidence(originalText, suggestionText),
      
      // Category-based confidence
      category: this.getCategoryConfidence(issue.category),
      
      // Edit distance (Levenshtein) confidence
      editDistance: this.calculateEditDistanceConfidence(originalText, suggestionText)
    };
    
    // Weight the scores (conservative approach)
    scores.overall = (
      scores.engine * 0.3 +
      scores.lengthSimilarity * 0.2 +
      scores.pattern * 0.25 +
      scores.category * 0.15 +
      scores.editDistance * 0.1
    );
    
    return scores;
  }
  
  /**
   * Assess safety of applying suggestion automatically
   */
  assessSafety(issue, suggestionText, originalText) {
    const scores = {
      // Meaning preservation (simple heuristic)
      meaningPreservation: this.assessMeaningPreservation(originalText, suggestionText),
      
      // Context safety
      contextSafety: this.assessContextSafety(issue, originalText, suggestionText),
      
      // Reversibility (can user easily undo?)
      reversibility: this.assessReversibility(originalText, suggestionText),
      
      // Ambiguity (is suggestion unambiguous?)
      ambiguity: this.assessAmbiguity(suggestionText)
    };
    
    scores.overall = Math.min(
      scores.meaningPreservation,
      scores.contextSafety,
      scores.reversibility,
      scores.ambiguity
    );
    
    return scores;
  }
  
  /**
   * Assess complexity of the change
   */
  assessComplexity(originalText, suggestionText) {
    const factors = {
      // Word count difference
      wordCountDiff: Math.abs(originalText.split(/\s+/).length - suggestionText.split(/\s+/).length),
      
      // Character count difference
      charCountDiff: Math.abs(originalText.length - suggestionText.length),
      
      // Structural changes (punctuation, capitalization)
      structuralChanges: this.countStructuralChanges(originalText, suggestionText),
      
      // Semantic complexity
      semanticComplexity: this.assessSemanticComplexity(originalText, suggestionText)
    };
    
    // Higher scores = more complex = less suitable for auto-fix
    const complexity = (
      Math.min(factors.wordCountDiff / 3, 1) * 0.3 +
      Math.min(factors.charCountDiff / 20, 1) * 0.2 +
      Math.min(factors.structuralChanges / 5, 1) * 0.3 +
      factors.semanticComplexity * 0.2
    );
    
    return {
      ...factors,
      overall: complexity
    };
  }
  
  /**
   * Determine final category based on all analysis
   */
  determineCategory(issue, originalText, suggestionText, confidence, safety, complexity) {
    // Conservative thresholds
    const AUTO_FIX_THRESHOLD = this.conservativeMode ? 0.85 : 0.75;
    const SEMI_FIX_THRESHOLD = this.conservativeMode ? 0.65 : 0.55;
    
    // Check explicit pattern matches first
    if (this.matchesAutoFixPatterns(originalText, suggestionText)) {
      if (confidence.overall >= AUTO_FIX_THRESHOLD && safety.overall >= 0.8 && complexity.overall <= 0.3) {
        return 'auto-fixable';
      }
    }
    
    if (this.matchesManualOnlyPatterns(originalText, suggestionText)) {
      return 'manual-only';
    }
    
    // General scoring approach
    const overallScore = (confidence.overall * 0.4 + safety.overall * 0.4 + (1 - complexity.overall) * 0.2);
    
    if (overallScore >= AUTO_FIX_THRESHOLD) {
      return 'auto-fixable';
    } else if (overallScore >= SEMI_FIX_THRESHOLD) {
      return 'semi-fixable';
    } else {
      return 'manual-only';
    }
  }
  
  /**
   * Check if suggestion matches auto-fix patterns
   */
  matchesAutoFixPatterns(originalText, suggestionText) {
    const patterns = this.patterns.autoFixable;
    
    // Single character typos in short words
    if (originalText.length <= 5 && this.getEditDistance(originalText, suggestionText) === 1) {
      return true;
    }
    
    // Common misspellings
    if (patterns.commonMisspellings.includes(originalText.toLowerCase())) {
      return true;
    }
    
    // Simple punctuation fixes
    if (patterns.punctuationFixes.test(suggestionText) && originalText.replace(/[^\w]/g, '') === suggestionText.replace(/[^\w]/g, '')) {
      return true;
    }
    
    // Single word replacements with minimal changes
    if (patterns.singleWordReplace.test(originalText) && patterns.singleWordReplace.test(suggestionText)) {
      return this.getEditDistance(originalText, suggestionText) <= 2;
    }
    
    return false;
  }
  
  /**
   * Check if suggestion matches manual-only patterns
   */
  matchesManualOnlyPatterns(originalText, suggestionText) {
    const patterns = this.patterns.manualOnly;
    
    // Long or complex suggestions
    if (patterns.longSuggestions.test(suggestionText)) {
      return true;
    }
    
    // Multiple sentences
    if (patterns.multipleSentences.test(suggestionText)) {
      return true;
    }
    
    // Complex grammar patterns
    if (patterns.complexGrammar.test(suggestionText) && suggestionText.split(/\s+/).length > 3) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Helper method to calculate edit distance (Levenshtein distance)
   */
  getEditDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Additional helper methods for scoring
   */
  calculateLengthSimilarity(original, suggestion) {
    const maxLen = Math.max(original.length, suggestion.length);
    const minLen = Math.min(original.length, suggestion.length);
    return maxLen === 0 ? 1 : minLen / maxLen;
  }
  
  calculatePatternConfidence(original, suggestion) {
    if (this.matchesAutoFixPatterns(original, suggestion)) return 0.9;
    if (this.matchesManualOnlyPatterns(original, suggestion)) return 0.2;
    return 0.6; // neutral
  }
  
  getCategoryConfidence(category) {
    const categoryConfidence = {
      'spelling': 0.85,
      'punctuation': 0.8,
      'grammar': 0.6,
      'style': 0.5,
      'word_choice': 0.55,
      'clarity': 0.45
    };
    return categoryConfidence[category] || 0.5;
  }
  
  calculateEditDistanceConfidence(original, suggestion) {
    const distance = this.getEditDistance(original, suggestion);
    const maxLen = Math.max(original.length, suggestion.length);
    const normalizedDistance = maxLen === 0 ? 0 : distance / maxLen;
    return Math.max(0, 1 - normalizedDistance);
  }
  
  assessMeaningPreservation(original, suggestion) {
    // Simple heuristic: count preserved words
    const originalWords = original.toLowerCase().split(/\s+/);
    const suggestionWords = suggestion.toLowerCase().split(/\s+/);
    const preserved = originalWords.filter(word => suggestionWords.includes(word));
    return originalWords.length === 0 ? 1 : preserved.length / originalWords.length;
  }
  
  assessContextSafety(issue, original, suggestion) {
    // Higher safety for simpler categories
    const categorySafety = {
      'spelling': 0.9,
      'punctuation': 0.85,
      'grammar': 0.6,
      'style': 0.5
    };
    return categorySafety[issue.category] || 0.5;
  }
  
  assessReversibility(original, suggestion) {
    // Shorter changes are generally more reversible
    const lengthDiff = Math.abs(original.length - suggestion.length);
    return Math.max(0.3, 1 - (lengthDiff / 50));
  }
  
  assessAmbiguity(suggestion) {
    // Simple heuristic: shorter, simpler suggestions are less ambiguous
    if (suggestion.length <= 10 && suggestion.split(/\s+/).length === 1) return 0.9;
    if (suggestion.length <= 25 && suggestion.split(/\s+/).length <= 3) return 0.7;
    return 0.5;
  }
  
  countStructuralChanges(original, suggestion) {
    const originalStruct = original.replace(/\w/g, 'X');
    const suggestionStruct = suggestion.replace(/\w/g, 'X');
    return this.getEditDistance(originalStruct, suggestionStruct);
  }
  
  assessSemanticComplexity(original, suggestion) {
    // Simple heuristic based on word count and structure changes
    const wordCountDiff = Math.abs(original.split(/\s+/).length - suggestion.split(/\s+/).length);
    const hasComplexWords = /\b(however|therefore|nevertheless|furthermore|meanwhile|consequently)\b/i.test(suggestion);
    
    return Math.min(1, (wordCountDiff / 5) + (hasComplexWords ? 0.5 : 0));
  }
  
  getPatternMatches(original, suggestion) {
    return {
      autoFixable: this.matchesAutoFixPatterns(original, suggestion),
      manualOnly: this.matchesManualOnlyPatterns(original, suggestion),
      editDistance: this.getEditDistance(original, suggestion)
    };
  }
  
  /**
   * Generate human-readable reasoning for classification
   */
  generateReasoning(category, confidence, safety, complexity) {
    const reasons = [];
    
    if (category === 'auto-fixable') {
      reasons.push('High confidence suggestion');
      if (safety.overall > 0.8) reasons.push('Safe to apply automatically');
      if (complexity.overall < 0.3) reasons.push('Simple change');
    } else if (category === 'semi-fixable') {
      reasons.push('Medium confidence suggestion');
      if (complexity.overall > 0.3) reasons.push('Moderately complex change');
      reasons.push('Recommend user review');
    } else {
      reasons.push('Low confidence or complex change');
      if (complexity.overall > 0.6) reasons.push('High complexity');
      if (safety.overall < 0.6) reasons.push('Potential safety concerns');
      reasons.push('Requires manual review');
    }
    
    return reasons.join('; ');
  }
  
  /**
   * Update classification statistics
   */
  updateStats(result) {
    this.stats.totalAnalyzed++;
    this.stats[result.category.replace('-', '')]++;
    this.stats.averageConfidence = (
      (this.stats.averageConfidence * (this.stats.totalAnalyzed - 1) + result.confidence) / 
      this.stats.totalAnalyzed
    );
  }
  
  /**
   * Fallback classification when service is disabled or errors occur
   */
  createFallbackClassification() {
    return {
      category: 'semi-fixable',
      confidence: 0.5,
      safetyScore: 0.5,
      complexityScore: 0.5,
      reasoning: 'Fallback classification (service disabled or error)',
      metadata: {
        fallback: true
      }
    };
  }
  
  /**
   * Classify as manual-only with reason
   */
  classifyAsManual(reason) {
    return {
      category: 'manual-only',
      confidence: 0.3,
      safetyScore: 0.3,
      complexityScore: 0.8,
      reasoning: reason,
      metadata: {
        manualReason: reason
      }
    };
  }
  
  /**
   * Get current classification statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      isEnabled: this.isEnabled,
      conservativeMode: this.conservativeMode
    };
  }
  
  /**
   * Enable/disable the service
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🧠 SuggestionIntelligenceService ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Toggle conservative mode
   */
  setConservativeMode(conservative) {
    this.conservativeMode = conservative;
    console.log(`🧠 SuggestionIntelligenceService conservative mode: ${conservative}`);
  }
}

// Export singleton instance
export default new SuggestionIntelligenceService(); 