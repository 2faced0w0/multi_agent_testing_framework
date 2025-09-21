import dotenv from 'dotenv';
import { AgentManager } from './AgentManager.js';
import { APIServer } from './api/server.js';

// Load environment variables
dotenv.config();

async function main() {
  console.log('Starting Multi-Agent Testing Framework...');

  // Validate required environment variables
  if (!process.env.MISTRAL_API_KEY) {
    console.error('ERROR: MISTRAL_API_KEY environment variable is required');
    process.exit(1);
  }

  try {
    // Start Agent Manager
    const agentManager = new AgentManager();
    await agentManager.startAllAgents();

    // Start API Server
    const apiServer = new APIServer(parseInt(process.env.PORT || '3000'));
    await apiServer.start();

    console.log('🚀 Multi-Agent Testing Framework is running!');
    console.log('📊 Dashboard: http://localhost:3000');
    console.log('🔧 API: http://localhost:3000/api/v1');
    console.log('❤️  Health: http://localhost:3000/health');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down gracefully...');
      await agentManager.stopAllAgents();
      await apiServer.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start application:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
main().catch(console.error);