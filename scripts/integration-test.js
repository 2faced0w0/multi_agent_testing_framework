const axios = require('axios');
const { v4: uuid } = require('uuid');

const API_BASE = 'http://localhost:3000/api/v1';

async function runIntegrationTest() {
    console.log('🧪 Starting Integration Test...\n');
  
    try {
        // Test 1: System Health Check
        console.log('1. Testing system health...');
        const healthResponse = await axios.get(`${API_BASE}/system/status`);
        console.log('✅ System Status:', healthResponse.data.status);
        console.log('   Redis:', healthResponse.data.redis);
        console.log('   Database:', healthResponse.data.database);
        console.log('   Test Cases:', healthResponse.data.testCases);
      
        // Test 2: Generate a test
        console.log('\n2. Testing test generation...');
        const generateResponse = await axios.post(`${API_BASE}/tests/generate`, {
            url: 'https://example.com',
            testType: 'functional',
            description: 'Integration test - basic functionality check'
        });
        console.log('✅ Test Generation:', generateResponse.data.message);
        console.log('   Message ID:', generateResponse.data.messageId);
      
        // Wait for test generation to complete
        console.log('\n3. Waiting for test generation to complete...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      
        // Test 3: List test cases
        console.log('\n4. Testing test case retrieval...');
        const testCasesResponse = await axios.get(`${API_BASE}/tests/cases`);
        console.log('✅ Test Cases Retrieved:', testCasesResponse.data.length);
      
        if (testCasesResponse.data.length > 0) {
            const latestTest = testCasesResponse.data[0];
            console.log('   Latest Test:', latestTest.name);
            console.log('   Test Type:', latestTest.type);
            console.log('   Target URL:', latestTest.target_url);
          
            // Test 4: Execute the test
            console.log('\n5. Testing test execution...');
            const executeResponse = await axios.post(`${API_BASE}/tests/execute`, {
                testCaseId: latestTest.id
            });
            console.log('✅ Test Execution:', executeResponse.data.message);
            console.log('   Message ID:', executeResponse.data.messageId);
        }
      
        console.log('\n🎉 Integration test completed successfully!');
      
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
runIntegrationTest();
