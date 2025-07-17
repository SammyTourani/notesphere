/**
 * Unit tests for the BaseGrammarEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseGrammarEngine } from '../engines/base-engine.js';
import { EngineCapability, EngineIssue, EngineOptions, EngineMode } from '../types/index.js';

// Concrete implementation of BaseGrammarEngine for testing
class TestEngine extends BaseGrammarEngine {
  public initializeInternalCalled = false;
  public processInternalCalled = false;
  public shutdownInternalCalled = false;
  public shouldFailInitialize = false;
  public shouldFailProcess = false;
  public processDelay = 0;
  public lastProcessOptions?: EngineOptions;
  public lastProcessText?: string;

  constructor(
    id: string = 'test-engine',
    name: string = 'Test Engine',
    version: string = '1.0.0',
    capabilities: EngineCapability[] = [EngineCapability.GRAMMAR],
    mode: EngineMode = 'offline'
  ) {
    super(id, name, version, capabilities, mode);
  }

  protected async initializeInternal(): Promise<void> {
    this.initializeInternalCalled = true;
    
    if (this.shouldFailInitialize) {
      throw new Error('Test initialization failure');
    }
  }

  protected async processInternal(text: string, options?: EngineOptions): Promise<EngineIssue[]> {
    this.processInternalCalled = true;
    this.lastProcessText = text;
    this.lastProcessOptions = options;
    
    if (this.processDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.processDelay));
    }
    
    if (this.shouldFailProcess) {
      throw new Error('Test processing failure');
    }
    
    return [
      {
        id: 'test-issue-1',
        type: 'grammar',
        category: 'test',
        message: 'Test issue',
        suggestions: [{ text: 'Suggestion', confidence: 0.9 }],
        range: { start: 0, end: 4, context: text.substring(0, 4) }
      }
    ];
  }

  protected async shutdownInternal(): Promise<void> {
    this.shutdownInternalCalled = true;
  }
}

describe('BaseGrammarEngine', () => {
  let engine: TestEngine;
  
  beforeEach(() => {
    engine = new TestEngine();
  });
  
  it('should initialize correctly', async () => {
    await engine.initialize();
    
    expect(engine.initializeInternalCalled).toBe(true);
    expect(engine.initialized).toBe(true);
  });
  
  it('should handle initialization failures', async () => {
    engine.shouldFailInitialize = true;
    
    await expect(engine.initialize()).rejects.toThrow();
    expect(engine.initialized).toBe(false);
    
    const status = engine.getStatus();
    expect(status.healthy).toBe(false);
    expect(status.lastError).toBeDefined();
  });
  
  it('should process text correctly', async () => {
    await engine.initialize();
    
    const result = await engine.process('Test text', { language: 'en' });
    
    expect(engine.processInternalCalled).toBe(true);
    expect(engine.lastProcessText).toBe('Test text');
    expect(engine.lastProcessOptions?.language).toBe('en');
    
    expect(result.engineId).toBe('test-engine');
    expect(result.issues.length).toBe(1);
    expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    expect(result.metadata.language).toBe('en');
  });
  
  it('should handle processing failures', async () => {
    await engine.initialize();
    engine.shouldFailProcess = true;
    
    await expect(engine.process('Test text')).rejects.toThrow();
    
    const status = engine.getStatus();
    expect(status.healthy).toBe(false);
    expect(status.lastError).toBeDefined();
  });
  
  it('should handle timeouts during processing', async () => {
    await engine.initialize();
    engine.processDelay = 200;
    
    await expect(engine.process('Test text', { timeout: 100 })).rejects.toThrow(/timed out/);
  });
  
  it('should return empty results for empty text', async () => {
    await engine.initialize();
    
    const result = await engine.process('');
    
    expect(engine.processInternalCalled).toBe(false);
    expect(result.issues.length).toBe(0);
  });
  
  it('should throw error if process is called before initialization', async () => {
    await expect(engine.process('Test text')).rejects.toThrow(/not initialized/);
  });
  
  it('should shutdown correctly', async () => {
    await engine.initialize();
    await engine.shutdown();
    
    expect(engine.shutdownInternalCalled).toBe(true);
    expect(engine.initialized).toBe(false);
  });
  
  it('should provide correct status information', async () => {
    await engine.initialize();
    await engine.process('Test text');
    
    const status = engine.getStatus();
    
    expect(status.id).toBe('test-engine');
    expect(status.name).toBe('Test Engine');
    expect(status.initialized).toBe(true);
    expect(status.healthy).toBe(true);
    expect(status.processingCount).toBe(1);
    expect(status.averageProcessingTime).toBeGreaterThanOrEqual(0);
  });
  
  it('should correctly check for capabilities', () => {
    expect(engine.hasCapability(EngineCapability.GRAMMAR)).toBe(true);
    expect(engine.hasCapability(EngineCapability.SPELLING)).toBe(false);
  });
});