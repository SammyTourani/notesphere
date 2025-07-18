/**
 * Unit tests for the Orchestrator implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OrchestratorImpl } from '../core/orchestrator.js';
import { 
  GrammarEngine, 
  EngineCapability, 
  EngineStatus, 
  EngineOptions, 
  EngineResult,
  EngineMode
} from '../types/index.js';

// Mock implementation of a GrammarEngine for testing
class MockEngine implements GrammarEngine {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string = '1.0.0';
  public readonly capabilities: EngineCapability[];
  public readonly mode: EngineMode;
  
  public initialized: boolean = false;
  public processCalled: boolean = false;
  public processOptions?: EngineOptions;
  public processText?: string;
  public shouldFail: boolean = false;
  public processingDelay: number = 0;

  constructor(
    id: string, 
    capabilities: EngineCapability[] = [EngineCapability.GRAMMAR],
    mode: EngineMode = 'offline'
  ) {
    this.id = id;
    this.name = `Mock ${id}`;
    this.capabilities = capabilities;
    this.mode = mode;
  }

  async initialize(): Promise<void> {
    if (this.shouldFail) {
      throw new Error(`Mock engine ${this.id} failed to initialize`);
    }
    
    this.initialized = true;
    return Promise.resolve();
  }

  async process(text: string, options?: EngineOptions): Promise<EngineResult> {
    this.processCalled = true;
    this.processText = text;
    this.processOptions = options;
    
    if (this.shouldFail) {
      throw new Error(`Mock engine ${this.id} failed to process`);
    }
    
    if (this.processingDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.processingDelay));
    }
    
    return {
      engineId: this.id,
      issues: [
        {
          id: `${this.id}-issue-1`,
          type: 'grammar',
          category: 'test',
          message: 'Test issue',
          suggestions: [],
          range: { start: 0, end: 5, context: text.substring(0, 5) }
        }
      ],
      metadata: {
        processingTime: 0,
        version: this.version,
        language: options?.language || 'en',
        ruleCount: 1
      }
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    return Promise.resolve();
  }

  getStatus(): EngineStatus {
    return {
      id: this.id,
      name: this.name,
      initialized: this.initialized,
      healthy: !this.shouldFail,
      processingCount: this.processCalled ? 1 : 0,
      averageProcessingTime: 0
    };
  }
}

describe('OrchestratorImpl', () => {
  let orchestrator: OrchestratorImpl;
  let mockEngine1: MockEngine;
  let mockEngine2: MockEngine;
  
  beforeEach(() => {
    // Create a new orchestrator and mock engines for each test
    orchestrator = new OrchestratorImpl({
      concurrency: 2,
      timeout: 1000,
      engineTimeouts: { 'mock1': 500, 'mock2': 500 },
      engineRetries: { 'mock1': 1, 'mock2': 1 },
      cacheEnabled: false,
      cacheSize: 10,
      fallbackStrategy: 'continue',
      initSequence: ['mock1', 'mock2']
    });
    
    mockEngine1 = new MockEngine('mock1');
    mockEngine2 = new MockEngine('mock2');
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should initialize registered engines in the correct sequence', async () => {
    // Spy on the initialize methods
    const spy1 = vi.spyOn(mockEngine1, 'initialize');
    const spy2 = vi.spyOn(mockEngine2, 'initialize');
    
    // Register engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    
    // Initialize orchestrator
    await orchestrator.initialize();
    
    // Verify both engines were initialized
    expect(mockEngine1.initialized).toBe(true);
    expect(mockEngine2.initialized).toBe(true);
    
    // Verify initialization order (both should have been called)
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });
  
  it('should continue initialization if an engine fails and fallbackStrategy is continue', async () => {
    // Make one engine fail
    mockEngine1.shouldFail = true;
    
    // Register engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    
    // Initialize orchestrator
    await orchestrator.initialize();
    
    // Verify only the working engine was initialized
    expect(mockEngine1.initialized).toBe(false);
    expect(mockEngine2.initialized).toBe(true);
  });
  
  it('should fail initialization if an engine fails and fallbackStrategy is fail', async () => {
    // Create orchestrator with fail strategy
    orchestrator = new OrchestratorImpl({
      fallbackStrategy: 'fail',
      initSequence: ['mock1', 'mock2']
    });
    
    // Make one engine fail
    mockEngine1.shouldFail = true;
    
    // Register engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    
    // Initialize orchestrator should fail
    await expect(orchestrator.initialize()).rejects.toThrow();
    
    // Verify no engines were fully initialized
    expect(mockEngine1.initialized).toBe(false);
    expect(mockEngine2.initialized).toBe(false);
  });
  
  it('should process text through all registered engines', async () => {
    // Register and initialize engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    await orchestrator.initialize();
    
    // Process text
    const result = await orchestrator.process('Test text');
    
    // Verify both engines were called
    expect(mockEngine1.processCalled).toBe(true);
    expect(mockEngine2.processCalled).toBe(true);
    expect(mockEngine1.processText).toBe('Test text');
    expect(mockEngine2.processText).toBe('Test text');
    
    // Verify result metadata
    expect(result.metadata.enginesUsed).toContain('mock1');
    expect(result.metadata.enginesUsed).toContain('mock2');
    expect(result.text).toBe('Test text');
  });
  
  it('should handle engine failures during processing', async () => {
    // Register and initialize engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    await orchestrator.initialize();
    
    // Make one engine fail during processing
    mockEngine1.shouldFail = true;
    
    // Process text
    const result = await orchestrator.process('Test text');
    
    // Verify both engines were called
    expect(mockEngine1.processCalled).toBe(true);
    expect(mockEngine2.processCalled).toBe(true);
    
    // Verify only results from working engine are included
    expect(result.metadata.enginesUsed).not.toContain('mock1');
    expect(result.metadata.enginesUsed).toContain('mock2');
  });
  
  it('should handle timeouts during processing', async () => {
    // Register and initialize engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    await orchestrator.initialize();
    
    // Make one engine slow
    mockEngine1.processingDelay = 600; // Longer than the 500ms timeout
    
    // Process text
    const result = await orchestrator.process('Test text');
    
    // Verify both engines were called
    expect(mockEngine1.processCalled).toBe(true);
    expect(mockEngine2.processCalled).toBe(true);
    
    // Verify only results from non-timed-out engine are included
    expect(result.metadata.enginesUsed).not.toContain('mock1');
    expect(result.metadata.enginesUsed).toContain('mock2');
  });
  
  it('should respect engine mode when processing with speed priority', async () => {
    // Create online and offline engines
    const offlineEngine = new MockEngine('offline', [EngineCapability.GRAMMAR], 'offline');
    const onlineEngine = new MockEngine('online', [EngineCapability.GRAMMAR], 'online');
    
    // Register and initialize engines
    orchestrator.registerEngine(offlineEngine);
    orchestrator.registerEngine(onlineEngine);
    await orchestrator.initialize();
    
    // Process text with speed priority
    const result = await orchestrator.process('Test text', { priority: 'speed' });
    
    // Verify only offline engine was used
    expect(offlineEngine.processCalled).toBe(true);
    expect(onlineEngine.processCalled).toBe(false);
    expect(result.metadata.enginesUsed).toContain('offline');
    expect(result.metadata.enginesUsed).not.toContain('online');
  });
  
  it('should unregister engines correctly', async () => {
    // Register and initialize engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    await orchestrator.initialize();
    
    // Unregister one engine
    orchestrator.unregisterEngine('mock1');
    
    // Process text
    const result = await orchestrator.process('Test text');
    
    // Verify only the remaining engine was used
    expect(mockEngine1.processCalled).toBe(false);
    expect(mockEngine2.processCalled).toBe(true);
    expect(result.metadata.enginesUsed).not.toContain('mock1');
    expect(result.metadata.enginesUsed).toContain('mock2');
  });
  
  it('should return engine status correctly', async () => {
    // Register and initialize engines
    orchestrator.registerEngine(mockEngine1);
    orchestrator.registerEngine(mockEngine2);
    await orchestrator.initialize();
    
    // Get status
    const status = orchestrator.getStatus();
    
    // Verify status
    expect(status.length).toBe(2);
    expect(status[0].id).toBe('mock1');
    expect(status[0].initialized).toBe(true);
    expect(status[1].id).toBe('mock2');
    expect(status[1].initialized).toBe(true);
  });
});