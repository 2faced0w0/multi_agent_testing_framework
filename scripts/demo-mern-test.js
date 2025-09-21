const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// List of popular MERN stack demo applications
const DEMO_APPS = [
    {
        name: 'React Shopping Cart',
        url: 'https://react-shopping-cart-67954.firebaseapp.com/',
        description: 'E-commerce shopping cart built with React'
    },
    {
        name: 'React Todo App',
        url: 'https://todomvc.com/examples/react/',
        description: 'Classic TodoMVC application built with React'
    },
    {
        name: 'React Calculator',
        url: 'https://ahfarmer.github.io/calculator/',
        description: 'Calculator application built with React'
    }
];

async function runMERNDemo() {
    console.log('🚀 Starting MERN Stack Testing Demo...\n');
  
    try {
        // Check system status first
        console.log('Checking system status...');
        const healthResponse = await axios.get(`${API_BASE}/system/status`);
      
        if (healthResponse.data.status !== 'operational') {
            throw new Error('System is not operational');
        }
      
        console.log('✅ System is operational\n');
      
        // Generate tests for each demo app
        for (let i = 0; i < DEMO_APPS.length; i++) {
            const app = DEMO_APPS[i];
            console.log(`${i + 1}. Testing ${app.name}...`);
            console.log(`   URL: ${app.url}`);
            console.log(`   Description: ${app.description}`);
          
            // Generate functional test
            const functionalTest = await axios.post(`${API_BASE}/tests/generate`, {
                url: app.url,
                testType: 'functional',
                description: `Functional test for ${app.name} - ${app.description}`
            });
          
            console.log(`   ✅ Functional test generated: ${functionalTest.data.messageId}`);
          
            // Generate accessibility test
            const accessibilityTest = await axios.post(`${API_BASE}/tests/generate`, {
                url: app.url,
                testType: 'accessibility',
                description: `Accessibility test for ${app.name} - WCAG compliance check`
            });
          
            console.log(`   ✅ Accessibility test generated: ${accessibilityTest.data.messageId}`);
          
            // Generate performance test
            const performanceTest = await axios.post(`${API_BASE}/tests/generate`, {
                url: app.url,
                testType: 'performance',
                description: `Performance test for ${app.name} - Core Web Vitals check`
            });
          
            console.log(`   ✅ Performance test generated: ${performanceTest.data.messageId}`);
            console.log('');
          
            // Wait between apps to avoid overwhelming the system
            if (i < DEMO_APPS.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
      
        console.log('⏳ Waiting for test generation to complete...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      
        // List all generated tests
        console.log('\n📋 Generated Test Cases:');
        const testCasesResponse = await axios.get(`${API_BASE}/tests/cases`);
        const testCases = testCasesResponse.data;
      
        testCases.forEach((testCase, index) => {
            console.log(`${index + 1}. ${testCase.name}`);
            console.log(`   Type: ${testCase.type}`);
            console.log(`   URL: ${testCase.target_url}`);
            console.log(`   Created: ${new Date(testCase.created_at).toLocaleString()}`);
            console.log('');
        });
      
        // Execute a few tests
        console.log('🏃 Executing sample tests...');
        const testsToExecute = testCases.slice(0, 3); // Execute first 3 tests
      
        for (const testCase of testsToExecute) {
            console.log(`Executing: ${testCase.name}`);
          
            const executeResponse = await axios.post(`${API_BASE}/tests/execute`, {
                testCaseId: testCase.id
            });
          
            console.log(`✅ Execution started: ${executeResponse.data.messageId}`);
          
            // Wait between executions
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
      
        console.log('\n🎉 MERN Stack Testing Demo completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - ${DEMO_APPS.length} applications tested`);
        console.log(`   - ${testCases.length} test cases generated`);
        console.log(`   - ${testsToExecute.length} tests executed`);
        console.log('\n💡 Check the web UI at http://localhost:3000 to see all results!');
      
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the demo
runMERNDemo();
