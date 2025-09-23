import { test, expect } from "@playwright/test";
import { isMobile } from "./helpers/helper";

test("Signup page loads with required elements", async ({ page }) => {
  await page.goto("/signup");
  await expect(
    page.getByRole("heading", { name: "Create an account", level: 2 })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Username")).toBeVisible();
  await expect(page.getByPlaceholder("Username")).toBeEditable();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeEditable();
  await expect(
    page.getByPlaceholder("Password", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Password", { exact: true })
  ).toBeEditable();
  await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
  if (!isMobile(page))
    await expect(page.getByRole("link", { name: "Sign Up" })).toBeVisible();
  await expect(
    page.getByText(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    )
  ).toBeVisible();
  const logInLinkCount = await page
    .getByRole("link", { name: "Log In" })
    .count();
  if (isMobile(page)) expect(logInLinkCount).toBe(1);
  else expect(logInLinkCount).toBe(2);
});

test("User can sign up successfully", async ({ page }) => {
  const timestamp = Date.now();
  const username = `testuser${timestamp}`;
  const email = `testuser${timestamp}@example.com`;
  const password = "TestPassword123!";

  await page.goto("/signup");

  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password", { exact: true }).fill(password);

  await page.getByRole("button", { name: "Sign Up" }).click();

  await page.waitForURL("/login?message=signup_success");
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  await expect(
    page.getByText(
      "Account created successfully! We have sent you an email to verify your account."
    )
  ).toBeVisible();

  // Check that login fails before email verification
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText("Inactive user")).toBeVisible();
});

test("Signup validation works", async ({ page }) => {
  await page.goto("/signup");

  // Empty fields
  await page.getByPlaceholder("Username").click();
  await page.getByPlaceholder("Email").click();
  await page.getByPlaceholder("Password").click();
  await page
    .getByRole("heading", { name: "Create an account", level: 2 })
    .click();
  await expect(page.getByText("Username is required")).toBeVisible();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password is required")).toBeVisible();

  // Invalid email format
  await page.getByPlaceholder("Email").fill("invalid@invalid");
  await page.getByPlaceholder("Username").fill("test");
  await page.getByPlaceholder("Password").fill("Test123@");
  await expect(
    page.getByText("Please enter a valid email address")
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign Up" }).click();
  expect(page.url()).toContain("/signup");
});

test("Link to log in works", async ({ page }) => {
  await page.goto("/signup");
  await page
    .getByText("Already have an account?")
    .getByRole("link", { name: "Log In" })
    .click();
  await page.waitForURL("/login");
});
