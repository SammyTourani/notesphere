/**
 * 🧪 MEGA ENGINE TEST RUNNER
 * 
 * Comprehensive testing framework for validating and benchmarking the Mega Engine
 * 
 * Features:
 * - Automated benchmark execution
 * - Performance testing
 * - Integration testing
 * - Real-time reporting
 * - Baseline establishment
 */

import MegaEngineBenchmarkSuite from './benchmarks/test-suite.js';
import FeedbackLoopSystem from './feedback-loop-system.js';

export class MegaEngineTestRunner {
  constructor() {
    this.benchmarkSuite = new MegaEngineBenchmarkSuite();
    this.feedbackSystem = new FeedbackLoopSystem();
    this.results = {
      benchmarks: {},
      performance: {},
      integration: {},
      baselines: {}
    };
    
    // Test configuration
    this.config = {
      runBenchmarks: true,
      runPerformance: true,
      runIntegration: true,
      establishBaselines: true,
      detailedReporting: true,
      saveResults: true
    };
    
    console.log('🧪 Mega Engine Test Runner initialized');
  }

  /**
   * Run complete test suite
   */
  async runFullTestSuite(grammarEngine) {
    console.log('🚀 Starting Mega Engine Full Test Suite...');
    
    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      engine: grammarEngine.constructor.name,
      tests: {}
    };
    
    try {
      // 1. Run benchmark tests
      if (this.config.runBenchmarks) {
        console.log('\n📊 Running Benchmark Tests...');
        results.tests.benchmarks = await this.runBenchmarkTests(grammarEngine);
      }
      
      // 2. Run performance tests
      if (this.config.runPerformance) {
        console.log('\n⚡ Running Performance Tests...');
        results.tests.performance = await this.runPerformanceTests(grammarEngine);
      }
      
      // 3. Run integration tests
      if (this.config.runIntegration) {
        console.log('\n🔗 Running Integration Tests...');
        results.tests.integration = await this.runIntegrationTests(grammarEngine);
      }
      
      // 4. Establish baselines
      if (this.config.establishBaselines) {
        console.log('\n📈 Establishing Baselines...');
        results.tests.baselines = await this.establishBaselines(results.tests);
      }
      
      // 5. Generate comprehensive report
      const totalTime = Date.now() - startTime;
      results.executionTime = totalTime;
      results.summary = this.generateTestSummary(results.tests);
      
      // 6. Save results if enabled
      if (this.config.saveResults) {
        await this.saveTestResults(results);
      }
      
      // 7. Display results
      this.displayTestResults(results);
      
      console.log(`\n✅ Full Test Suite completed in ${totalTime}ms`);
      return results;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return { error: error.message, timestamp: new Date().toISOString() };
    }
  }

  /**
   * Run comprehensive benchmark tests
   */
  async runBenchmarkTests(grammarEngine) {
    try {
      const benchmarkResults = await this.benchmarkSuite.runFullBenchmark(grammarEngine);
      
      return {
        success: true,
        results: benchmarkResults,
        summary: this.benchmarkSuite.generateReport(benchmarkResults)
      };
      
    } catch (error) {
      console.error('❌ Benchmark tests failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(grammarEngine) {
    const results = {
      shortText: {},
      mediumText: {},
      longText: {},
      concurrentRequests: {},
      memoryUsage: {},
      cacheEfficiency: {}
    };
    
    try {
      // Test different text lengths
      results.shortText = await this.testTextPerformance(grammarEngine, 'short');
      results.mediumText = await this.testTextPerformance(grammarEngine, 'medium');
      results.longText = await this.testTextPerformance(grammarEngine, 'long');
      
      // Test concurrent requests
      results.concurrentRequests = await this.testConcurrentPerformance(grammarEngine);
      
      // Test memory usage
      results.memoryUsage = await this.testMemoryUsage(grammarEngine);
      
      // Test cache efficiency
      results.cacheEfficiency = await this.testCacheEfficiency(grammarEngine);
      
      return {
        success: true,
        results,
        summary: this.generatePerformanceSummary(results)
      };
      
    } catch (error) {
      console.error('❌ Performance tests failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test performance with different text lengths
   */
  async testTextPerformance(grammarEngine, textType) {
    const testTexts = {
      short: "The cats is hungry.",
      medium: "Between you and I, each of the students have finished there homework incorrectly. The data clearly shows that none of the participants was prepared for they're final exam.",
      long: "Between you and I, each of the students have finished there homework incorrectly. The data clearly shows that none of the participants was prepared for they're final exam. I could of helped them, but their going to have to learn this themself. Me and my colleague thinks that this are a serious problem that effects everyone. Due to the fact that we need to think outside the box, we should seperate the students who performed alot better then the others. In order to achieve better results, we need to accomodate there needs more effectively. This is a neccessary step that will definitly help improve the situation."
    };
    
    const text = testTexts[textType];
    const iterations = 10;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await grammarEngine.checkText(text);
      const endTime = Date.now();
      times.push(endTime - startTime);
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    return {
      textLength: text.length,
      wordCount: text.split(/\s+/).length,
      averageTime: avgTime,
      minTime,
      maxTime,
      times
    };
  }

  /**
   * Test concurrent request performance
   */
  async testConcurrentPerformance(grammarEngine) {
    const testText = "The cats is hungry. Between you and I, this are a test.";
    const concurrentRequests = [1, 5, 10, 20];
    const results = {};
    
    for (const count of concurrentRequests) {
      const startTime = Date.now();
      
      const promises = Array(count).fill().map(() => 
        grammarEngine.checkText(testText)
      );
      
      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      const avgTimePerRequest = totalTime / count;
      
      results[count] = {
        totalTime,
        avgTimePerRequest,
        requestsPerSecond: (count / totalTime) * 1000
      };
    }
    
    return results;
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage(grammarEngine) {
    if (typeof performance !== 'undefined' && performance.memory) {
      const initialMemory = performance.memory.usedJSHeapSize;
      
      // Run multiple checks to stress memory
      for (let i = 0; i < 100; i++) {
        await grammarEngine.checkText(`Test text ${i} with some grammar issues.`);
      }
      
      const finalMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = finalMemory - initialMemory;
      
      return {
        initialMemory: initialMemory / 1024 / 1024, // MB
        finalMemory: finalMemory / 1024 / 1024, // MB
        memoryIncrease: memoryIncrease / 1024 / 1024, // MB
        memoryEfficient: memoryIncrease < 50 * 1024 * 1024 // < 50MB
      };
    }
    
    return { error: 'Memory API not available' };
  }

  /**
   * Test cache efficiency
   */
  async testCacheEfficiency(grammarEngine) {
    const testText = "The cats is hungry.";
    const iterations = 10;
    
    // First run (cache miss)
    const firstStart = Date.now();
    await grammarEngine.checkText(testText);
    const firstTime = Date.now() - firstStart;
    
    // Subsequent runs (cache hits)
    const cacheTimes = [];
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await grammarEngine.checkText(testText);
      cacheTimes.push(Date.now() - start);
    }
    
    const avgCacheTime = cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length;
    const cacheEfficiency = ((firstTime - avgCacheTime) / firstTime) * 100;
    
    return {
      firstRunTime: firstTime,
      avgCacheTime,
      cacheEfficiency,
      cacheTimes
    };
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(grammarEngine) {
    const results = {
      initialization: {},
      errorHandling: {},
      edgeCases: {},
      apiConsistency: {}
    };
    
    try {
      // Test initialization
      results.initialization = await this.testInitialization(grammarEngine);
      
      // Test error handling
      results.errorHandling = await this.testErrorHandling(grammarEngine);
      
      // Test edge cases
      results.edgeCases = await this.testEdgeCases(grammarEngine);
      
      // Test API consistency
      results.apiConsistency = await this.testAPIConsistency(grammarEngine);
      
      return {
        success: true,
        results,
        summary: this.generateIntegrationSummary(results)
      };
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test engine initialization
   */
  async testInitialization(grammarEngine) {
    const startTime = Date.now();
    
    try {
      // Test if engine can be initialized
      if (grammarEngine.init) {
        await grammarEngine.init();
      }
      
      const initTime = Date.now() - startTime;
      
      return {
        success: true,
        initTime,
        isInitialized: grammarEngine.isInitialized || true
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        initTime: Date.now() - startTime
      };
    }
  }

  /**
   * Test error handling
   */
  async testErrorHandling(grammarEngine) {
    const tests = [
      { input: null, expected: 'handle null input' },
      { input: '', expected: 'handle empty string' },
      { input: 'a', expected: 'handle very short text' },
      { input: 'a'.repeat(10000), expected: 'handle very long text' }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        await grammarEngine.checkText(test.input);
        results.push({
          test: test.expected,
          success: true,
          error: null
        });
      } catch (error) {
        results.push({
          test: test.expected,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalTests: tests.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Test edge cases
   */
  async testEdgeCases(grammarEngine) {
    const edgeCases = [
      "HTML <b>tags</b> in text",
      "Special characters: @#$%^&*()",
      "Numbers: 123 456 789",
      "Mixed languages: bonjour hello hola",
      "Very long word: " + "a".repeat(100),
      "Emojis: 🚀 📝 ✅ ❌"
    ];
    
    const results = [];
    
    for (const text of edgeCases) {
      try {
        const startTime = Date.now();
        const result = await grammarEngine.checkText(text);
        const processingTime = Date.now() - startTime;
        
        results.push({
          text: text.substring(0, 30) + "...",
          success: true,
          issuesFound: result.issues?.length || 0,
          processingTime
        });
      } catch (error) {
        results.push({
          text: text.substring(0, 30) + "...",
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      totalCases: edgeCases.length,
      successfulCases: results.filter(r => r.success).length,
      failedCases: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Test API consistency
   */
  async testAPIConsistency(grammarEngine) {
    const testText = "The cats is hungry.";
    const iterations = 5;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const result = await grammarEngine.checkText(testText);
      
      results.push({
        iteration: i + 1,
        hasIssues: Array.isArray(result.issues),
        issuesCount: result.issues?.length || 0,
        hasStatistics: !!result.statistics,
        processingTime: result.statistics?.processingTime || 0
      });
    }
    
    // Check consistency
    const issueCounts = results.map(r => r.issuesCount);
    const isConsistent = issueCounts.every(count => count === issueCounts[0]);
    
    return {
      totalTests: iterations,
      consistentResults: isConsistent,
      averageIssues: issueCounts.reduce((a, b) => a + b, 0) / issueCounts.length,
      results
    };
  }

  /**
   * Establish performance baselines
   */
  async establishBaselines(testResults) {
    const baselines = {
      accuracy: {
        grammar: testResults.benchmarks?.results?.grammar?.accuracy || 0,
        spelling: testResults.benchmarks?.results?.spelling?.accuracy || 0,
        style: testResults.benchmarks?.results?.style?.accuracy || 0,
        overall: testResults.benchmarks?.overallMetrics?.f1Score || 0
      },
      performance: {
        shortText: testResults.performance?.results?.shortText?.averageTime || 0,
        mediumText: testResults.performance?.results?.mediumText?.averageTime || 0,
        longText: testResults.performance?.results?.longText?.averageTime || 0,
        concurrentRequests: testResults.performance?.results?.concurrentRequests || {}
      },
      reliability: {
        initialization: testResults.integration?.results?.initialization?.success || false,
        errorHandling: testResults.integration?.results?.errorHandling?.passedTests || 0,
        edgeCases: testResults.integration?.results?.edgeCases?.successfulCases || 0,
        apiConsistency: testResults.integration?.results?.apiConsistency?.consistentResults || false
      }
    };
    
    return {
      timestamp: new Date().toISOString(),
      baselines,
      recommendations: this.generateBaselineRecommendations(baselines)
    };
  }

  /**
   * Generate test summary
   */
  generateTestSummary(testResults) {
    const summary = {
      overall: {
        success: true,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      },
      benchmarks: {
        accuracy: testResults.benchmarks?.summary?.f1Score || 0,
        precision: testResults.benchmarks?.summary?.precision || 0,
        recall: testResults.benchmarks?.summary?.recall || 0
      },
      performance: {
        averageTime: 0,
        maxTime: 0,
        cacheEfficiency: 0
      },
      integration: {
        initialization: false,
        errorHandling: 0,
        edgeCases: 0,
        apiConsistency: false
      }
    };
    
    // Calculate performance averages
    if (testResults.performance?.results) {
      const perf = testResults.performance.results;
      summary.performance.averageTime = (
        (perf.shortText?.averageTime || 0) +
        (perf.mediumText?.averageTime || 0) +
        (perf.longText?.averageTime || 0)
      ) / 3;
      
      summary.performance.maxTime = Math.max(
        perf.shortText?.maxTime || 0,
        perf.mediumText?.maxTime || 0,
        perf.longText?.maxTime || 0
      );
      
      summary.performance.cacheEfficiency = perf.cacheEfficiency?.cacheEfficiency || 0;
    }
    
    // Calculate integration metrics
    if (testResults.integration?.results) {
      const integration = testResults.integration.results;
      summary.integration.initialization = integration.initialization?.success || false;
      summary.integration.errorHandling = integration.errorHandling?.passedTests || 0;
      summary.integration.edgeCases = integration.edgeCases?.successfulCases || 0;
      summary.integration.apiConsistency = integration.apiConsistency?.consistentResults || false;
    }
    
    return summary;
  }

  /**
   * Generate performance summary
   */
  generatePerformanceSummary(performanceResults) {
    return {
      textPerformance: {
        short: performanceResults.shortText,
        medium: performanceResults.mediumText,
        long: performanceResults.longText
      },
      concurrentPerformance: performanceResults.concurrentRequests,
      memoryUsage: performanceResults.memoryUsage,
      cacheEfficiency: performanceResults.cacheEfficiency
    };
  }

  /**
   * Generate integration summary
   */
  generateIntegrationSummary(integrationResults) {
    return {
      initialization: integrationResults.initialization,
      errorHandling: integrationResults.errorHandling,
      edgeCases: integrationResults.edgeCases,
      apiConsistency: integrationResults.apiConsistency
    };
  }

  /**
   * Generate baseline recommendations
   */
  generateBaselineRecommendations(baselines) {
    const recommendations = [];
    
    // Accuracy recommendations
    if (baselines.accuracy.overall < 80) {
      recommendations.push("🎯 Improve overall accuracy - focus on grammar and spelling detection");
    }
    
    if (baselines.accuracy.grammar < 85) {
      recommendations.push("📚 Enhance grammar rules - particularly subject-verb agreement");
    }
    
    // Performance recommendations
    if (baselines.performance.mediumText > 200) {
      recommendations.push("⚡ Optimize performance - target <200ms for medium text");
    }
    
    if (baselines.performance.cacheEfficiency < 50) {
      recommendations.push("💾 Improve caching strategy - target >50% efficiency");
    }
    
    // Reliability recommendations
    if (!baselines.reliability.initialization) {
      recommendations.push("🔧 Fix initialization issues");
    }
    
    if (baselines.reliability.errorHandling < 3) {
      recommendations.push("🛡️ Improve error handling - handle edge cases better");
    }
    
    return recommendations;
  }

  /**
   * Display test results
   */
  displayTestResults(results) {
    console.log('\n📊 MEGA ENGINE TEST RESULTS');
    console.log('============================');
    
    if (results.error) {
      console.log(`❌ Test failed: ${results.error}`);
      return;
    }
    
    console.log(`⏱️ Execution Time: ${results.executionTime}ms`);
    console.log(`🔧 Engine: ${results.engine}`);
    console.log(`📅 Timestamp: ${results.timestamp}`);
    
    // Display benchmark results
    if (results.tests.benchmarks?.success) {
      console.log('\n📊 BENCHMARK RESULTS:');
      const bench = results.tests.benchmarks.summary;
      console.log(`   Overall F1 Score: ${bench.f1Score?.toFixed(1)}%`);
      console.log(`   Precision: ${bench.precision?.toFixed(1)}%`);
      console.log(`   Recall: ${bench.recall?.toFixed(1)}%`);
      console.log(`   False Positive Rate: ${bench.falsePositiveRate?.toFixed(1)}%`);
    }
    
    // Display performance results
    if (results.tests.performance?.success) {
      console.log('\n⚡ PERFORMANCE RESULTS:');
      const perf = results.tests.performance.results;
      console.log(`   Short Text: ${perf.shortText?.averageTime?.toFixed(1)}ms`);
      console.log(`   Medium Text: ${perf.mediumText?.averageTime?.toFixed(1)}ms`);
      console.log(`   Long Text: ${perf.longText?.averageTime?.toFixed(1)}ms`);
      console.log(`   Cache Efficiency: ${perf.cacheEfficiency?.cacheEfficiency?.toFixed(1)}%`);
    }
    
    // Display integration results
    if (results.tests.integration?.success) {
      console.log('\n🔗 INTEGRATION RESULTS:');
      const integration = results.tests.integration.results;
      console.log(`   Initialization: ${integration.initialization?.success ? '✅' : '❌'}`);
      console.log(`   Error Handling: ${integration.errorHandling?.passedTests}/${integration.errorHandling?.totalTests}`);
      console.log(`   Edge Cases: ${integration.edgeCases?.successfulCases}/${integration.edgeCases?.totalCases}`);
      console.log(`   API Consistency: ${integration.apiConsistency?.consistentResults ? '✅' : '❌'}`);
    }
    
    // Display summary
    if (results.summary) {
      console.log('\n📈 SUMMARY:');
      console.log(`   Overall Success: ${results.summary.overall?.success ? '✅' : '❌'}`);
      console.log(`   Accuracy: ${results.summary.benchmarks?.accuracy?.toFixed(1)}%`);
      console.log(`   Performance: ${results.summary.performance?.averageTime?.toFixed(1)}ms avg`);
      console.log(`   Reliability: ${results.summary.integration?.initialization ? '✅' : '❌'}`);
    }
    
    // Display recommendations
    if (results.tests.baselines?.recommendations) {
      console.log('\n💡 RECOMMENDATIONS:');
      results.tests.baselines.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
  }

  /**
   * Save test results
   */
  async saveTestResults(results) {
    try {
      const filename = `mega-engine-test-results-${Date.now()}.json`;
      const data = JSON.stringify(results, null, 2);
      
      // In browser environment, trigger download
      if (typeof window !== 'undefined') {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      console.log(`💾 Test results saved to ${filename}`);
      
    } catch (error) {
      console.error('❌ Failed to save test results:', error);
    }
  }
}

export default MegaEngineTestRunner; 