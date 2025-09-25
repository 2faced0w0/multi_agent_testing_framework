import fs from 'fs';
import path from 'path';

/**
 * CodeWatcher validates and corrects Playwright test code before saving.
 * Usage: Call validateAndFixTestCode(code: string): string
 */
export class CodeWatcher {
  // Validate Playwright test code using regex and basic heuristics
  static validateAndFixTestCode(code: string): string {
    let fixedCode = code;
    // Ensure import statement exists
    if (!/import\s+\{\s*test,\s*expect\s*\}\s+from\s+'@playwright\/test';/.test(fixedCode)) {
      fixedCode = `import { test, expect } from '@playwright/test';\n` + fixedCode;
    }
    // Ensure at least one test() block exists
    if (!/test\s*\(/.test(fixedCode)) {
      // Try to wrap code in a test block
      fixedCode += `\n\ntest('auto generated', async ({ page }) => {\n  // TODO: Insert steps here\n});\n`;
    }
    // Fix common syntax errors (unclosed braces, missing async, etc.)
    // Add more regex-based fixes as needed
    // Example: Ensure all test blocks are async
    fixedCode = fixedCode.replace(/test\s*\(([^)]*)\)\s*=>\s*{/, "test($1, async ({ page }) => {");
    // Remove export statements if present
    fixedCode = fixedCode.replace(/export\s+(default|async\s+function\s+run)[^{]*{[\s\S]*?}/g, '');
    // Ensure file ends with a newline
    if (!fixedCode.endsWith('\n')) fixedCode += '\n';
    return fixedCode;
  }

  // Validate a file by path
  static validateFile(filePath: string): void {
    if (!fs.existsSync(filePath)) return;
    const code = fs.readFileSync(filePath, 'utf-8');
    const fixed = CodeWatcher.validateAndFixTestCode(code);
    fs.writeFileSync(filePath, fixed, 'utf-8');
  }
}

// Example usage (uncomment for manual test):
// const code = fs.readFileSync('path/to/generated_test.ts', 'utf-8');
// const fixed = CodeWatcher.validateAndFixTestCode(code);
// fs.writeFileSync('path/to/generated_test.ts', fixed, 'utf-8');
