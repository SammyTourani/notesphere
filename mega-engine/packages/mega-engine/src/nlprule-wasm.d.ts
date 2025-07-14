declare module './nlp/pkg/nlprule_wasm.js' {
  export default function init(input?: any): Promise<void>;
  export class NlpRuleChecker {
    static new(): NlpRuleChecker;
    static new_with_rules(rules: Uint8Array): NlpRuleChecker;
    check(text: string): string;
  }
}

declare module './nlprule_wasm.js' {
  export default function init(input?: any): Promise<void>;
  export class NlpRuleChecker {
    static new(): NlpRuleChecker;
    static new_with_rules(rules: Uint8Array): NlpRuleChecker;
    check(text: string): string;
  }
}
