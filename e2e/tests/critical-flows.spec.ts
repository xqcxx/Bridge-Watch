import { test, expect } from "@playwright/test";
import { LandingPage } from "../pages/LandingPage";
import { DashboardPage } from "../pages/DashboardPage";
import { BridgesPage } from "../pages/BridgesPage";
import { mockCoreApi } from "../utils/mockApi";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bridge-watch:onboarding:v1", "true");
  });
  await mockCoreApi(page);
});

test("navigates landing to dashboard and renders core widgets", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const dashboardPage = new DashboardPage(page);

  await landingPage.goto();
  await landingPage.openDashboard();
  await dashboardPage.assertLoaded();
});

test("opens widget customization and applies dashboard interactions", async ({ page }) => {
  const dashboardPage = new DashboardPage(page);

  await page.goto("/dashboard");
  await dashboardPage.assertLoaded();
  await dashboardPage.openCustomizationPanel();

  await page.getByRole("button", { name: "Operations" }).click();
  await expect(page.getByText("Layout import/export payload")).toBeVisible();
});

test("loads bridges page and bridge cards from mocked data", async ({ page }) => {
  const bridgesPage = new BridgesPage(page);
  await bridgesPage.goto();
  await bridgesPage.assertBridgeVisible("Allbridge");
  await bridgesPage.assertBridgeVisible("Wormhole");
});
