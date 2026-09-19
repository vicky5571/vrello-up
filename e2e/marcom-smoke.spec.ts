import { test, expect } from '@playwright/test';

test.describe('Vrello Up Marcom Hub Modal Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root workspace
    await page.goto('/');

    // Switch to Marcom Hub mode via sidebar
    const marcomHubBtn = page.locator('button', { hasText: 'Marcom Hub' });
    await expect(marcomHubBtn).toBeVisible({ timeout: 15000 });
    await marcomHubBtn.click();
  });

  test('should open, inspect, and close Placement Modal cleanly', async ({ page }) => {
    // Navigate to Placements View
    const placementsNav = page.locator('button', { hasText: 'Placements' });
    await expect(placementsNav).toBeVisible({ timeout: 10000 });
    await placementsNav.click();

    // Click Add Placement button
    const addPlacementBtn = page.locator('button', { hasText: 'Add Placement' });
    await expect(addPlacementBtn).toBeVisible({ timeout: 10000 });
    await addPlacementBtn.click();

    // Verify modal header is rendered
    const modalHeading = page.locator('h2', { hasText: 'Add New Placement' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });

    // Verify essential form controls are present and interactive
    const brandIM3Btn = page.locator('button', { hasText: 'IM3' }).first();
    const brand3Btn = page.locator('button', { hasText: '3' }).first();
    const notesTextarea = page.locator('textarea[placeholder*="installation requirements"]');
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });

    await expect(brandIM3Btn).toBeVisible();
    await expect(brand3Btn).toBeVisible();
    await expect(notesTextarea).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // Close the modal via Cancel button
    await cancelButton.click();

    // Verify modal is dismissed
    await expect(modalHeading).not.toBeVisible();
  });

  test('should open, inspect, and close Event Form Modal cleanly', async ({ page }) => {
    // Navigate to Field Events View
    const eventsNav = page.locator('button', { hasText: 'Field Events' });
    await expect(eventsNav).toBeVisible({ timeout: 10000 });
    await eventsNav.click();

    // Click New Field Event button
    const newEventBtn = page.locator('button', { hasText: 'New Field Event' });
    await expect(newEventBtn).toBeVisible({ timeout: 10000 });
    await newEventBtn.click();

    // Verify modal header is rendered
    const modalHeading = page.locator('h2', { hasText: 'Create New Field Event' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });

    // Verify event title input and form controls
    const titleInput = page.locator('input[placeholder*="Summer Mall Roadshow"]');
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });

    await expect(titleInput).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // Type a title to ensure input is responsive
    await titleInput.fill('Smoke Test Field Event Activation');
    await expect(titleInput).toHaveValue('Smoke Test Field Event Activation');

    // Close the modal via Cancel button
    await cancelButton.click();

    // Verify modal is dismissed
    await expect(modalHeading).not.toBeVisible();
  });

  test('should open, inspect, and close Content Planner Modal cleanly', async ({ page }) => {
    // Navigate to Content Planner View
    const plannerNav = page.locator('button', { hasText: 'Content Planner' });
    await expect(plannerNav).toBeVisible({ timeout: 10000 });
    await plannerNav.click();

    // Click Schedule Post button
    const schedulePostBtn = page.locator('button', { hasText: 'Schedule Post' }).first();
    await expect(schedulePostBtn).toBeVisible({ timeout: 10000 });
    await schedulePostBtn.click();

    // Verify modal header is rendered
    const modalHeading = page.locator('h2', { hasText: 'Schedule New Post' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });

    // Verify concept input and form controls
    const conceptInput = page.locator('input[placeholder*="Behind-the-Scenes"]');
    const cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });

    await expect(conceptInput).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // Type into concept input to test responsiveness
    await conceptInput.fill('Smoke Test BTS Post');
    await expect(conceptInput).toHaveValue('Smoke Test BTS Post');

    // Close the modal via Cancel button
    await cancelButton.click();

    // Verify modal is dismissed
    await expect(modalHeading).not.toBeVisible();
  });
});
