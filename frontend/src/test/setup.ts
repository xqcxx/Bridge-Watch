import "@testing-library/jest-dom/vitest";
import { expect, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as axeMatchers from "vitest-axe/matchers";
import * as jestDomMatchers from "@testing-library/jest-dom/matchers";
import { server } from "./mocks/server";

// Extend Vitest matchers
expect.extend(axeMatchers);
expect.extend(jestDomMatchers);

// MSW Lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

