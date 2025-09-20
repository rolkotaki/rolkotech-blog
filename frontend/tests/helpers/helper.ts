import { type Page, expect } from "@playwright/test";

export const TEST_IMAGE: string = "./tests/files/test_image.jpeg";
export const WRONG_TEST_IMAGES: string[] = [
  "./tests/files/test_file.txt",
  "./tests/files/test_image.psd",
  "./tests/files/test_image_large.JPG"
];

export const testConfig = {
  superuserEmail: process.env.FIRST_SUPERUSER_EMAIL || "",
  superuserPassword: process.env.FIRST_SUPERUSER_PASSWORD || "",
  superuserName: process.env.FIRST_SUPERUSER || "",

  testUserEmail: process.env.TEST_USER_EMAIL || "",
  testUserPassword: process.env.TEST_USER_PASSWORD || "",
  testUserName: process.env.TEST_USER || "",

  playwrightUserEmail: process.env.TEST_PLAYWRIGHT_USER_EMAIL || "",
  playwrightUserPassword: process.env.TEST_PLAYWRIGHT_USER_PASSWORD || "",
  playwrightUserName: process.env.TEST_PLAYWRIGHT_USER || ""
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

export const createArticle = async (
  page: Page,
  articleIndex: number,
  featured: boolean = false
) => {
  await loginSuperuser(page);
  await page.goto("/admin");

  await page.getByRole("button", { name: "Images" }).click();
  await page.locator('input[id="imageUpload"]').setInputFiles(TEST_IMAGE);
  const image_filename = TEST_IMAGE.split("/").pop();

  await page.getByRole("button", { name: "Blog Posts" }).click();

  await page
    .getByPlaceholder("Blog post title...")
    .fill(`Blog Post ${articleIndex}`);
  await page
    .getByPlaceholder("Blog post URL slug...")
    .fill(`blog-post-${articleIndex}`);
  await page
    .getByPlaceholder("Blog post content...")
    .fill(`This is the content of Blog Post ${articleIndex}.`);
  await page
    .getByPlaceholder("tag1,tag2,tag3...")
    .fill(`rolkotech,tag${articleIndex}`);
  await page
    .getByPlaceholder("Paste or select an image filename...")
    .fill(`${image_filename}`);
  if (featured) await page.getByLabel("Mark as featured").check();

  const dialogPromise = page.waitForEvent("dialog");
  await page.getByRole("button", { name: "Publish Post" }).click();
  const dialog = await dialogPromise;
  expect(dialog.message()).toBe("Blog post created successfully!");
  await dialog.accept();
};
