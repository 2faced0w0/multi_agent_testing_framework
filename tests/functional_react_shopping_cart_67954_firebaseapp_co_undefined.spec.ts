import { test, expect } from '@playwright/test';

test('Add item to cart', async ({ page }) => {
  // Navigate to the website
  await page.goto('https://react-shopping-cart-67954.firebaseapp.com/');

  // Wait for the page to load and verify the title
  await expect(page).toHaveTitle(/Typescript React Shopping cart/);

  // Find the first product and click on it to add to cart
  const firstProduct = page.locator('.shelf-item').first();
  await firstProduct.locator('.shelf-item__buy-btn').click();

  // Verify the cart count has increased
  const cartCount = page.locator('.bag__quantity');
  await expect(cartCount).toHaveText('1');

  // Open the cart
  await page.locator('.bag').click();

  // Verify the cart is open and the product is in the cart
  const cart = page.locator('.float-cart');
  await expect(cart).toBeVisible();

  const cartItem = cart.locator('.shelf-item');
  await expect(cartItem).toHaveCount(1);

  // Verify the product details in the cart
  const productTitle = firstProduct.locator('.shelf-item__title').innerText();
  const cartItemTitle = cartItem.locator('.title').innerText();

  await expect(cartItemTitle).toBe(productTitle);

  // Close the cart
  await page.locator('.float-cart__close-btn').click();

  // Verify the cart is closed
  await expect(cart).not.toBeVisible();
});
