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

export const isMobile = (page: Page): boolean => {
  const viewportSize = page.viewportSize();
  return viewportSize ? viewportSize.width < 768 : false;
};

export const getPlaywrightUser = (
  num: number
): { username: string; email: string; password: string } => {
  const username: string = `${testConfig.playwrightUserName}${num}`;
  const email: string = `${testConfig.playwrightUserEmail.replace("@", `${num}@`)}`;
  const password: string = testConfig.playwrightUserPassword;
  return { username, email, password };
};

const login = async (page: Page, email: string, password: string) => {
  await page.goto("/login");
  await page.waitForURL("/login", { timeout: 5000 });
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await page.waitForURL("/", { timeout: 5000 });
  if (isMobile(page)) {
    await expect(page.getByTestId("mobile-menu-button")).toBeVisible();
  } else {
    await expect(page.getByText(/Hello/)).toBeVisible();
  }
  // Wait for any potential JS redirects or state changes
  await page.waitForLoadState("networkidle", { timeout: 3000 }).catch(() => {
    console.log(`Network not idle after login for: ${email}`);
  });
};

export const loginTestUser = async (page: Page) => {
  await login(page, testConfig.testUserEmail, testConfig.testUserPassword);
};

export const loginPlaywrightUser = async (page: Page, num: number) => {
  const user = getPlaywrightUser(num);
  await login(page, user.email, user.password);
  return user;
};

export const loginSuperuser = async (page: Page) => {
  await login(page, testConfig.superuserEmail, testConfig.superuserPassword);
};

export const logout = async (page: Page) => {
  await page.keyboard.press("Home");
  await page.waitForTimeout(300);
  if (isMobile(page)) {
    await page.getByTestId("mobile-menu-button").click({ force: true });
  } else {
    await page.getByText(/Hello/).click();
  }
  await page.getByRole("button", { name: "Log Out" }).click();
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

  await logout(page);
};
