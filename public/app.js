// Global state
let systemOnline = false;
let testCases = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkSystemStatus();
    loadTestCases();
    setupEventListeners();
});

function setupEventListeners() {
    // Generate test form
    document.getElementById('generateTestForm').addEventListener('submit', handleGenerateTest);

    // Refresh Status button
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', checkSystemStatus);
    }

    // Refresh Test Cases button
    const refreshTestCasesBtn = document.getElementById('refreshTestCasesBtn');
    if (refreshTestCasesBtn) {
        refreshTestCasesBtn.addEventListener('click', loadTestCases);
    }

    // Run Demo button
    const runDemoBtn = document.getElementById('runDemoBtn');
    if (runDemoBtn) {
        runDemoBtn.addEventListener('click', runDemo);
    }
}

async function checkSystemStatus() {
    const statusIndicator = document.getElementById('systemStatus');
    const statusText = document.getElementById('systemStatusText');
  
    try {
        const response = await fetch('/api/v1/system/status');
        const data = await response.json();
      
        if (response.ok && data.status === 'operational') {
            systemOnline = true;
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = `System Online - ${data.testCases} test cases available`;
        } else {
            throw new Error('System not operational');
        }
    } catch (error) {
        systemOnline = false;
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'System Offline - Please check the server';
        console.error('System status check failed:', error);
    }
}

async function handleGenerateTest(event) {
    event.preventDefault();
  
    if (!systemOnline) {
        showStatus('generateStatus', 'error', 'System is offline. Please check the server.');
        return;
    }

    const formData = new FormData(event.target);
    const data = {
        url: formData.get('url'),
        testType: formData.get('testType'),
        description: formData.get('description')
    };

    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;
  
    try {
        // Show loading state
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="loading"></span>Generating...';
      
        showStatus('generateStatus', 'info', 'Sending test generation request...');

        const response = await fetch('/api/v1/tests/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus('generateStatus', 'success', 
                `Test generation started! Message ID: ${result.messageId}`);
          
            // Reset form
            event.target.reset();
          
            // Refresh test cases after a delay
            setTimeout(() => {
                loadTestCases();
            }, 3000);
        } else {
            throw new Error(result.error || 'Failed to generate test');
        }

    } catch (error) {
        showStatus('generateStatus', 'error', `Error: ${error.message}`);
        console.error('Test generation failed:', error);
    } finally {
        // Reset button
        generateBtn.disabled = false;
        generateBtn.textContent = originalText;
    }
}

async function loadTestCases() {
    const testCasesList = document.getElementById('testCasesList');
  
    try {
        testCasesList.innerHTML = '<p>Loading test cases...</p>';
      
        const response = await fetch('/api/v1/tests/cases');
        const data = await response.json();

        if (response.ok) {
            testCases = data;
            renderTestCases(data);
        } else {
            throw new Error('Failed to load test cases');
        }

    } catch (error) {
        testCasesList.innerHTML = `<p style="color: #e74c3c;">Error loading test cases: ${error.message}</p>`;
        console.error('Failed to load test cases:', error);
    }
}

function renderTestCases(cases) {
    const testCasesList = document.getElementById('testCasesList');
  
    if (cases.length === 0) {
        testCasesList.innerHTML = '<p>No test cases found. Generate your first test above!</p>';
        return;
    }

    testCasesList.innerHTML = '';
    cases.forEach(testCase => {
        const item = document.createElement('div');
        item.className = 'test-item';
        item.innerHTML = `
            <h4>${testCase.name}</h4>
            <p>${testCase.description || 'No description provided'}</p>
            <div class="meta">
                <strong>Type:</strong> ${testCase.type} | 
                <strong>URL:</strong> ${testCase.target_url} | 
                <strong>Created:</strong> ${new Date(testCase.created_at).toLocaleString()}
            </div>
        `;
        const btnContainer = document.createElement('div');
        btnContainer.style.marginTop = '10px';

        const execBtn = document.createElement('button');
        execBtn.className = 'btn';
        execBtn.textContent = 'Execute Test';
        execBtn.style.marginRight = '10px';
        execBtn.addEventListener('click', () => executeTest(testCase.id));

        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn';
        viewBtn.textContent = 'View Code';
        viewBtn.addEventListener('click', () => viewTestCode(testCase.id));

        btnContainer.appendChild(execBtn);
        btnContainer.appendChild(viewBtn);
        item.appendChild(btnContainer);
        testCasesList.appendChild(item);
    });
}

async function executeTest(testCaseId) {
    if (!systemOnline) {
        alert('System is offline. Please check the server.');
        return;
    }

    try {
        showStatus('generateStatus', 'info', 'Starting test execution...');

        const response = await fetch('/api/v1/tests/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ testCaseId })
        });

        const result = await response.json();

        if (response.ok) {
            showStatus('generateStatus', 'success', 
                `Test execution started! Message ID: ${result.messageId}`);
        } else {
            throw new Error(result.error || 'Failed to execute test');
        }

    } catch (error) {
        showStatus('generateStatus', 'error', `Error: ${error.message}`);
        console.error('Test execution failed:', error);
    }
}

async function viewTestCode(testCaseId) {
    try {
        const response = await fetch(`/api/v1/tests/cases/${testCaseId}`);
        const testCase = await response.json();

        if (response.ok) {
            // Create a modal to show the code
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 80%; max-height: 80%; overflow: auto;">
                    <h3>${testCase.name}</h3>
                    <p><strong>URL:</strong> ${testCase.target_url}</p>
                    <p><strong>Type:</strong> ${testCase.type}</p>
                    <h4 style="margin-top: 20px;">Generated Code:</h4>
                    <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto; font-size: 12px;">${testCase.playwright_code}</pre>
                    <button class="btn" onclick="this.parentElement.parentElement.remove()" style="margin-top: 20px;">Close</button>
                </div>
            `;

            document.body.appendChild(modal);
        } else {
            throw new Error('Failed to load test case');
        }

    } catch (error) {
        alert(`Error loading test case: ${error.message}`);
        console.error('Failed to load test case:', error);
    }
}

async function runDemo() {
    if (!systemOnline) {
        showStatus('demoStatus', 'error', 'System is offline. Please check the server.');
        return;
    }

    try {
        showStatus('demoStatus', 'info', 'Starting demo test...');

        // Generate a test for a sample MERN app
        const demoData = {
            url: 'https://react-shopping-cart-67954.firebaseapp.com/',
            testType: 'functional',
            description: 'Demo test for a React shopping cart application'
        };

        const response = await fetch('/api/v1/tests/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(demoData)
        });

        const result = await response.json();

        if (response.ok) {
            showStatus('demoStatus', 'success', 
                `Demo test generation started! The system will automatically generate and execute a test for a sample React shopping cart application.`);
          
            // Refresh test cases after a delay
            setTimeout(() => {
                loadTestCases();
            }, 5000);
        } else {
            throw new Error(result.error || 'Failed to start demo');
        }

    } catch (error) {
        showStatus('demoStatus', 'error', `Demo failed: ${error.message}`);
        console.error('Demo failed:', error);
    }
}

function showStatus(elementId, type, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="status ${type}">${message}</div>`;
  
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            element.innerHTML = '';
        }, 5000);
    }
}

// Utility function to format dates
function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

// Auto-refresh system status every 30 seconds
setInterval(checkSystemStatus, 30000);
