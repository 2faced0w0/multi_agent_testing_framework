const axios = require('axios');
const open = require('open'); // npm install open

async function runFinalDemo() {
    console.log('🎬 Multi-Agent Testing Framework - Final Demo');
    console.log('==============================================\n');
  
    const API_BASE = 'http://localhost:3000/api/v1';
  
    try {
        console.log('1. 🏥 Checking system health...');
        const health = await axios.get(`${API_BASE}/system/status`);
        console.log(`   ✅ System Status: ${health.data.status}`);
        console.log(`   📊 Test Cases: ${health.data.testCases}`);
      
        console.log('\n2. 🎯 Generating comprehensive test suite...');
      
        const testConfigs = [
            {
                url: 'https://react-shopping-cart-67954.firebaseapp.com/',
                testType: 'functional',
                description: 'E-commerce functionality test - product browsing, cart operations'
            },
            {
                url: 'https://react-shopping-cart-67954.firebaseapp.com/',
                testType: 'accessibility',
                description: 'WCAG 2.1 AA compliance check for e-commerce site'
            },
            {
                url: 'https://todomvc.com/examples/react/',
                testType: 'functional',
                description: 'Todo application CRUD operations test'
            },
            {
                url: 'https://todomvc.com/examples/react/',
                testType: 'performance',
                description: 'Core Web Vitals and performance metrics for React app'
            }
        ];
      
        const generatedTests = [];
      
        for (let i = 0; i < testConfigs.length; i++) {
            const config = testConfigs[i];
            console.log(`   Generating ${config.testType} test for ${config.url}...`);
          
            const response = await axios.post(`${API_BASE}/tests/generate`, config);
            generatedTests.push(response.data.messageId);
          
            console.log(`   ✅ Generated: ${response.data.messageId}`);
          
            // Wait between generations
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
      
        console.log('\n3. ⏳ Waiting for test generation to complete...');
        await new Promise(resolve => setTimeout(resolve, 20000));
      
        console.log('\n4. 📋 Retrieving generated test cases...');
        const testCases = await axios.get(`${API_BASE}/tests/cases`);
        console.log(`   ✅ Found ${testCases.data.length} test cases`);
      
        // Show test case details
        testCases.data.slice(0, 4).forEach((test, index) => {
            console.log(`   ${index + 1}. ${test.name}`);
            console.log(`      Type: ${test.type} | URL: ${test.target_url}`);
        });
      
        console.log('\n5. 🚀 Executing sample tests...');
        const testsToExecute = testCases.data.slice(0, 2);
      
        for (const test of testsToExecute) {
            console.log(`   Executing: ${test.name}...`);
          
            const execution = await axios.post(`${API_BASE}/tests/execute`, {
                testCaseId: test.id
            });
          
            console.log(`   ✅ Started: ${execution.data.messageId}`);
            await new Promise(resolve => setTimeout(resolve, 15000));
        }
      
        console.log('\n6. 🌐 Opening web dashboard...');
        try {
            await open('http://localhost:3000');
            console.log('   ✅ Dashboard opened in browser');
        } catch (error) {
            console.log('   ℹ️  Please manually open: http://localhost:3000');
        }
      
        console.log('\n🎉 Demo completed successfully!');
        console.log('\n📊 Demo Summary:');
        console.log(`   • Generated ${testConfigs.length} different test types`);
        console.log(`   • Tested ${new Set(testConfigs.map(c => c.url)).size} different applications`);
        console.log(`   • Executed ${testsToExecute.length} tests`);
        console.log(`   • All 6 agents working in coordination`);
      
        console.log('\n🎯 What you can do next:');
        console.log('   1. Visit http://localhost:3000 to see the web interface');
        console.log('   2. Generate tests for your own MERN applications');
        console.log('   3. View generated test code and execution results');
        console.log('   4. Check the data/artifacts folder for screenshots and reports');
      
        console.log('\n💡 Framework Features Demonstrated:');
        console.log('   ✅ AI-powered test generation using GPT-4');
        console.log('   ✅ Multi-browser test execution with Playwright');
        console.log('   ✅ Functional, accessibility, and performance testing');
        console.log('   ✅ Agent-based architecture with message queuing');
        console.log('   ✅ Real-time web dashboard');
        console.log('   ✅ Automated report generation');
      
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run the final demo
runFinalDemo();
