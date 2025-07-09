// Type declarations for nlprule WASM module
declare module './nlp-assets/nlprule_wasm.js' {
  export default function init(): Promise<void>;
  
  export class Rules {
    static from_bin(data: Uint8Array): Rules;
  }
  
  export class Tokenizer {
    static from_rules(rules: Rules): Tokenizer;
  }
  
  export class Tagger {
    static from_rules(rules: Rules): Tagger;
  }
  
  export class Checker {
    constructor(rules: Rules, tokenizer: Tokenizer, tagger: Tagger);
    check(text: string): any[];
  }
}
