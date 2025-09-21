const axios = require('axios');
const Redis = require('ioredis');

const API_BASE = 'http://localhost:3000/api/v1';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

async function monitorSystem() {
    console.log('📊 System Monitoring Dashboard');
    console.log('================================\n');
  
    try {
        // System Status
        const healthResponse = await axios.get(`${API_BASE}/system/status`);
        console.log('🏥 System Health:');
        console.log(`   Status: ${healthResponse.data.status}`);
        console.log(`   Redis: ${healthResponse.data.redis}`);
        console.log(`   Database: ${healthResponse.data.database}`);
        console.log(`   Test Cases: ${healthResponse.data.testCases}`);
        console.log('');
      
        // Redis Queue Status
        console.log('📬 Message Queue Status:');
        const queueTypes = ['test_writer', 'test_executor', 'report_generator', 'test_optimizer', 'context_manager', 'logger'];
      
        for (const queueType of queueTypes) {
            const queueLength = await redis.llen(`queue:${queueType}`);
            console.log(`   ${queueType}: ${queueLength} messages`);
        }
        console.log('');
      
        // Test Cases Overview
        const testCasesResponse = await axios.get(`${API_BASE}/tests/cases`);
        const testCases = testCasesResponse.data;
      
        console.log('📋 Test Cases Overview:');
        console.log(`   Total: ${testCases.length}`);
      
        const typeCount = testCases.reduce((acc, test) => {
            acc[test.type] = (acc[test.type] || 0) + 1;
            return acc;
        }, {});
      
        Object.entries(typeCount).forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
        });
        console.log('');
      
        // Recent Activity
        console.log('🕒 Recent Test Cases:');
        const recentTests = testCases.slice(0, 5);
        recentTests.forEach((test, index) => {
            console.log(`   ${index + 1}. ${test.name} (${test.type})`);
            console.log(`      Created: ${new Date(test.created_at).toLocaleString()}`);
        });
      
        if (recentTests.length === 0) {
            console.log('   No test cases found');
        }
      
        console.log('\n✅ Monitoring complete');
      
    } catch (error) {
        console.error('❌ Monitoring failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    } finally {
        await redis.disconnect();
    }
}

// Run monitoring
monitorSystem();
