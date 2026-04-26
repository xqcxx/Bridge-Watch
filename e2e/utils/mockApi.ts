import { type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const assetsFixture = JSON.parse(
  readFileSync(resolve(__dirname, "../fixtures/assets.json"), "utf8"),
);
const assetHealthFixture = JSON.parse(
  readFileSync(resolve(__dirname, "../fixtures/asset-health.json"), "utf8"),
);
const bridgesFixture = JSON.parse(
  readFileSync(resolve(__dirname, "../fixtures/bridges.json"), "utf8"),
);

const jsonHeaders = { "content-type": "application/json" };

export async function mockCoreApi(page: Page): Promise<void> {
  await page.route("**/api/v1/assets", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(assetsFixture),
    });
  });

  await page.route("**/api/v1/assets/*/health*", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/\/api\/v1\/assets\/([^/]+)\/health/);
    const symbol = match?.[1] ?? "";
    const body = (assetHealthFixture as Record<string, unknown>)[symbol] ?? null;

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
  });

  await page.route("**/api/v1/bridges", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify(bridgesFixture),
    });
  });

  await page.route("**/health", async (route) => {
    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
      }),
    });
  });
}
