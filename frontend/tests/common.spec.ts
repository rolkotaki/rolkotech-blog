import { test, expect } from "@playwright/test";
import {
  isMobile,
  loginTestUser,
  loginSuperuser,
  testConfig
} from "./helpers/helper";

test("Navbar loads with required elements when not logged in", async ({
  page
}) => {
  await page.goto("/");
  const header = page.locator("header");

  await expect(header.getByAltText("RolkoTech Logo")).toBeVisible();
  await expect(header.getByText("RolkoTech")).toBeVisible();

  if (isMobile(page)) {
    await expect(header.getByTestId("mobile-menu-button")).toBeVisible();
    await header.getByTestId("mobile-menu-button").click();
  }

  await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Articles" })).toBeVisible();
  await expect(header.getByRole("link", { name: "About" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Admin" })).toBeHidden();

  await expect(header.getByRole("link", { name: "Sign Up" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Log In" })).toBeVisible();
});

test("Navbar loads with required elements when logged in as user", async ({
  page
}) => {
  await loginTestUser(page);
  await page.goto("/");
  const header = page.locator("header");

  await expect(header.getByAltText("RolkoTech Logo")).toBeVisible();
  await expect(header.getByText("RolkoTech")).toBeVisible();

  if (isMobile(page)) {
    await expect(header.getByTestId("mobile-menu-button")).toBeVisible();
    await header.getByTestId("mobile-menu-button").click();
  }

  await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Articles" })).toBeVisible();
  await expect(header.getByRole("link", { name: "About" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Admin" })).toBeHidden();

  if (!isMobile(page)) {
    await expect(
      header.getByText(`Hello, ${testConfig.testUserName}`)
    ).toBeVisible();
    await header.getByText(`Hello, ${testConfig.testUserName}`).click();
  }
  await expect(header.getByRole("link", { name: "Sign Up" })).toBeHidden();
  await expect(header.getByRole("link", { name: "Log In" })).toBeHidden();
  await expect(header.getByRole("button", { name: "Log Out" })).toBeVisible();
});

test("Navbar loads with required elements when logged in as superuser", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/");
  const header = page.locator("header");

  await expect(header.getByAltText("RolkoTech Logo")).toBeVisible();
  await expect(header.getByText("RolkoTech")).toBeVisible();

  if (isMobile(page)) {
    await expect(header.getByTestId("mobile-menu-button")).toBeVisible();
    await header.getByTestId("mobile-menu-button").click();
  }

  await expect(header.getByRole("link", { name: "Home" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Articles" })).toBeVisible();
  await expect(header.getByRole("link", { name: "About" })).toBeVisible();
  await expect(header.getByRole("link", { name: "Admin" })).toBeVisible();

  if (!isMobile(page)) {
    await expect(
      header.getByText(`Hello, ${testConfig.superuserName}`)
    ).toBeVisible();
    await header.getByText(`Hello, ${testConfig.superuserName}`).click();
  }
  await expect(header.getByRole("link", { name: "Sign Up" })).toBeHidden();
  await expect(header.getByRole("link", { name: "Log In" })).toBeHidden();
  await expect(header.getByRole("button", { name: "Log Out" })).toBeVisible();
});

test("Footer loads with required elements", async ({ page }) => {
  await page.goto("/");
  const currentYear: number = new Date().getFullYear();
  await expect(
    page
      .locator("footer")
      .getByText(`© RolkoTech ${currentYear}. All rights reserved.`)
  ).toBeVisible();
});
