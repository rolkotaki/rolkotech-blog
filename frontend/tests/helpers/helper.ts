import { type Page } from "@playwright/test";

export const testConfig = {
  superuserEmail: process.env.FIRST_SUPERUSER_EMAIL || "",
  superuserPassword: process.env.FIRST_SUPERUSER_PASSWORD || "",
  superuserName: process.env.FIRST_SUPERUSER || "",

  testUserEmail: process.env.TEST_USER_EMAIL || "",
  testUserPassword: process.env.TEST_USER_PASSWORD || "",
  testUserName: process.env.TEST_USER || "",

  playwrightUserEmail: process.env.TEST_PLAYWRIGHT_USER_EMAIL || "",
  playwrightUserPassword: process.env.TEST_PLAYWRIGHT_USER_PASSWORD || "",
  playwrightUserName: process.env.TEST_PLAYWRIGHT_USER || "",
};

export const loginTestUser = async (page: Page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(testConfig.testUserEmail);
  await page.getByPlaceholder("Password").fill(testConfig.testUserPassword);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/");
};

export const loginPlaywrightUser = async (page: Page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(testConfig.playwrightUserEmail);
  await page
    .getByPlaceholder("Password")
    .fill(testConfig.playwrightUserPassword);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/");
};

export const loginSuperuser = async (page: Page) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(testConfig.superuserEmail);
  await page.getByPlaceholder("Password").fill(testConfig.superuserPassword);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/");
};

export const logout = async (page: Page) => {
  await page.getByText(/Hello/).click();
  await page.getByRole("button", { name: "Log Out" }).click();
  await page.waitForURL("/");
};
