/**
 * 🎯 MEGA ENGINE BENCHMARK SUITE
 * 
 * Comprehensive testing framework for grammar engine accuracy, performance, and reliability
 * 
 * Test Categories:
 * 1. Grammar Accuracy (Subject-Verb Agreement, Pronoun Case, etc.)
 * 2. Spelling & Typos (Common misspellings, homophones)
 * 3. Style & Clarity (Readability, tone, conciseness)
 * 4. Edge Cases (Technical writing, creative content, dialects)
 * 5. Performance (Speed, memory, scalability)
 * 6. False Positive Analysis (Over-detection prevention)
 */

export class MegaEngineBenchmarkSuite {
  constructor() {
    this.results = {
      grammar: { total: 0, detected: 0, accuracy: 0, falsePositives: 0 },
      spelling: { total: 0, detected: 0, accuracy: 0, falsePositives: 0 },
      style: { total: 0, detected: 0, accuracy: 0, falsePositives: 0 },
      performance: { avgTime: 0, maxTime: 0, memoryUsage: 0 },
      overall: { precision: 0, recall: 0, f1Score: 0 }
    };
    
    this.testCases = this.initializeTestCases();
  }

  /**
   * Initialize comprehensive test datasets
   */
  initializeTestCases() {
    return {
      // ============================================
      // GRAMMAR ACCURACY TESTS (High Priority)
      // ============================================
      grammar: {
        subjectVerbAgreement: [
          {
            text: "The cats is hungry.",
            expected: ["subject-verb agreement"],
            category: "grammar",
            severity: "error",
            description: "Plural subject with singular verb"
          },
          {
            text: "Each of the students have finished their homework.",
            expected: ["subject-verb agreement"],
            category: "grammar", 
            severity: "error",
            description: "Singular 'each' with plural verb"
          },
          {
            text: "Neither John nor Mary were present.",
            expected: ["subject-verb agreement"],
            category: "grammar",
            severity: "error", 
            description: "Neither/nor with plural verb"
          }
        ],
        
        pronounCase: [
          {
            text: "Between you and I, this is wrong.",
            expected: ["pronoun case"],
            category: "grammar",
            severity: "error",
            description: "Objective case needed after preposition"
          },
          {
            text: "Me and my friend went to the store.",
            expected: ["pronoun case"],
            category: "grammar",
            severity: "error",
            description: "Subject pronoun needed"
          }
        ],
        
        verbTense: [
          {
            text: "I have went to the store yesterday.",
            expected: ["verb tense"],
            category: "grammar",
            severity: "error",
            description: "Present perfect with past time marker"
          },
          {
            text: "If I was you, I would be careful.",
            expected: ["subjunctive mood"],
            category: "grammar",
            severity: "error",
            description: "Subjunctive 'were' needed in hypothetical"
          }
        ],
        
        articles: [
          {
            text: "I need to buy car.",
            expected: ["missing article"],
            category: "grammar",
            severity: "error",
            description: "Indefinite article needed"
          },
          {
            text: "The United States is the country.",
            expected: ["redundant article"],
            category: "grammar",
            severity: "error",
            description: "Redundant article with proper noun"
          }
        ]
      },

      // ============================================
      // SPELLING & TYPO TESTS
      // ============================================
      spelling: {
        commonMisspellings: [
          {
            text: "I recieved your mesage yesturday.",
            expected: ["received", "message", "yesterday"],
            category: "spelling",
            severity: "error",
            description: "Common spelling errors"
          },
          {
            text: "The databse performance is effected by querys.",
            expected: ["database", "affected", "queries"],
            category: "spelling",
            severity: "error",
            description: "Technical term misspellings"
          }
        ],
        
        homophones: [
          {
            text: "Their going to loose there minds when they here the news.",
            expected: ["they're", "lose", "their", "hear"],
            category: "spelling",
            severity: "error",
            description: "Common homophone confusions"
          },
          {
            text: "I could of helped you, but you're going to have to except the consequences.",
            expected: ["could have", "accept"],
            category: "spelling",
            severity: "error",
            description: "Contraction and homophone errors"
          }
        ]
      },

      // ============================================
      // STYLE & CLARITY TESTS
      // ============================================
      style: {
        wordiness: [
          {
            text: "Due to the fact that we need to think outside the box, we should separate the students who performed a lot better than the others.",
            expected: ["wordiness", "clarity"],
            category: "style",
            severity: "warning",
            description: "Wordy and unclear phrasing"
          },
          {
            text: "In order to achieve better results, we need to accommodate their needs more effectively.",
            expected: ["wordiness"],
            category: "style",
            severity: "warning",
            description: "Redundant phrases"
          }
        ],
        
        passiveVoice: [
          {
            text: "The report was written by John and was reviewed by the committee.",
            expected: ["passive voice"],
            category: "style",
            severity: "warning",
            description: "Passive construction"
          }
        ],
        
        readability: [
          {
            text: "The implementation of the aforementioned methodology necessitates the utilization of sophisticated computational algorithms.",
            expected: ["readability", "complexity"],
            category: "style",
            severity: "warning",
            description: "Overly complex academic writing"
          }
        ]
      },

      // ============================================
      // EDGE CASES & ADVANCED TESTS
      // ============================================
      edgeCases: {
        technicalWriting: [
          {
            text: "The API endpoint returns a 404 error when the user_id parameter is null or undefined.",
            expected: [],
            category: "technical",
            severity: "info",
            description: "Correct technical writing"
          },
          {
            text: "The data clearly shows that none of the participants was prepared for their final exam.",
            expected: ["subject-verb agreement"],
            category: "grammar",
            severity: "error",
            description: "Technical context with grammar error"
          }
        ],
        
        creativeWriting: [
          {
            text: "The wind whispered secrets to the ancient trees, their branches dancing in the moonlight.",
            expected: [],
            category: "creative",
            severity: "info",
            description: "Correct creative writing"
          }
        ],
        
        dialectVariations: [
          {
            text: "I ain't got no time for that nonsense.",
            expected: ["double negative", "informal"],
            category: "style",
            severity: "warning",
            description: "Dialectal variation"
          }
        ]
      },

      // ============================================
      // FALSE POSITIVE TESTS (Clean Text)
      // ============================================
      cleanText: [
        {
          text: "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet.",
          expected: [],
          category: "clean",
          severity: "info",
          description: "Perfectly clean text"
        },
        {
          text: "She carefully reviewed the document before submitting it to her supervisor.",
          expected: [],
          category: "clean",
          severity: "info",
          description: "Professional writing"
        },
        {
          text: "The research findings indicate a significant correlation between exercise and mental health outcomes.",
          expected: [],
          category: "clean",
          severity: "info",
          description: "Academic writing"
        }
      ]
    };
  }

  /**
   * Run comprehensive benchmark tests
   */
  async runFullBenchmark(grammarEngine) {
    console.log('🎯 Starting Mega Engine Benchmark Suite...');
    
    const startTime = Date.now();
    const results = {
      grammar: await this.testGrammarAccuracy(grammarEngine),
      spelling: await this.testSpellingAccuracy(grammarEngine),
      style: await this.testStyleAccuracy(grammarEngine),
      edgeCases: await this.testEdgeCases(grammarEngine),
      falsePositives: await this.testFalsePositives(grammarEngine),
      performance: await this.testPerformance(grammarEngine)
    };
    
    const totalTime = Date.now() - startTime;
    
    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(results);
    
    return {
      results,
      overallMetrics,
      benchmarkTime: totalTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test grammar accuracy across all categories
   */
  async testGrammarAccuracy(engine) {
    console.log('📚 Testing Grammar Accuracy...');
    
    const categories = ['subjectVerbAgreement', 'pronounCase', 'verbTense', 'articles'];
    const results = { total: 0, detected: 0, falsePositives: 0, details: [] };
    
    for (const category of categories) {
      const testCases = this.testCases.grammar[category];
      
      for (const testCase of testCases) {
        results.total++;
        
        try {
          const engineResult = await engine.checkText(testCase.text);
          const detectedIssues = engineResult.issues || [];
          
          // Check if expected issues were detected
          const expectedDetected = testCase.expected.some(expected => 
            detectedIssues.some(issue => 
              issue.message.toLowerCase().includes(expected.toLowerCase()) ||
              issue.category === testCase.category
            )
          );
          
          if (expectedDetected) {
            results.detected++;
          }
          
          // Check for false positives (detected issues not expected)
          const falsePositives = detectedIssues.filter(issue => 
            !testCase.expected.some(expected => 
              issue.message.toLowerCase().includes(expected.toLowerCase())
            )
          );
          
          results.falsePositives += falsePositives.length;
          
          results.details.push({
            text: testCase.text,
            expected: testCase.expected,
            detected: detectedIssues.map(i => i.message),
            correct: expectedDetected,
            falsePositives: falsePositives.length,
            category: testCase.category
          });
          
        } catch (error) {
          console.error(`Error testing: ${testCase.text}`, error);
        }
      }
    }
    
    results.accuracy = results.total > 0 ? (results.detected / results.total) * 100 : 0;
    return results;
  }

  /**
   * Test spelling accuracy
   */
  async testSpellingAccuracy(engine) {
    console.log('🔤 Testing Spelling Accuracy...');
    
    const categories = ['commonMisspellings', 'homophones'];
    const results = { total: 0, detected: 0, falsePositives: 0, details: [] };
    
    for (const category of categories) {
      const testCases = this.testCases.spelling[category];
      
      for (const testCase of testCases) {
        results.total++;
        
        try {
          const engineResult = await engine.checkText(testCase.text);
          const detectedIssues = engineResult.issues || [];
          
          // Check if expected spelling errors were detected
          const expectedDetected = testCase.expected.some(expected => 
            detectedIssues.some(issue => 
              issue.message.toLowerCase().includes(expected.toLowerCase()) ||
              issue.category === 'spelling'
            )
          );
          
          if (expectedDetected) {
            results.detected++;
          }
          
          results.details.push({
            text: testCase.text,
            expected: testCase.expected,
            detected: detectedIssues.map(i => i.message),
            correct: expectedDetected
          });
          
        } catch (error) {
          console.error(`Error testing: ${testCase.text}`, error);
        }
      }
    }
    
    results.accuracy = results.total > 0 ? (results.detected / results.total) * 100 : 0;
    return results;
  }

  /**
   * Test style and clarity accuracy
   */
  async testStyleAccuracy(engine) {
    console.log('✨ Testing Style Accuracy...');
    
    const categories = ['wordiness', 'passiveVoice', 'readability'];
    const results = { total: 0, detected: 0, falsePositives: 0, details: [] };
    
    for (const category of categories) {
      const testCases = this.testCases.style[category];
      
      for (const testCase of testCases) {
        results.total++;
        
        try {
          const engineResult = await engine.checkText(testCase.text);
          const detectedIssues = engineResult.issues || [];
          
          // Check if expected style issues were detected
          const expectedDetected = testCase.expected.some(expected => 
            detectedIssues.some(issue => 
              issue.message.toLowerCase().includes(expected.toLowerCase()) ||
              issue.category === 'style'
            )
          );
          
          if (expectedDetected) {
            results.detected++;
          }
          
          results.details.push({
            text: testCase.text,
            expected: testCase.expected,
            detected: detectedIssues.map(i => i.message),
            correct: expectedDetected
          });
          
        } catch (error) {
          console.error(`Error testing: ${testCase.text}`, error);
        }
      }
    }
    
    results.accuracy = results.total > 0 ? (results.detected / results.total) * 100 : 0;
    return results;
  }

  /**
   * Test edge cases and advanced scenarios
   */
  async testEdgeCases(engine) {
    console.log('🔬 Testing Edge Cases...');
    
    const categories = ['technicalWriting', 'creativeWriting', 'dialectVariations'];
    const results = { total: 0, detected: 0, falsePositives: 0, details: [] };
    
    for (const category of categories) {
      const testCases = this.testCases.edgeCases[category];
      
      for (const testCase of testCases) {
        results.total++;
        
        try {
          const engineResult = await engine.checkText(testCase.text);
          const detectedIssues = engineResult.issues || [];
          
          // For edge cases, we check if the engine correctly identifies or ignores issues
          const correctDetection = testCase.expected.length === 0 ? 
            detectedIssues.length === 0 : // Should detect nothing for clean text
            detectedIssues.length > 0;    // Should detect expected issues
          
          if (correctDetection) {
            results.detected++;
          }
          
          results.details.push({
            text: testCase.text,
            expected: testCase.expected,
            detected: detectedIssues.map(i => i.message),
            correct: correctDetection,
            category: testCase.category
          });
          
        } catch (error) {
          console.error(`Error testing: ${testCase.text}`, error);
        }
      }
    }
    
    results.accuracy = results.total > 0 ? (results.detected / results.total) * 100 : 0;
    return results;
  }

  /**
   * Test false positive rate with clean text
   */
  async testFalsePositives(engine) {
    console.log('✅ Testing False Positive Rate...');
    
    const results = { total: 0, falsePositives: 0, details: [] };
    
    for (const testCase of this.testCases.cleanText) {
      results.total++;
      
      try {
        const engineResult = await engine.checkText(testCase.text);
        const detectedIssues = engineResult.issues || [];
        
        if (detectedIssues.length > 0) {
          results.falsePositives += detectedIssues.length;
        }
        
        results.details.push({
          text: testCase.text,
          detected: detectedIssues.map(i => i.message),
          falsePositiveCount: detectedIssues.length
        });
        
      } catch (error) {
        console.error(`Error testing: ${testCase.text}`, error);
      }
    }
    
    results.falsePositiveRate = results.total > 0 ? (results.falsePositives / results.total) * 100 : 0;
    return results;
  }

  /**
   * Test performance characteristics
   */
  async testPerformance(engine) {
    console.log('⚡ Testing Performance...');
    
    const testTexts = [
      "Short text for quick testing.",
      "Medium length text with multiple sentences. This should test the engine's ability to handle moderate complexity while maintaining reasonable performance metrics.",
      "This is a much longer text designed to stress test the performance characteristics of the grammar engine. It contains multiple paragraphs with various types of content including technical terms, academic language, and everyday conversation. The goal is to measure how the engine performs under realistic conditions where users might be checking entire documents or long-form content. We want to ensure that the engine can handle substantial amounts of text without significant performance degradation while still maintaining accuracy and providing useful feedback to users."
    ];
    
    const results = {
      shortText: { time: 0, issues: 0 },
      mediumText: { time: 0, issues: 0 },
      longText: { time: 0, issues: 0 },
      averageTime: 0,
      maxTime: 0
    };
    
    const times = [];
    
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      const startTime = Date.now();
      
      try {
        const engineResult = await engine.checkText(text);
        const processingTime = Date.now() - startTime;
        
        times.push(processingTime);
        
        if (i === 0) {
          results.shortText = { time: processingTime, issues: engineResult.issues?.length || 0 };
        } else if (i === 1) {
          results.mediumText = { time: processingTime, issues: engineResult.issues?.length || 0 };
        } else {
          results.longText = { time: processingTime, issues: engineResult.issues?.length || 0 };
        }
        
      } catch (error) {
        console.error(`Performance test error for text ${i}:`, error);
      }
    }
    
    results.averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    results.maxTime = Math.max(...times);
    
    return results;
  }

  /**
   * Calculate overall benchmark metrics
   */
  calculateOverallMetrics(results) {
    const grammar = results.grammar;
    const spelling = results.spelling;
    const style = results.style;
    const edgeCases = results.edgeCases;
    const falsePositives = results.falsePositives;
    
    // Calculate precision (true positives / (true positives + false positives))
    const totalDetected = grammar.detected + spelling.detected + style.detected + edgeCases.detected;
    const totalFalsePositives = grammar.falsePositives + spelling.falsePositives + style.falsePositives + edgeCases.falsePositives + falsePositives.falsePositives;
    const precision = totalDetected + totalFalsePositives > 0 ? totalDetected / (totalDetected + totalFalsePositives) : 0;
    
    // Calculate recall (true positives / total expected)
    const totalExpected = grammar.total + spelling.total + style.total + edgeCases.total;
    const recall = totalExpected > 0 ? totalDetected / totalExpected : 0;
    
    // Calculate F1 score
    const f1Score = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
    
    return {
      precision: precision * 100,
      recall: recall * 100,
      f1Score: f1Score * 100,
      overallAccuracy: (grammar.accuracy + spelling.accuracy + style.accuracy + edgeCases.accuracy) / 4,
      falsePositiveRate: falsePositives.falsePositiveRate,
      performance: results.performance
    };
  }

  /**
   * Generate comprehensive benchmark report
   */
  generateReport(benchmarkResults) {
    const { results, overallMetrics, benchmarkTime } = benchmarkResults;
    
    console.log('\n🎯 MEGA ENGINE BENCHMARK REPORT');
    console.log('================================');
    console.log(`📊 Overall F1 Score: ${overallMetrics.f1Score.toFixed(1)}%`);
    console.log(`🎯 Precision: ${overallMetrics.precision.toFixed(1)}%`);
    console.log(`📈 Recall: ${overallMetrics.recall.toFixed(1)}%`);
    console.log(`✅ False Positive Rate: ${overallMetrics.falsePositiveRate.toFixed(1)}%`);
    console.log(`⚡ Average Processing Time: ${overallMetrics.performance.averageTime.toFixed(1)}ms`);
    console.log(`⏱️ Total Benchmark Time: ${benchmarkTime}ms`);
    
    console.log('\n📚 Category Breakdown:');
    console.log(`   Grammar: ${results.grammar.accuracy.toFixed(1)}% (${results.grammar.detected}/${results.grammar.total})`);
    console.log(`   Spelling: ${results.spelling.accuracy.toFixed(1)}% (${results.spelling.detected}/${results.spelling.total})`);
    console.log(`   Style: ${results.style.accuracy.toFixed(1)}% (${results.style.detected}/${results.style.total})`);
    console.log(`   Edge Cases: ${results.edgeCases.accuracy.toFixed(1)}% (${results.edgeCases.detected}/${results.edgeCases.total})`);
    
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Short Text: ${results.performance.shortText.time}ms (${results.performance.shortText.issues} issues)`);
    console.log(`   Medium Text: ${results.performance.mediumText.time}ms (${results.performance.mediumText.issues} issues)`);
    console.log(`   Long Text: ${results.performance.longText.time}ms (${results.performance.longText.issues} issues)`);
    console.log(`   Max Time: ${results.performance.maxTime}ms`);
    
    return {
      summary: {
        f1Score: overallMetrics.f1Score,
        precision: overallMetrics.precision,
        recall: overallMetrics.recall,
        falsePositiveRate: overallMetrics.falsePositiveRate,
        averageProcessingTime: overallMetrics.performance.averageTime
      },
      details: results,
      recommendations: this.generateRecommendations(overallMetrics, results)
    };
  }

  /**
   * Generate improvement recommendations based on benchmark results
   */
  generateRecommendations(overallMetrics, results) {
    const recommendations = [];
    
    if (overallMetrics.f1Score < 80) {
      recommendations.push("🔧 Improve overall accuracy - focus on grammar and spelling detection");
    }
    
    if (overallMetrics.falsePositiveRate > 10) {
      recommendations.push("🎯 Reduce false positives - implement better confidence scoring");
    }
    
    if (results.grammar.accuracy < 85) {
      recommendations.push("📚 Enhance grammar rules - particularly subject-verb agreement and pronoun case");
    }
    
    if (results.spelling.accuracy < 90) {
      recommendations.push("🔤 Improve spelling detection - focus on homophones and technical terms");
    }
    
    if (results.performance.averageTime > 200) {
      recommendations.push("⚡ Optimize performance - implement better caching and parallel processing");
    }
    
    if (results.style.accuracy < 70) {
      recommendations.push("✨ Enhance style detection - improve wordiness and clarity analysis");
    }
    
    return recommendations;
  }
}

export default MegaEngineBenchmarkSuite; 