import { type Locator, type Page, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly assetHealthHeading: Locator;
  readonly bridgeStatusHeading: Locator;
  readonly customizeWidgetsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Dashboard" });
    this.assetHealthHeading = page.getByRole("heading", { name: "Asset Health" });
    this.bridgeStatusHeading = page.getByRole("heading", { name: "Bridge Status" });
    this.customizeWidgetsButton = page.getByRole("button", { name: "Customize widgets" });
  }

  async dismissOnboardingIfPresent(): Promise<void> {
    const dialog = this.page.getByRole("dialog", { name: "Welcome to Bridge Watch" });
    if (await dialog.isVisible()) {
      const skipButton = this.page.getByRole("button", { name: "Skip" });
      if (await skipButton.isVisible()) {
        await skipButton.click({ force: true });
      } else {
        await this.page.getByRole("button", { name: "Close onboarding" }).click({ force: true });
      }
      await expect(dialog).toBeHidden();
    }
  }

  async assertLoaded(): Promise<void> {
    await this.dismissOnboardingIfPresent();
    await expect(this.heading).toBeVisible();
    await expect(this.assetHealthHeading).toBeVisible();
    await expect(this.bridgeStatusHeading).toBeVisible();
    await expect(this.page.getByRole("link", { name: /View details for bridge Allbridge/i })).toBeVisible();
    await expect(this.page.getByText("Allbridge")).toBeVisible();
  }

  async openCustomizationPanel(): Promise<void> {
    await this.customizeWidgetsButton.click();
    await expect(this.page.getByText("Preset layouts")).toBeVisible();
  }
}
