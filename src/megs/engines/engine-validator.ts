/**
 * Engine capability detection and validation system
 */

import { GrammarEngine, EngineCapability, EngineMode } from '../types/index.js';
import { createConfigurationError } from '../errors/index.js';

/**
 * Result of engine validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates an engine's configuration and capabilities
 */
export class EngineValidator {
  /**
   * Validate an engine's configuration and capabilities
   */
  static validate(engine: GrammarEngine): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check required properties
    if (!engine.id) {
      result.errors.push('Engine ID is required');
      result.valid = false;
    }
    
    if (!engine.name) {
      result.errors.push('Engine name is required');
      result.valid = false;
    }
    
    if (!engine.version) {
      result.errors.push('Engine version is required');
      result.valid = false;
    }
    
    // Check capabilities
    if (!engine.capabilities || engine.capabilities.length === 0) {
      result.errors.push('Engine must have at least one capability');
      result.valid = false;
    }
    
    // Check for required methods
    if (typeof engine.initialize !== 'function') {
      result.errors.push('Engine must implement initialize() method');
      result.valid = false;
    }
    
    if (typeof engine.process !== 'function') {
      result.errors.push('Engine must implement process() method');
      result.valid = false;
    }
    
    if (typeof engine.shutdown !== 'function') {
      result.errors.push('Engine must implement shutdown() method');
      result.valid = false;
    }
    
    if (typeof engine.getStatus !== 'function') {
      result.errors.push('Engine must implement getStatus() method');
      result.valid = false;
    }
    
    // Check mode
    if (engine.mode !== 'offline' && engine.mode !== 'online') {
      result.errors.push('Engine mode must be either "offline" or "online"');
      result.valid = false;
    }
    
    // Add warnings for potential issues
    if (engine.mode === 'online') {
      result.warnings.push('Online engines may not work in offline environments');
    }
    
    return result;
  }
  
  /**
   * Validate an engine and throw an error if invalid
   */
  static validateOrThrow(engine: GrammarEngine): void {
    const result = this.validate(engine);
    
    if (!result.valid) {
      throw createConfigurationError(
        `Invalid engine configuration: ${result.errors.join(', ')}`,
        'engine',
        { engineId: engine.id, errors: result.errors }
      );
    }
  }
  
  /**
   * Check if an engine supports a specific capability
   */
  static hasCapability(engine: GrammarEngine, capability: EngineCapability): boolean {
    return engine.capabilities.includes(capability);
  }
  
  /**
   * Check if an engine supports a set of capabilities
   */
  static hasCapabilities(engine: GrammarEngine, capabilities: EngineCapability[]): boolean {
    return capabilities.every(cap => engine.capabilities.includes(cap));
  }
  
  /**
   * Check if an engine can run in offline mode
   */
  static canRunOffline(engine: GrammarEngine): boolean {
    return engine.mode === 'offline';
  }
  
  /**
   * Get the capabilities supported by an engine
   */
  static getCapabilities(engine: GrammarEngine): EngineCapability[] {
    return [...engine.capabilities];
  }
  
  /**
   * Filter engines by capability
   */
  static filterByCapability(engines: GrammarEngine[], capability: EngineCapability): GrammarEngine[] {
    return engines.filter(engine => this.hasCapability(engine, capability));
  }
  
  /**
   * Filter engines by mode
   */
  static filterByMode(engines: GrammarEngine[], mode: EngineMode): GrammarEngine[] {
    return engines.filter(engine => engine.mode === mode);
  }
}