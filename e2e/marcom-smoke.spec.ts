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
    const addPlacementBtn = page.locator('button', { hasText: 'Add Placement' }).first();
    await expect(addPlacementBtn).toBeVisible({ timeout: 25000 });
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

  test('should navigate to Pipeline 360°, verify responsive desktop/mobile viewports, and open Outlet 360° drawer', async ({ page }) => {
    // 1. Switch to Pipeline 360° view
    const pipelineNav = page.locator('button', { hasText: 'Pipeline 360°' }).first();
    await expect(pipelineNav).toBeVisible({ timeout: 15000 });
    await pipelineNav.click();

    // Verify Pipeline View header and badge are rendered
    const heading = page.locator('h1', { hasText: 'Pipeline Operasional Outlet' });
    await expect(heading).toBeVisible({ timeout: 20000 });
    await expect(page.locator('span', { hasText: 'Cockpit 360°' }).first()).toBeVisible();

    // 2. Set desktop viewport (1280x800) and verify Desktop Matrix Table is visible
    await page.setViewportSize({ width: 1280, height: 800 });
    const desktopTable = page.locator('.hidden.md\\:block table');
    const mobileCards = page.locator('.block.md\\:hidden');

    await expect(desktopTable).toBeVisible({ timeout: 15000 });
    await expect(mobileCards).not.toBeVisible();

    // Verify matrix table column headers
    await expect(desktopTable.locator('th', { hasText: 'Outlet & Lokasi' })).toBeVisible();
    await expect(desktopTable.locator('th', { hasText: '1. Legal MoU' })).toBeVisible();
    await expect(desktopTable.locator('th', { hasText: '2. POSM Placements' })).toBeVisible();
    await expect(desktopTable.locator('th', { hasText: '3. Field Events' })).toBeVisible();
    await expect(desktopTable.locator('th', { hasText: '4. Konten Media' })).toBeVisible();

    // 3. Resize to mobile viewport (375x667) and verify Cockpit Card list is visible while desktop table is hidden
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(desktopTable).not.toBeVisible();
    await expect(mobileCards).toBeVisible({ timeout: 10000 });

    // 4. Return to desktop viewport (1280x800) and click an outlet row to trigger Outlet 360° Drawer
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(desktopTable).toBeVisible({ timeout: 10000 });

    // Wait for at least one outlet row to appear and click it
    const firstRow = desktopTable.locator('tbody tr').first();
    await expect(firstRow).toBeVisible({ timeout: 15000 });
    await firstRow.click();

    // Verify Outlet360Drawer is open with all tabs
    const drawer = page.locator('.fixed.inset-y-0.right-0');
    await expect(drawer).toBeVisible({ timeout: 15000 });

    const tabStrip = drawer.locator('div.border-b.overflow-x-auto');
    const overviewTab = tabStrip.locator('button', { hasText: 'Overview' });
    const placementsTab = tabStrip.locator('button', { hasText: /Placements/i });
    const mousTab = tabStrip.locator('button', { hasText: /MoUs/i });
    const eventsTab = tabStrip.locator('button', { hasText: /Field Events/i });
    const contentTab = tabStrip.locator('button', { hasText: /Konten Media/i });

    await expect(overviewTab).toBeVisible({ timeout: 10000 });
    await expect(placementsTab).toBeVisible();
    await expect(mousTab).toBeVisible();
    await expect(eventsTab).toBeVisible();
    await expect(contentTab).toBeVisible();

    // Switch to Events tab and Content tab
    await eventsTab.click();
    await expect(eventsTab).toHaveClass(/border-lime-600/);

    await contentTab.click();
    await expect(contentTab).toHaveClass(/border-lime-600/);

    // Close the drawer
    const closeBtn = drawer.locator('button:has(svg.lucide-x)');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify drawer is closed
    await expect(drawer).not.toBeVisible();
  });
});
