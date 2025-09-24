import { DatabaseManager } from '../dist/database/DatabaseManager.js';
import { v4 as uuid } from 'uuid';

async function setupDemo() {
    console.log('Setting up demo data...');
  
    const db = new DatabaseManager('./data/sqlite/framework.db');
  
    // Sample test case
    const sampleTest = {
        id: uuid(),
        name: 'Sample React App Test',
        description: 'Basic functionality test for a React shopping cart',
        type: 'functional',
        targetUrl: 'https://react-shopping-cart-67954.firebaseapp.com/',
        playwrightCode: `
import { test, expect } from '@playwright/test';

test('React Shopping Cart - Basic Functionality', async ({ page }) => {
  // Navigate to the application
  await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Check if the page title is correct
  await expect(page).toHaveTitle(/React Shopping Cart/);

  // Check if products are displayed
  const products = page.locator('.product');
  await expect(products.first()).toBeVisible();

  // Try to add a product to cart (if available)
  const addToCartButton = page.locator('button:has-text("Add to cart")').first();
  if (await addToCartButton.isVisible()) {
    await addToCartButton.click();
  
    // Check if cart counter increased
    const cartCounter = page.locator('.cart-counter');
    await expect(cartCounter).toBeVisible();
  }

  console.log('Test completed successfully');
});
        `.trim()
    };
  
    try {
        db.createTestCase(sampleTest);
        console.log('Demo test case created successfully!');
        console.log('Test ID:', sampleTest.id);
    } catch (error) {
        console.error('Error creating demo test case:', error);
    } finally {
        db.close();
    }
}

setupDemo().catch(console.error);
