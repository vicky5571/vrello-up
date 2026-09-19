import { test, expect } from '@playwright/test';

test.describe('Vrello Up Core Workspace Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root workspace
    await page.goto('/');
  });

  test('should render workspace shell and navigation bar', async ({ page }) => {
    // Verify view switcher buttons are visible
    const listTab = page.locator('button', { hasText: 'List' });
    const kanbanTab = page.locator('button', { hasText: 'Kanban' });
    const tableTab = page.locator('button', { hasText: 'Table' });

    await expect(listTab).toBeVisible();
    await expect(kanbanTab).toBeVisible();
    await expect(tableTab).toBeVisible();
  });

  test('should seamlessly switch between List, Kanban, and Table views', async ({ page }) => {
    // 1. Switch to Kanban (Board) View
    const kanbanTab = page.locator('button', { hasText: 'Kanban' });
    await kanbanTab.click({ force: true });

    // Verify Kanban column add buttons exist
    const addColumnTaskBtn = page.locator('button[title="Add task to column"]').first();
    await expect(addColumnTaskBtn).toBeVisible({ timeout: 20000 });

    // 2. Switch to Table View
    const tableTab = page.locator('button', { hasText: 'Table' });
    await tableTab.click({ force: true });

    // Table view should render
    await expect(tableTab).toHaveClass(/bg-slate-100|dark:bg-slate-800/);

    // 3. Switch back to List View
    const listTab = page.locator('button', { hasText: 'List' });
    await listTab.click({ force: true });
    await expect(listTab).toHaveClass(/bg-slate-100|dark:bg-slate-800/);
  });

  test('should create a new task in Kanban column and display it', async ({ page }) => {
    // Switch to Kanban View
    await page.locator('button', { hasText: 'Kanban' }).click({ force: true });

    // Find the first column's quick add button
    const addColumnTaskBtn = page.locator('button[title="Add task to column"]').first();
    await expect(addColumnTaskBtn).toBeVisible({ timeout: 10000 });
    await addColumnTaskBtn.click();

    // Input title for quick add
    const taskTitle = `E2E Smoke Task - ${Date.now()}`;
    const titleInput = page.locator('input[placeholder="What needs to be done?"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(taskTitle);

    // Click Save
    const saveButton = page.locator('button', { hasText: 'Save' });
    await saveButton.click();

    // Verify task card appears on the board
    const createdTask = page.locator('div', { hasText: taskTitle }).first();
    await expect(createdTask).toBeVisible({ timeout: 10000 });
  });
});

