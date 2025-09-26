import { test, expect } from "@playwright/test";

test("About page loads with required elements", async ({ page }) => {
  await page.goto("/about");
  await expect(
    page.getByRole("heading", {
      name: "Hey there, I'm Roland Takacs",
      level: 1
    })
  ).toBeVisible();
  await expect(page.getByAltText("Roland Takacs")).toBeVisible();
  await expect(page.getByAltText("RolkoTech adventures")).toBeVisible();
  await expect(page.getByText("Connect with me:")).toBeVisible();
  let count = await page
    .locator('a[href="https://www.linkedin.com/in/roland-takacs-a7000582/"]')
    .count();
  expect(count).toBe(2);
  count = await page.locator('a[href="https://github.com/rolkotaki"]').count();
  expect(count).toBe(2);
  count = await page
    .locator('a[href="https://www.youtube.com/@rolandTRavel"]')
    .count();
  expect(count).toBe(2);
});
