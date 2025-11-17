/**
 * 🎯 UNIFIED GRAMMAR CONTROLLER
 * 
 * The central orchestrator for the grammar detection → response → underline pipeline
 * 
 * RESPONSIBILITIES:
 * 1. Coordinate between AdvancedGrammarService (detection) and GrammarExtension (rendering)
 * 2. Handle debouncing and timing for optimal performance
 * 3. Manage content change detection and incremental updates
 * 4. Provide consistent API for all grammar UI components
 * 5. Handle position mapping between text formats
 * 6. Cache results and manage performance
 * 
 * SINGLE SOURCE OF TRUTH for grammar checking in NoteSphere
 */

import AdvancedGrammarService from './AdvancedGrammarService.js';
// import LanguageToolService from './LanguageToolService.js'; // TODO: Create this service
// import GrammarCostTracker from './GrammarCostTracker.js'; // TODO: Create this service
import { updateGrammarDecorations } from '../extensions/GrammarExtension.js';

class UnifiedGrammarController {
  constructor() {
    this.advancedGrammarService = new AdvancedGrammarService();
    // Stub for missing LanguageToolService
    this.languageToolService = { 
      isAvailable: () => false,
      initialize: () => Promise.resolve(false),
      checkText: () => Promise.resolve([]) 
    };
    // Stub for missing GrammarCostTracker
    this.costTracker = { 
      trackCheck: () => {},
      getCost: () => 0
    };
    this.isInitialized = false;
    
    // Grammar tier (1 = WASM, 2 = LanguageTool, 3 = GPT-4)
    this.currentTier = 1;
    
    // State management
    this.currentIssues = [];
    this.isProcessing = false;
    this.isEnabled = true;
    
    // Editor tracking
    this.editor = null;
    this.lastContent = '';
    this.lastContentHash = '';
    
    // Timing and debouncing
    this.debounceTimeout = null;
    this.debounceTime = 1000; // 1 second for better UX
    this.processingTimeout = null;
    
    // Performance tracking
    this.stats = {
      totalChecks: 0,
      cacheHits: 0,
      averageProcessingTime: 0,
      totalIssuesFound: 0,
      lastCheckTime: null
    };
    
    // Content change detection
    this.contentChangeThreshold = 10; // Minimum characters changed to trigger check
    this.forceCheckThreshold = 5000; // Force check every 5 seconds if content exists
    this.lastForceCheck = Date.now();
    
    // Event listeners
    this.listeners = new Map();
    
    console.log('🎯 UnifiedGrammarController initialized');
    this.initialize();
  }

  /**
   * Initialize the controller and underlying services
   */
  async initialize() {
    try {
      console.log('🚀 Initializing UnifiedGrammarController...');
      
      // Initialize Tier 1 (WASM - Advanced Grammar Service)
      const tier1Initialized = await this.advancedGrammarService.initialize();
      if (!tier1Initialized) {
        console.warn('⚠️ AdvancedGrammarService initialization failed, using fallback mode');
      }
      
      // Initialize Tier 2 (LanguageTool)
      const tier2Initialized = await this.languageToolService.initialize();
      if (tier2Initialized) {
        console.log('✅ LanguageTool service available (Tier 2)');
      } else {
        console.log('⚠️ LanguageTool not configured, only Tier 1 available');
      }
      
      // Load saved tier preference
      const savedTier = localStorage.getItem('grammar_tier');
      if (savedTier) {
        this.currentTier = parseInt(savedTier, 10);
      }
      
      this.isInitialized = true;
      console.log(`✅ UnifiedGrammarController ready (Tier ${this.currentTier})`);
      
      this.emit('initialized', { 
        success: true,
        tier: this.currentTier,
        tier2Available: tier2Initialized
      });
      return true;
    } catch (error) {
      console.error('❌ UnifiedGrammarController initialization failed:', error);
      this.isInitialized = false;
      this.emit('initialized', { success: false, error });
      return false;
    }
  }

  /**
   * Register a TipTap editor with the controller
   */
  registerEditor(editor) {
    if (!editor) {
      console.warn('❌ Cannot register null editor');
      return false;
    }
    
    this.editor = editor;
    console.log('📝 Editor registered with UnifiedGrammarController');
    
    // Set up editor event listeners
    this.setupEditorListeners();
    
    // Initial content check if editor has content
    const content = this.getEditorContent();
    if (content && content.trim().length > 0) {
      console.log('📄 Editor has initial content, scheduling check');
      this.scheduleGrammarCheck(content, { reason: 'initial_content' });
    }
    
    this.emit('editorRegistered', { editor });
    return true;
  }

  /**
   * Unregister the editor (cleanup)
   */
  unregisterEditor() {
    if (this.editor) {
      console.log('📝 Unregistering editor from UnifiedGrammarController');
      this.cleanupEditorListeners();
      this.editor = null;
      this.clearDecorations();
      this.emit('editorUnregistered');
    }
  }

  /**
   * Set up editor event listeners for content changes
   */
  setupEditorListeners() {
    if (!this.editor) return;
    
    // Listen to editor updates (content changes)
    this.editor.on('update', ({ editor, transaction }) => {
      if (!this.isEnabled) return;
      
      const content = this.getEditorContent();
      this.handleContentChange(content, { source: 'editor_update', transaction });
    });

    // Listen to focus events (initial load)
    this.editor.on('focus', ({ editor }) => {
      if (!this.isEnabled) return;
      
      const content = this.getEditorContent();
      if (content && content.trim().length > 0) {
        this.scheduleGrammarCheck(content, { reason: 'editor_focus' });
      }
    });

    console.log('👂 Editor event listeners set up');
  }

  /**
   * Clean up editor event listeners
   */
  cleanupEditorListeners() {
    if (this.editor) {
      this.editor.off('update');
      this.editor.off('focus');
      console.log('🧹 Editor event listeners cleaned up');
    }
  }

  /**
   * Get current content from the editor
   */
  getEditorContent() {
    if (!this.editor) return '';
    
    try {
      // Get plain text for grammar checking
      return this.editor.getText() || '';
    } catch (error) {
      console.warn('❌ Error getting editor content:', error);
      return '';
    }
  }

  /**
   * Handle content changes with smart debouncing
   */
  handleContentChange(content, context = {}) {
    if (!this.isEnabled || !content) return;
    
    // Check if content actually changed significantly
    const contentHash = this.generateContentHash(content);
    const contentChanged = contentHash !== this.lastContentHash;
    const significantChange = this.isSignificantChange(content, this.lastContent);
    
    if (!contentChanged && !significantChange) {
      return; // No significant change
    }
    
    this.lastContent = content;
    this.lastContentHash = contentHash;
    
    console.log('📝 Content changed, scheduling grammar check:', {
      length: content.length,
      significant: significantChange,
      source: context.source
    });
    
    this.scheduleGrammarCheck(content, {
      ...context,
      contentChanged: true,
      significantChange
    });
  }

  /**
   * Schedule a grammar check with debouncing
   */
  scheduleGrammarCheck(content, context = {}) {
    if (!this.isEnabled || !content || content.trim().length < 10) {
      if (content && content.trim().length < 10) {
        // Clear decorations for very short content
        this.clearDecorations();
      }
      return;
    }
    
    // Clear existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    // Determine debounce time based on context
    let debounceTime = this.debounceTime;
    
    if (context.reason === 'initial_content' || context.reason === 'editor_focus') {
      debounceTime = 500; // Faster for initial loads
    } else if (context.significantChange) {
      debounceTime = 800; // Medium delay for significant changes
    }
    
    console.log(`⏱️ Scheduling grammar check in ${debounceTime}ms`);
    
    // Set new timeout
    this.debounceTimeout = setTimeout(() => {
      this.performGrammarCheck(content, context);
    }, debounceTime);
  }

  /**
   * Perform the actual grammar check using selected tier
   */
  async performGrammarCheck(content, context = {}) {
    if (!this.isEnabled || this.isProcessing) {
      console.log('⏸️ Skipping grammar check (disabled or already processing)');
      return;
    }
    
    const startTime = Date.now();
    this.isProcessing = true;
    
    try {
      console.log(`🔍 Performing Tier ${this.currentTier} grammar check...`);
      this.emit('checkStarted', { 
        content: content.substring(0, 50) + '...', 
        context,
        tier: this.currentTier 
      });
      
      let allIssues = [];
      
      // Tier 1: Always run WASM for instant feedback
      if (this.currentTier >= 1) {
        const tier1Result = await this.advancedGrammarService.checkText(content, {
          categories: ['grammar', 'spelling', 'style', 'punctuation'],
          language: 'en-US'
        });
        allIssues = this.normalizeIssues(tier1Result.issues || tier1Result || [], content);
        console.log(`✅ Tier 1 (WASM): ${allIssues.length} issues in ${Date.now() - startTime}ms`);
      }
      
      // Tier 2: Add LanguageTool for enhanced accuracy
      if (this.currentTier >= 2 && this.languageToolService.isAvailable()) {
        const tier2Issues = await this.languageToolService.checkText(content, {
          language: 'en-US',
          level: 'picky'
        });
        
        // Track cost
        this.costTracker.trackCheck(2, content.length);
        
        // Merge and deduplicate issues
        allIssues = this.mergeIssues(allIssues, tier2Issues);
        console.log(`✅ Tier 2 (LanguageTool): ${tier2Issues.length} new issues, ${allIssues.length} total`);
      }
      
      // Tier 3: GPT-4 Premium (future implementation)
      if (this.currentTier >= 3) {
        // This will be handled by GPT4GrammarService when user upgrades
        console.log('ℹ️ Tier 3 (GPT-4) requires premium subscription');
      }
      
      // Update decorations in the editor
      this.updateDecorations(allIssues);
      
      // Update statistics
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, allIssues.length);
      
      console.log(`✅ Grammar check completed: ${allIssues.length} issues in ${processingTime}ms`);
      
      this.emit('checkCompleted', {
        issues: allIssues,
        processingTime,
        context,
        stats: this.stats,
        tier: this.currentTier
      });
      
      return allIssues;
      
    } catch (error) {
      console.error('❌ Grammar check failed:', error);
      this.emit('checkFailed', { error, context });
      return [];
      
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Merge issues from multiple tiers and remove duplicates
   */
  mergeIssues(tier1Issues, tier2Issues) {
    const merged = [...tier1Issues];
    
    for (const issue2 of tier2Issues) {
      // Check if this issue overlaps with any existing issue
      const isDuplicate = tier1Issues.some(issue1 => {
        // Same position and similar message = duplicate
        const samePosition = Math.abs(issue1.offset - issue2.offset) <= 2 &&
                           Math.abs(issue1.length - issue2.length) <= 2;
        const similarMessage = issue1.message.toLowerCase().includes(issue2.message.toLowerCase().split(' ')[0]);
        
        return samePosition && similarMessage;
      });
      
      if (!isDuplicate) {
        merged.push(issue2);
      }
    }
    
    // Sort by position
    return merged.sort((a, b) => a.offset - b.offset);
  }
  
  /**
   * Set grammar checking tier
   */
  setTier(tier) {
    if (tier < 1 || tier > 3) {
      console.warn('Invalid tier:', tier);
      return false;
    }
    
    // Check if tier is available
    if (tier === 2 && !this.languageToolService.isAvailable()) {
      console.warn('Tier 2 (LanguageTool) not available');
      return false;
    }
    
    if (tier === 3) {
      // Redirect to premium page
      this.emit('premiumRequired', { tier: 3 });
      return false;
    }
    
    this.currentTier = tier;
    localStorage.setItem('grammar_tier', tier.toString());
    
    console.log(`✅ Grammar tier set to ${tier}`);
    this.emit('tierChanged', { tier });
    
    // Re-check current content with new tier
    if (this.editor) {
      const content = this.getEditorContent();
      if (content && content.trim().length > 0) {
        this.scheduleGrammarCheck(content, { reason: 'tier_changed' });
      }
    }
    
    return true;
  }
  
  /**
   * Get current tier
   */
  getTier() {
    return this.currentTier;
  }
  
  /**
   * Get available tiers
   */
  getAvailableTiers() {
    return {
      tier1: true,
      tier2: this.languageToolService.isAvailable(),
      tier3: false // Premium not yet implemented
    };
  }

  /**
   * Normalize issues from AdvancedGrammarService to consistent format
   */
  normalizeIssues(issues, content) {
    return issues.map((issue, index) => {
      // Ensure we have a consistent issue format
      let normalizedIssue = {
        id: issue.id || `issue-${Date.now()}-${index}`,
        category: issue.category || issue.type || 'grammar',
        severity: issue.severity || 'error',
        message: issue.message || 'Grammar issue detected',
        suggestions: Array.isArray(issue.suggestions) ? issue.suggestions : 
                    issue.suggestion ? [issue.suggestion] : [],
        
        // Position data - handle different formats
        offset: issue.offset !== undefined ? issue.offset : issue.startIndex,
        length: issue.length !== undefined ? issue.length : 
                (issue.endIndex !== undefined ? issue.endIndex - issue.startIndex : 1),
        
        // Additional data
        originalText: issue.originalText || issue.text || 
                     (issue.offset !== undefined && issue.length !== undefined ? 
                      content.substring(issue.offset, issue.offset + issue.length) : ''),
        confidence: issue.confidence || 0.8,
        source: issue.source || issue.engine || 'advanced-grammar',
        
        // Context
        context: issue.context || this.generateContext(content, issue.offset, issue.length),
        
        // Rule information
        rule: issue.rule || { id: 'unknown', description: issue.message }
      };
      
      // Validate positions
      if (normalizedIssue.offset < 0 || normalizedIssue.offset >= content.length) {
        console.warn('Invalid issue position:', normalizedIssue);
        return null;
      }
      
      return normalizedIssue;
    }).filter(issue => issue !== null);
  }

  /**
   * Generate context text around an issue
   */
  generateContext(content, offset, length) {
    if (!content || offset === undefined) return { text: '', offset: 0 };
    
    const contextRadius = 30;
    const start = Math.max(0, offset - contextRadius);
    const end = Math.min(content.length, offset + length + contextRadius);
    
    return {
      text: content.substring(start, end),
      offset: start,
      issueStart: offset - start,
      issueLength: length
    };
  }

  /**
   * Update decorations in the TipTap editor
   */
  updateDecorations(issues) {
    if (!this.editor) {
      console.warn('❌ No editor available for decoration update');
      return;
    }
    
    try {
      // Store current issues
      this.currentIssues = issues;
      
      // Update decorations using the grammar extension
      const success = updateGrammarDecorations(this.editor, issues);
      
      if (success) {
        console.log(`✅ Updated decorations: ${issues.length} issues`);
        this.emit('decorationsUpdated', { issues });
      } else {
        console.warn('❌ Failed to update decorations');
      }
      
    } catch (error) {
      console.error('❌ Error updating decorations:', error);
    }
  }

  /**
   * Clear all decorations
   */
  clearDecorations() {
    this.updateDecorations([]);
  }

  /**
   * Check if content change is significant enough to trigger grammar check
   */
  isSignificantChange(newContent, oldContent) {
    if (!oldContent) return true;
    
    const lengthDiff = Math.abs(newContent.length - oldContent.length);
    return lengthDiff >= this.contentChangeThreshold;
  }

  /**
   * Generate a simple hash for content change detection
   */
  generateContentHash(content) {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Update performance statistics
   */
  updateStats(processingTime, issuesFound) {
    this.stats.totalChecks++;
    this.stats.totalIssuesFound += issuesFound;
    this.stats.lastCheckTime = Date.now();
    
    // Update average processing time
    this.stats.averageProcessingTime = 
      (this.stats.averageProcessingTime * (this.stats.totalChecks - 1) + processingTime) / this.stats.totalChecks;
  }

  /**
   * Force a grammar check (bypass debouncing)
   */
  forceGrammarCheck() {
    if (!this.editor) return Promise.resolve([]);
    
    const content = this.getEditorContent();
    if (!content || content.trim().length < 10) {
      this.clearDecorations();
      return Promise.resolve([]);
    }
    
    console.log('⚡ Forcing immediate grammar check');
    return this.performGrammarCheck(content, { reason: 'force_check' });
  }

  /**
   * Get current grammar issues
   */
  getCurrentIssues() {
    return this.currentIssues;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Enable/disable grammar checking
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🎯 Grammar checking ${enabled ? 'enabled' : 'disabled'}`);
    
    if (!enabled) {
      this.clearDecorations();
      // Cancel any pending checks
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = null;
      }
    } else if (this.editor) {
      // Re-enable and check current content
      const content = this.getEditorContent();
      if (content && content.trim().length > 0) {
        this.scheduleGrammarCheck(content, { reason: 'enabled' });
      }
    }
    
    this.emit('enabledChanged', { enabled });
  }

  /**
   * Check if grammar checking is enabled
   */
  isGrammarEnabled() {
    return this.isEnabled;
  }

  /**
   * Apply a suggestion for a specific issue
   */
  applySuggestion(issueId, suggestion) {
    if (!this.editor) return false;
    
    try {
      const success = this.editor.commands.applySuggestion(issueId, suggestion);
      if (success) {
        // Remove the applied issue from current issues
        this.currentIssues = this.currentIssues.filter(issue => issue.id !== issueId);
        console.log(`✅ Applied suggestion for issue ${issueId}: "${suggestion}"`);
        this.emit('suggestionApplied', { issueId, suggestion });
      }
      return success;
    } catch (error) {
      console.error('❌ Error applying suggestion:', error);
      return false;
    }
  }

  /**
   * Event system for communication with UI components
   */
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  off(event, listener) {
    if (!this.listeners.has(event)) return;
    const listeners = this.listeners.get(event);
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    const listeners = this.listeners.get(event);
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`❌ Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * Cleanup method
   */
  destroy() {
    console.log('🧹 Destroying UnifiedGrammarController');
    
    // Clear timeouts
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }
    
    // Unregister editor
    this.unregisterEditor();
    
    // Clear listeners
    this.listeners.clear();
    
    // Clear state
    this.currentIssues = [];
    this.isEnabled = false;
    
    this.emit('destroyed');
  }
}

// Export singleton instance
let grammarController = null;

export const getUnifiedGrammarController = () => {
  if (!grammarController) {
    grammarController = new UnifiedGrammarController();
  }
  return grammarController;
};

export default UnifiedGrammarController; 