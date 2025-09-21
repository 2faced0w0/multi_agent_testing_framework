const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function validateSetup() {
    console.log('🔍 Validating Multi-Agent Testing Framework Setup...\n');
  
    const checks = [
        {
            name: 'Node.js Version',
            check: () => {
                const version = process.version;
                const major = parseInt(version.slice(1).split('.')[0]);
                return major >= 18;
            },
            fix: 'Install Node.js 18 or higher'
        },
        {
            name: 'Environment Variables',
            check: () => {
                return process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.length > 0;
            },
            fix: 'Set MISTRAL_API_KEY in your .env file'
        },
        {
            name: 'Redis Connection',
            check: async () => {
                try {
                    const Redis = require('ioredis');
                    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
                    const result = await redis.ping();
                    await redis.disconnect();
                    return result === 'PONG';
                } catch (error) {
                    return false;
                }
            },
            fix: 'Start Redis server or check Redis connection'
        },
        {
            name: 'Project Structure',
            check: () => {
                const requiredDirs = [
                    'src/agents',
                    'src/api',
                    'src/database',
                    'data/sqlite',
                    'data/artifacts',
                    'public'
                ];
              
                return requiredDirs.every(dir => fs.existsSync(path.join(process.cwd(), dir)));
            },
            fix: 'Run the setup script to create required directories'
        },
        {
            name: 'Dependencies',
            check: () => {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const requiredDeps = [
                    'express', 'redis', 'better-sqlite3', 'openai', 'playwright'
                ];
              
                return requiredDeps.every(dep => 
                    (packageJson.dependencies && packageJson.dependencies[dep]) || 
                    (packageJson.devDependencies && packageJson.devDependencies[dep])
                );
            },
            fix: 'Run npm install to install required dependencies'
        },
        {
            name: 'TypeScript Build',
            check: () => {
                try {
                    execSync('npm run build', { stdio: 'pipe' });
                    return fs.existsSync('dist/index.js');
                } catch (error) {
                    return false;
                }
            },
            fix: 'Fix TypeScript compilation errors and run npm run build'
        },
        {
            name: 'Playwright Browsers',
            check: () => {
                try {
                    execSync('npx playwright --version', { stdio: 'pipe' });
                    return true;
                } catch (error) {
                    return false;
                }
            },
            fix: 'Run npx playwright install to install browsers'
        }
    ];
  
    let allPassed = true;
  
    for (const check of checks) {
        process.stdout.write(`Checking ${check.name}... `);
      
        try {
            const result = check.check.constructor.name === 'AsyncFunction' ? await check.check() : check.check();
            if (result) {
                console.log('✅ PASS');
            } else {
                console.log('❌ FAIL');
                console.log(`   Fix: ${check.fix}`);
                allPassed = false;
            }
        } catch (error) {
            console.log('❌ ERROR');
            console.log(`   Error: ${error.message}`);
            console.log(`   Fix: ${check.fix}`);
            allPassed = false;
        }
    }
  
    console.log('\n' + '='.repeat(50));
  
    if (allPassed) {
        console.log('🎉 All checks passed! Your setup is ready.');
        console.log('\nNext steps:');
        console.log('1. Run: npm start');
        console.log('2. Open: http://localhost:3000');
        console.log('3. Generate and execute your first test!');
    } else {
        console.log('❌ Some checks failed. Please fix the issues above.');
        process.exit(1);
    }
}

// Run validation
validateSetup().catch(console.error);
