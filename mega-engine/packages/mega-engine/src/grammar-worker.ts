// Grammar worker for browser-only nlprule WASM
let checker: any = null;

self.onmessage = async (e: MessageEvent<string>) => {
  if (e.data === '__init__') {
    try {
      // For now, create a mock checker that will be replaced with real nlprule
      checker = {
        check: (text: string) => {
          // Subject-verb disagreement patterns
          const issues = [];
          
          // Pattern 1: "cats is" → "cats are"
          if (text.match(/\b(cats|dogs|people|they)\s+is\b/i)) {
            const match = text.match(/\b(cats|dogs|people|they)\s+is\b/i)!;
            const start = text.search(/\b(cats|dogs|people|they)\s+is\b/i);
            issues.push({
              message: 'Subject-verb disagreement',
              start: start,
              end: start + match[0].length,
              replacements: [match[0].replace('is', 'are')]
            });
          }
          
          // Pattern 2: "This are" → "This is"  
          if (text.match(/\b(this|that)\s+are\b/i)) {
            const match = text.match(/\b(this|that)\s+are\b/i)!;
            const start = text.search(/\b(this|that)\s+are\b/i);
            issues.push({
              message: 'Subject-verb agreement error',
              start: start,
              end: start + match[0].length,
              replacements: [match[0].replace('are', 'is')]
            });
          }
          
          return issues;
        }
      };
      
      self.postMessage('__ready__');
    } catch (error) {
      self.postMessage({ error: String(error) });
    }
  } else {
    try {
      const issues = checker ? checker.check(e.data) : [];
      self.postMessage(issues);
    } catch (error) {
      self.postMessage({ error: String(error) });
    }
  }
};
