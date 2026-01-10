
import fs from 'fs';
import path from 'path';
import { calculateBlends, EngineMode } from '../lib/engine_core/go_calc_engine_strict';
// Import types
import type { Inventory, Intent, EngineOutput } from '../lib/engine_core/go_calc_engine_strict';

const TESTS_PATH = path.join(process.cwd(), 'lib/go_calc_tests.json');

interface TestCase {
    id: string;
    description: string;
    intent: Intent;
    inventory: Inventory;
    expectedBehavior: {
        shouldSucceed: boolean;
        topRecommendationContains?: string[];
        excludedCultivars?: string[];
        error?: string;
        // ... other expected fields
    }
}

interface TestFile {
    testCases: TestCase[];
}

function runTests() {
    console.log("-----------------------------------------");
    console.log("GO ENGINE STRICT VERIFICATION");
    console.log("-----------------------------------------");

    if (!fs.existsSync(TESTS_PATH)) {
        console.error("CRITICAL: Test file not found at", TESTS_PATH);
        process.exit(1);
    }

    const testData: TestFile = JSON.parse(fs.readFileSync(TESTS_PATH, 'utf-8'));
    let passed = 0;
    let failed = 0;

    for (const test of testData.testCases) {
        console.log(`\nRunning Test: ${test.id} - ${test.description}`);

        // Ensure availability matches test data (default to true if missing in JSON)
        test.inventory.cultivars.forEach(c => {
            if (c.available === undefined) c.available = true;
            // Default fidelity if missing in test data (Assume PACKAGE_LABEL to avoid PROD rejection)
            if (!c.dataFidelity) c.dataFidelity = "PACKAGE_LABEL";
        });

        // RUN IN PRODUCTION MODE FOR STRICT TESTING
        const mode: EngineMode = "PRODUCTION";

        const result = calculateBlends(test.inventory, test.intent, mode);

        let testPassed = true;
        const failures: string[] = [];

        // CHECK 1: Success/Failure status
        const succeeded = !result.error;
        if (succeeded !== test.expectedBehavior.shouldSucceed) {
            testPassed = false;
            failures.push(`Expected success=${test.expectedBehavior.shouldSucceed}, got success=${succeeded} (Error: ${result.error})`);
        }

        // CHECK 2: Top Recommendation Contents
        if (test.expectedBehavior.topRecommendationContains && succeeded) {
            const topRec = result.recommendations[0];
            if (!topRec) {
                testPassed = false;
                failures.push("Expected recommendations but got empty list");
            } else {
                const recIds = topRec.cultivars.map(c => c.id);
                for (const requiredId of test.expectedBehavior.topRecommendationContains) {
                    if (!recIds.includes(requiredId)) {
                        testPassed = false;
                        failures.push(`Top blend missing required cultivar: ${requiredId}. Got: ${recIds.join(', ')}`);
                    }
                }
            }
        }

        // CHECK 3: Excluded Cultivars
        if (test.expectedBehavior.excludedCultivars && succeeded) {
            // Check all recommendations
            for (const rec of result.recommendations) {
                const recIds = rec.cultivars.map(c => c.id);
                for (const excludedId of test.expectedBehavior.excludedCultivars) {
                    if (recIds.includes(excludedId)) {
                        testPassed = false;
                        failures.push(`Blend included forbidden cultivar: ${excludedId}`);
                    }
                }
            }
        }

        // CHECK 4: Error Message Content
        if (test.expectedBehavior.error && !succeeded) {
            if (result.error !== test.expectedBehavior.error) {
                testPassed = false;
                failures.push(`Expected error '${test.expectedBehavior.error}', got '${result.error}'`);
            }
        }

        if (testPassed) {
            console.log("✅ PASS");
            passed++;
        } else {
            console.error("❌ FAIL");
            failures.forEach(f => console.error(`   - ${f}`));
            failed++;
        }
    }

    console.log("\n-----------------------------------------");
    console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);

    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests();
