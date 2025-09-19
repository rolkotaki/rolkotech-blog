import { test, expect } from "@playwright/test";
import { loginTestUser, loginSuperuser, logout } from "./helpers/helper";

test("Login page loads with required elements", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Log In to your account", level: 2 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeEditable();
  await expect(
    page.getByPlaceholder("Password", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Password", { exact: true }),
  ).toBeEditable();
  await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Forgot your password?" }),
  ).toBeVisible();
  const signUpLinkCount = await page
    .getByRole("link", { name: "Sign Up" })
    .count();
  expect(signUpLinkCount).toBe(2);
  await expect(page.getByRole("link", { name: "Log In" })).toBeVisible();
  await expect(page.getByText(/Hello/)).toBeHidden();
});

test("User can log in successfully", async ({ page }) => {
  await loginTestUser(page);
  await page.waitForURL("/");
  await expect(
    page.getByRole("heading", { name: "Recent Posts", level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Featured Posts", level: 2 }),
  ).toBeVisible();
  await expect(page.getByText(/Hello/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Admin" })).toBeHidden();
});

test("Superuser can log in successfully", async ({ page }) => {
  await loginSuperuser(page);
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
});

test("User cannot log in with invalid credentials", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("invalid@email.com");
  await page.getByPlaceholder("Password").fill("wrongpassword");
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByText("Incorrect username or password")).toBeVisible();
});

test("User can log out", async ({ page }) => {
  await loginTestUser(page);
  await logout(page);
  await page.waitForURL("/");
  await expect(page.getByRole("link", { name: "Log In" })).toBeVisible();
  await expect(page.getByText(/Hello/)).toBeHidden();
});

test("Reset Password page loads with required elements", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Enter your email address")).toBeVisible();
  await expect(
    page.getByPlaceholder("Enter your email address"),
  ).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Send Reset Link" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByText(/Hello/)).toBeHidden();
});

test("Reset Password page validation works", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeVisible();

  // Empty email
  await page.getByPlaceholder("Enter your email address").click();
  await page.getByRole("heading", { name: "Reset Password", level: 3 }).click();
  await expect(page.getByText("Email is required")).toBeVisible();
  // Invalid email format
  await page
    .getByPlaceholder("Enter your email address")
    .fill("invalid@invalid");
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(
    page.getByText("Please enter a valid email address"),
  ).toBeVisible();
});

test("Reset Password works", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeVisible();
  await page.getByPlaceholder("Enter your email address").fill("any@email.com");
  await page.getByRole("button", { name: "Send Reset Link" }).click();
  await expect(
    page.getByText(
      "If the email exists and is active, a reset link has been sent.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send Reset Link" }),
  ).toBeHidden();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeHidden();
});

test("Reset Password page closes", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeVisible();
  await page.getByRole("button", { name: "×", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Reset Password", level: 3 }),
  ).toBeHidden();
});

test("Link to signup works", async ({ page }) => {
  await page.goto("/login");
  await page
    .getByText("Don't have an account?")
    .getByRole("link", { name: "Sign Up" })
    .click();
  await page.waitForURL("/signup");
});
