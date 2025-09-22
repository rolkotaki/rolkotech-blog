import { test, expect } from "@playwright/test";
import {
  loginPlaywrightUser,
  loginTestUser,
  loginSuperuser,
  testConfig
} from "./helpers/helper";

test("User menu loads with required elements for normal user", async ({
  page
}) => {
  await loginTestUser(page);

  await expect(page.getByRole("link", { name: "Update Profile" })).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Change Password" })
  ).toBeHidden();
  await expect(
    page.getByRole("button", { name: "Delete My Account" })
  ).toBeHidden();

  await page.getByText(`Hello, ${testConfig.testUserName}`).click();

  await expect(
    page.getByRole("link", { name: "Update Profile" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Change Password" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete My Account" })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
});

test("User menu loads with required elements for superuser", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.getByText(/Hello/).click();

  await expect(
    page.getByRole("link", { name: "Update Profile" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Change Password" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete My Account" })
  ).toBeHidden();
  await expect(page.getByRole("button", { name: "Log Out" })).toBeVisible();
});

test("Update Profile loads with required elements for normal user", async ({
  page
}) => {
  await loginTestUser(page);
  await page.getByText(/Hello/).click();
  await page.getByRole("link", { name: "Update Profile" }).click();
  await page.waitForURL("/me");

  await expect(
    page.getByRole("heading", { name: "Update Profile", level: 2 })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Username")).toBeVisible();
  await expect(page.getByPlaceholder("Username")).toBeEditable();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Update", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "← Back to Home" })
  ).toBeVisible();
});

test("Update Profile validation works", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me");
  await page.waitForURL("/me");

  // Empty fields
  await page.getByPlaceholder("Username").fill("");
  await page.getByPlaceholder("Email").fill("");
  await page.getByPlaceholder("Username").click();
  await page.getByPlaceholder("Email").click();
  await page.getByRole("heading", { name: "Update Profile", level: 2 }).click();
  await expect(page.getByText("Username is required")).toBeVisible({
    timeout: 1000
  });
  await expect(page.getByText("Email is required")).toBeVisible({
    timeout: 1000
  });

  // Invalid email format
  await page.getByPlaceholder("Email").fill("invalid@invalid");
  await page.getByPlaceholder("Username").fill("test");
  await expect(
    page.getByText("Please enter a valid email address")
  ).toBeVisible();

  await page.getByRole("button", { name: "Update", exact: true }).click();
  expect(page.url()).toContain("/me");
});

test("Update Profile works successfully", async ({ page }) => {
  const user = await loginPlaywrightUser(page, 1);
  await page.goto("/me");
  await page.waitForURL("/me");

  await page.getByPlaceholder("Username").fill(user.username + "updated");
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByRole("heading", { name: "Update Profile", level: 2 }).click();
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.getByText("Profile updated successfully")).toBeVisible();

  // Revert changes
  await page.getByPlaceholder("Username").fill(user.username);
  await page.getByRole("heading", { name: "Update Profile", level: 2 }).click();
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page.getByText("Profile updated successfully")).toBeVisible();
});

test("Update Profile error when account with email already exists", async ({
  page
}) => {
  await loginTestUser(page);
  await page.goto("/me");
  await page.waitForURL("/me");

  await page.getByPlaceholder("Username").fill(testConfig.testUserName);
  await page.getByPlaceholder("Email").fill(testConfig.superuserEmail);
  await page.getByRole("heading", { name: "Update Profile", level: 2 }).click();
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(
    page.getByText("User with this email already exists")
  ).toBeVisible();
});

test("Update Profile error when account with username already exists", async ({
  page
}) => {
  await loginTestUser(page);
  await page.goto("/me");
  await page.waitForURL("/me");

  await page.getByPlaceholder("Username").fill(testConfig.superuserName);
  await page.getByPlaceholder("Email").fill(testConfig.testUserEmail);
  await page.getByRole("heading", { name: "Update Profile", level: 2 }).click();
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(
    page.getByText("User with this name already exists")
  ).toBeVisible();
});

test("Update Profile link to home works", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me");
  await page.getByRole("link", { name: "← Back to Home" }).click();
  await page.waitForURL("/");
});

test("Change Password loads with required elements", async ({ page }) => {
  await loginTestUser(page);
  await page.getByText(/Hello/).click();
  await page.getByRole("link", { name: "Change Password" }).click();
  await page.waitForURL("/me/password");

  await expect(
    page.getByRole("heading", { name: "Change Password", level: 2 })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Current Password")).toBeVisible();
  await expect(
    page.getByPlaceholder("New Password", { exact: true })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Confirm New Password")).toBeVisible();
  await expect(page.getByPlaceholder("Current Password")).toBeEditable();
  await expect(
    page.getByPlaceholder("New Password", { exact: true })
  ).toBeEditable();
  await expect(page.getByPlaceholder("Confirm New Password")).toBeEditable();
  await expect(
    page.getByRole("button", { name: "Update Password", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
    )
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "← Back to Home" })
  ).toBeVisible();
});

test("Change Password validation works", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me/password");
  await page.waitForURL("/me/password");

  // Empty fields
  await page.getByPlaceholder("Current Password").click();
  await page.getByPlaceholder("New Password", { exact: true }).click();
  await page.getByPlaceholder("Confirm New Password").click();
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(page.getByText("Current password is required")).toBeVisible();
  await expect(
    page.getByText("Password is required", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Please confirm your password")).toBeVisible();

  // Incorrect password
  await page.getByPlaceholder("Current Password").fill("TestPassword123!");
  await page.getByPlaceholder("Confirm New Password").fill("Different123!");

  await page.getByPlaceholder("New Password", { exact: true }).fill("abcabca");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(
    page.getByText("Password must be at least 8 characters", { exact: true })
  ).toBeVisible();

  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(
    page.getByText("Password must contain at least one number")
  ).toBeVisible();

  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword123");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(
    page.getByText("Password must contain at least one special character")
  ).toBeVisible();

  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("newpassword123/");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(
    page.getByText("Password must contain at least one uppercase letter")
  ).toBeVisible();

  // Passwords do not match
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword123!");
  await page.getByPlaceholder("Confirm New Password").fill("Different123!");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(page.getByText("Passwords do not match")).toBeVisible();

  // Passwords match
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword123!");
  await page.getByPlaceholder("Confirm New Password").fill("NewPassword123!");
  await page
    .getByRole("heading", { name: "Change Password", level: 2 })
    .click();
  await expect(page.getByText("Passwords match")).toBeVisible();
});

test("Change Password and delete user works successfully", async ({ page }) => {
  // Change password
  const user = await loginPlaywrightUser(page, 2);
  await page.goto("/me/password");
  await page.waitForURL("/me/password");

  await page.getByPlaceholder("Current Password").fill(user.password);
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword123!");
  await page.getByPlaceholder("Confirm New Password").fill("NewPassword123!");
  await page
    .getByRole("button", { name: "Update Password", exact: true })
    .click();
  await expect(page.getByText("Password updated successfully")).toBeVisible();

  // Delete user
  await page.getByText(/Hello/).click();
  await page.getByRole("button", { name: "Delete My Account" }).click();
  await expect(
    page.getByText(
      "Are you sure you want to delete your account? This action cannot be undone and you will lose all your data."
    )
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Delete Account" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete Account" }).click();
  await page.waitForURL("/");
  await expect(page.getByRole("link", { name: "Log In" })).toBeVisible();
});

test("Change Password fails with incorrect password", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me/password");
  await page.waitForURL("/me/password");

  await page.getByPlaceholder("Current Password").fill("WrongPassword123!");
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill("NewPassword123!");
  await page.getByPlaceholder("Confirm New Password").fill("NewPassword123!");
  await page
    .getByRole("button", { name: "Update Password", exact: true })
    .click();
  await expect(page.getByText("Incorrect password")).toBeVisible();
});

test("Change Password fails with same password", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me/password");
  await page.waitForURL("/me/password");

  await page
    .getByPlaceholder("Current Password")
    .fill(testConfig.testUserPassword);
  await page
    .getByPlaceholder("New Password", { exact: true })
    .fill(testConfig.testUserPassword);
  await page
    .getByPlaceholder("Confirm New Password")
    .fill(testConfig.testUserPassword);
  await page
    .getByRole("button", { name: "Update Password", exact: true })
    .click();
  await expect(
    page.getByText("New password cannot be the same as the current one")
  ).toBeVisible();
});

test("Change Password link to home works", async ({ page }) => {
  await loginTestUser(page);
  await page.goto("/me/password");
  await page.getByRole("link", { name: "← Back to Home" }).click();
  await page.waitForURL("/");
});
