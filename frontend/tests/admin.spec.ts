import { test, expect } from "@playwright/test";
import {
  loginTestUser,
  loginSuperuser,
  TEST_IMAGE,
  WRONG_TEST_IMAGES,
  testConfig
} from "./helpers/helper";

test("Admin menu is not available for normal user", async ({ page }) => {
  await loginTestUser(page);
  await expect(page.getByRole("link", { name: "Admin" })).toBeHidden();
  await page.goto("/admin");
  await page.waitForURL("/login");
});

test("Admin menu is available for superuser", async ({ page }) => {
  await loginSuperuser(page);
  await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  await page.getByRole("link", { name: "Admin" }).click();
  await page.waitForURL("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin Dashboard", level: 1 })
  ).toBeVisible();
});

test("Admin Dashboard - Images loads with required elements", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Images" }).click();

  await expect(
    page.getByRole("heading", { name: "Image Management", level: 2 })
  ).toBeVisible();
  await expect(page.getByText("Upload Image")).toBeVisible();
});

test("Superuser can upload an image", async ({ page }) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Images" }).click();

  await page.locator('input[id="imageUpload"]').setInputFiles(TEST_IMAGE);
  const image_filename = TEST_IMAGE.split("/").pop();

  await expect(
    page.getByRole("heading", { name: image_filename, level: 4 })
  ).toBeVisible({ timeout: 5000 });
  await expect(page.locator(`img[alt="${image_filename}"]`)).toBeVisible();
  let buttonCount = await page
    .getByRole("button", { name: "Copy Name" })
    .count();
  expect(buttonCount).toBeGreaterThan(0);
  buttonCount = await page.getByRole("button", { name: "Copy URL" }).count();
  expect(buttonCount).toBeGreaterThan(0);
  buttonCount = await page
    .getByRole("button", { name: "Delete", exact: true })
    .count();
  expect(buttonCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Copy Name" }).last().click();
  const copiedName = await page.evaluate(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).clipboard.readText()
  );
  expect(copiedName).toBe(image_filename);
  await page.getByRole("button", { name: "Copy URL" }).last().click();
  const copiedURL = await page.evaluate(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).clipboard.readText()
  );
  expect(copiedURL).toContain(image_filename);
});

test("Superuser cannot upload wrong image", async ({ page }) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Images" }).click();

  for (const img of WRONG_TEST_IMAGES) {
    const dialogPromise = page.waitForEvent("dialog");
    await page.locator('input[id="imageUpload"]').setInputFiles(img);
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("alert");
    await dialog.accept();
  }
});

test("Admin Dashboard - Add New Blog Post loads with required elements", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Blog Posts" }).click();

  await expect(
    page.getByRole("heading", { name: "Add New Blog Post", level: 2 })
  ).toBeVisible();

  await expect(page.getByPlaceholder("Blog post title...")).toBeVisible();
  await expect(page.getByPlaceholder("Blog post URL slug...")).toBeVisible();
  await expect(page.getByPlaceholder("Blog post content...")).toBeVisible();
  await expect(page.getByPlaceholder("tag1,tag2,tag3...")).toBeVisible();
  await expect(
    page.getByPlaceholder("Paste or select an image filename...")
  ).toBeVisible();
  await expect(
    page.getByText(
      "Separate tags with commas. New tags will be created automatically."
    )
  ).toBeVisible();
  await expect(page.getByLabel("Mark as featured")).toBeVisible();

  await expect(page.getByPlaceholder("Blog post title...")).toBeEditable();
  await expect(page.getByPlaceholder("Blog post URL slug...")).toBeEditable();
  await expect(page.getByPlaceholder("Blog post content...")).toBeEditable();
  await expect(page.getByPlaceholder("tag1,tag2,tag3...")).toBeEditable();
  await expect(
    page.getByPlaceholder("Paste or select an image filename...")
  ).toBeEditable();
  await expect(page.getByLabel("Mark as featured")).toBeEditable();

  await expect(
    page.getByRole("button", { name: "Publish Post" })
  ).toBeVisible();
});

test("Superuser can upload an image and add a new blog post successfully", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Images" }).click();
  await page.locator('input[id="imageUpload"]').setInputFiles(TEST_IMAGE);
  const image_filename = TEST_IMAGE.split("/").pop();

  await page.getByRole("button", { name: "Blog Posts" }).click();

  await page.getByPlaceholder("Blog post title...").fill("Blog Post 1");
  await page.getByPlaceholder("Blog post URL slug...").fill("blog-post-1");
  await page
    .getByPlaceholder("Blog post content...")
    .fill("This is the content of Blog Post 1.");
  await page.getByPlaceholder("tag1,tag2,tag3...").fill("testtag");
  await expect(page.getByAltText("Selected image preview")).toBeHidden();
  await page
    .getByPlaceholder("Paste or select an image filename...")
    .fill(`${image_filename}`);
  await expect(page.getByAltText("Selected image preview")).toBeVisible();
  await page.getByLabel("Mark as featured").check();

  const dialogPromise = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Publish Post" }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe("Blog post created successfully!");
  await dialog.accept();
});

test("Admin Dashboard - Users loads with required elements", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Users" }).click();

  await expect(
    page.getByRole("heading", { name: "User Management", level: 2 })
  ).toBeVisible();
  await expect(page.getByText("Showing")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Refresh Users" })
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search by name...")).toBeVisible();
  await expect(page.getByPlaceholder("Search by name...")).toBeEditable();
  await expect(page.getByPlaceholder("Search by email...")).toBeVisible();
  await expect(page.getByPlaceholder("Search by email...")).toBeEditable();
  await expect(page.locator('select[id="roleFilter"]')).toBeVisible();
  await expect(page.locator('select[id="statusFilter"]')).toBeVisible();

  const roleFilter = page.locator('select[id="roleFilter"]');
  await expect(roleFilter.locator('option[value="all"]')).toHaveText(
    "All Roles"
  );
  await expect(roleFilter.locator('option[value="admin"]')).toHaveText(
    "Admin Only"
  );
  await expect(roleFilter.locator('option[value="user"]')).toHaveText(
    "User Only"
  );

  const statusFilter = page.locator('select[id="statusFilter"]');
  await expect(statusFilter.locator('option[value="all"]')).toHaveText(
    "All Status"
  );
  await expect(statusFilter.locator('option[value="active"]')).toHaveText(
    "Active Only"
  );
  await expect(statusFilter.locator('option[value="inactive"]')).toHaveText(
    "Inactive Only"
  );

  await expect(page.getByRole("cell", { name: "Username" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Email", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Role" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "Account Status" })
  ).toBeVisible();
  await expect(page.getByRole("cell", { name: "Actions" })).toBeVisible();
});

test("Superuser can refresh, filter and manage users", async ({ page }) => {
  await loginSuperuser(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Users" }).click();

  await page.getByRole("button", { name: "Refresh Users" }).click();
  await page.waitForTimeout(1000);

  // Filter for inactive users (there should be none)
  await page.locator('select[id="statusFilter"]').selectOption("inactive");
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeHidden();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeHidden();
  await page.locator('select[id="statusFilter"]').selectOption("all");

  // Filter for superuser
  await page
    .getByPlaceholder("Search by name...")
    .fill(testConfig.superuserName);
  await expect(
    page.getByText(testConfig.superuserName, { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(testConfig.testUserName, { exact: true })
  ).toBeHidden();
  await page.getByPlaceholder("Search by name...").fill("");

  await expect(page.getByText("Showing 1 of")).toBeVisible();

  await page
    .getByPlaceholder("Search by email...")
    .fill(testConfig.superuserEmail);
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeHidden();
  await page.getByPlaceholder("Search by email...").fill("");

  await page.locator('select[id="roleFilter"]').selectOption("admin");
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeHidden();
  await page.locator('select[id="roleFilter"]').selectOption("all");

  await page
    .getByPlaceholder("Search by name...")
    .fill(testConfig.superuserName);
  await page
    .getByPlaceholder("Search by email...")
    .fill(testConfig.superuserEmail);
  await page.locator('select[id="roleFilter"]').selectOption("admin");
  await page.locator('select[id="statusFilter"]').selectOption("active");
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeHidden();

  await page.getByPlaceholder("Search by name...").fill("");
  await page.getByPlaceholder("Search by email...").fill("");
  await page.locator('select[id="roleFilter"]').selectOption("all");
  await page.locator('select[id="statusFilter"]').selectOption("all");

  // Filter for test user
  await page
    .getByPlaceholder("Search by name...")
    .fill(testConfig.testUserName);
  await expect(
    page.getByText(testConfig.testUserName, { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(testConfig.superuserName, { exact: true })
  ).toBeHidden();
  await page.getByPlaceholder("Search by name...").fill("");

  await expect(page.getByText("Showing 1 of")).toBeVisible();

  await page
    .getByPlaceholder("Search by email...")
    .fill(testConfig.testUserEmail);
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeHidden();
  await page.getByPlaceholder("Search by email...").fill("");

  await page.locator('select[id="roleFilter"]').selectOption("user");
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeHidden();
  await page.locator('select[id="roleFilter"]').selectOption("all");

  await page
    .getByPlaceholder("Search by name...")
    .fill(testConfig.testUserName);
  await page
    .getByPlaceholder("Search by email...")
    .fill(testConfig.testUserEmail);
  await page.locator('select[id="roleFilter"]').selectOption("user");
  await page.locator('select[id="statusFilter"]').selectOption("active");
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeHidden();

  // Clear all filters
  await page.getByPlaceholder("Search by name...").fill("");
  await page.getByPlaceholder("Search by email...").fill("");
  await page.locator('select[id="roleFilter"]').selectOption("all");
  await page.locator('select[id="statusFilter"]').selectOption("all");
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeVisible();

  // Make test user an admin
  const userRow = page
    .locator("tr")
    .filter({ hasText: testConfig.testUserEmail });
  await userRow.locator("td").nth(2).locator("label").click(); // Role toggle
  await expect(userRow.getByText("Admin", { exact: true })).toBeVisible();

  await page.locator('select[id="roleFilter"]').selectOption("admin");
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeVisible();
  await page.locator('select[id="roleFilter"]').selectOption("user");
  await expect(
    page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  ).toBeHidden();
  await expect(
    page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  ).toBeHidden();
  await page.locator('select[id="roleFilter"]').selectOption("all");
  // Revert test user to normal user
  await userRow.locator("td").nth(2).locator("label").click();

  // TODO: Maybe add a new user for testing inactive user filtering
  //   // Make test user inactive
  //   userRow = page.locator("tr").filter({ hasText: testConfig.testUserEmail });
  //   await userRow.locator("td").nth(3).locator("label").click(); // Status toggle
  //   await expect(userRow.getByText("Inactive", { exact: true })).toBeVisible();

  //   await page.locator('select[id="statusFilter"]').selectOption("active");
  //   await expect(
  //     page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  //   ).toBeVisible();
  //   await expect(
  //     page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  //   ).toBeHidden();
  //   await page.locator('select[id="statusFilter"]').selectOption("inactive");
  //   await expect(
  //     page.getByRole("cell", { name: testConfig.superuserEmail, exact: true })
  //   ).toBeHidden();
  //   await expect(
  //     page.getByRole("cell", { name: testConfig.testUserEmail, exact: true })
  //   ).toBeVisible();
  //   // Revert test user to active user
  //   await userRow.locator("td").nth(3).locator("label").click();
});

test("Superuser can delete users", async ({ page }) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "Users" }).click();

  const userRow = page
    .locator("tr")
    .filter({ hasText: testConfig.testUserEmail });
  await expect(
    userRow.getByRole("button", { name: "Delete", exact: true })
  ).toBeVisible();

  // Handle confirm dialog
  let dialogHandled = false;
  page.on("dialog", async (dialog) => {
    expect(dialog.type()).toBe("confirm");
    expect(dialog.message()).toBe(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    await dialog.dismiss();
    dialogHandled = true;
  });

  await userRow.locator('button:has-text("Delete")').click({
    noWaitAfter: true,
    timeout: 5000
  });
  await expect(() => expect(dialogHandled).toBe(true)).toPass({
    timeout: 5000
  });
});

test("Admin Dashboard - API Docs loads with required elements", async ({
  page
}) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "API Docs" }).click();

  await expect(
    page.getByRole("heading", { name: "API Documentation", level: 2 })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Open API Docs" })).toBeVisible();
});

test("Superuser can open API Docs", async ({ page }) => {
  await loginSuperuser(page);
  await page.goto("/admin");
  await page.getByRole("button", { name: "API Docs" }).click();
  await page.getByRole("link", { name: "Open API Docs" }).click();

  const [newPage] = await Promise.all([page.context().waitForEvent("page")]);
  await newPage.waitForLoadState();
  await expect(newPage).toHaveURL(/\/docs$/);
});
