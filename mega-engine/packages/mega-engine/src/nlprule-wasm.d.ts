/**
 * Type declarations for nlprule WASM module
 */

declare module './nlp/pkg/nlprule_wasm.js' {
  export interface NlpRuleChecker {
    new(): {
      check(text: string): Array<{
        message: string;
        offset: number;
        length: number;
        suggestions?: string[];
        rule_id?: string;
        rule_description?: string;
      }>;
    };
  }

  export interface NlpRuleModule {
    NlpRuleChecker: NlpRuleChecker;
    default?: (wasmBinary: ArrayBuffer | string) => Promise<void>;
  }

  const module: NlpRuleModule;
  export default module;
}
