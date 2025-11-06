import { test, expect } from "@playwright/test";
import { createArticle, loginSuperuser } from "./helpers/helper";

test.describe.serial("Home Page Tests", () => {
  const todaysDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  });
  let featuredBlogPostTitle: string = "";

  test("Home page loads with minimum required elements", async ({ page }) => {
    await page.goto("/");

    // Minimum required elements
    await expect(
      page.getByRole("button", { name: "All", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recent Posts", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Featured Posts", level: 2 })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View all posts →" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View more posts →" })
    ).toBeHidden();
  });

  test("Home page loads with required elements having at least three blog posts", async ({
    page
  }) => {
    const recentPostsDiv = page.getByTestId("recent-posts");

    for (let i = 1; i <= 3; i++) {
      // Create a new article
      await createArticle(page, i);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      let skip: number = 0;
      while (
        await recentPostsDiv
          .locator("div")
          .nth(skip)
          .getByRole("heading", { name: `Blog Post ${i}`, level: 3 })
          .isHidden()
      ) {
        // Other tests may have been added in other tests, so skip them
        skip += 1;
        console.log(`Inside loop: ${skip}`);
      }

      // Verify the article appears in recent posts
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByAltText(`Blog Post ${i}`, { exact: true })
      ).toBeVisible();
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByText(`${todaysDate}`, { exact: true })
      ).toBeVisible();
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByRole("heading", { name: `Blog Post ${i}`, level: 3 })
      ).toBeVisible();
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByText(`This is the content of Blog Post ${i}.`, { exact: true })
      ).toBeVisible();
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByText("rolkotech", { exact: true })
      ).toBeVisible();
      await expect(
        recentPostsDiv
          .locator("div")
          .nth(0 + skip)
          .getByText(`tag${i}`, { exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: `tag${i}`, exact: true })
      ).toBeVisible();
    }
    // Verify that tag buttons are visible/hidden as expected
    await expect(
      page.getByRole("button", { name: "rolkotech", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "tag4", exact: true })
    ).toBeHidden();
  });

  test("Home page loads with required elements having at least four blog posts", async ({
    page
  }) => {
    // Create a new article
    await createArticle(page, 4);
    await page.goto("/");

    await expect(
      page.getByRole("button", { name: "View more posts →" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "tag4", exact: true })
    ).toBeVisible();
  });

  test("Home page loads with required elements having a featured blog post", async ({
    page
  }) => {
    // Add a featured post
    await createArticle(page, 5, true);
    await page.goto("/");

    const featuredPostsDiv = page.getByTestId("featured-posts");

    await expect(
      featuredPostsDiv
        .locator("div")
        .nth(0)
        .getByAltText("Blog Post 5", { exact: true })
    ).toBeVisible();
    await expect(
      featuredPostsDiv
        .locator("div")
        .nth(0)
        .getByText(`${todaysDate}`, { exact: true })
    ).toBeVisible();
    await expect(
      featuredPostsDiv
        .locator("div")
        .nth(0)
        .getByRole("heading", { name: "Blog Post 5", level: 3 })
    ).toBeVisible();
    await expect(
      featuredPostsDiv
        .locator("div")
        .nth(0)
        .getByText("This is the content of Blog Post 5.", { exact: true })
    ).toBeVisible();
    await expect(
      featuredPostsDiv
        .locator("div")
        .nth(0)
        .getByText("rolkotech", { exact: true })
    ).toBeVisible();
    await expect(
      featuredPostsDiv.locator("div").nth(0).getByText("tag5", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "tag5", exact: true })
    ).toBeVisible();
  });

  test("Home page - Make a blog post featured as a superuser", async ({
    page
  }) => {
    await page.goto("/");
    const recentPostsDiv = page.getByTestId("recent-posts");
    const featuredPostsDiv = page.getByTestId("featured-posts");

    // Featured toggle button should not be visible if not superuser
    await expect(
      featuredPostsDiv.locator("div").nth(0).getByTitle("Remove from featured")
    ).toBeHidden();

    await loginSuperuser(page);
    await page.goto("/");

    await expect(
      featuredPostsDiv.locator("div").nth(0).getByTitle("Remove from featured")
    ).toBeVisible();

    for (let i = 0; i <= 2; i++) {
      if (
        (await recentPostsDiv
          .locator("div")
          .nth(i)
          .getByTitle("Mark as featured")
          .count()) > 0
      ) {
        // Get the blog post title before making it featured
        featuredBlogPostTitle =
          (await recentPostsDiv
            .locator("div")
            .nth(i)
            .getByRole("heading", { level: 3 })
            .textContent()) || "";

        await recentPostsDiv
          .locator("div")
          .nth(i)
          .getByTitle("Mark as featured")
          .click();
        await expect(
          recentPostsDiv.locator("div").nth(i).getByTitle("Mark as featured")
        ).toBeHidden();
        await expect(
          recentPostsDiv
            .locator("div")
            .nth(i)
            .getByTitle("Remove from featured")
        ).toBeVisible();

        await page.reload();

        // Verify the same article appears in featured posts
        await expect(
          featuredPostsDiv.getByRole("heading", {
            name: featuredBlogPostTitle,
            level: 3
          })
        ).toBeVisible();
      }
    }
  });

  test("Home page - Unfeature a blog post as a superuser", async ({ page }) => {
    await page.goto("/");
    const featuredPostsDiv = page.getByTestId("featured-posts");

    for (let i = 0; i <= 2; i++) {
      if (
        (await featuredPostsDiv
          .locator("div")
          .nth(i)
          .getByTitle(featuredBlogPostTitle)
          .count()) > 0
      ) {
        await expect(
          featuredPostsDiv
            .locator("div")
            .nth(i)
            .getByTitle("Remove from featured")
        ).toBeVisible();
        await featuredPostsDiv
          .locator("div")
          .nth(i)
          .getByTitle("Remove from featured")
          .click();
        await expect(
          featuredPostsDiv.locator("div").nth(i).getByTitle("Mark as featured")
        ).toBeVisible();

        await page.reload();

        // Verify the same article disappears from featured posts
        await expect(
          featuredPostsDiv.getByRole("heading", {
            name: featuredBlogPostTitle,
            level: 3
          })
        ).toBeHidden();
      }
    }
  });

  test("Home page - Verify that tags are in alphabetical order", async ({
    page
  }) => {
    await page.goto("/");
    const tagsList = page.getByTestId("tags-list");

    const tags = await tagsList.locator("button").allTextContents();
    const sortedTags = [...tags].sort((a, b) => {
      if (a === "All") return -1;
      if (b === "All") return 1;
      return a.localeCompare(b);
    });
    expect(tags).toEqual(sortedTags);
  });

  test("Home page - Verify that tag filtering works", async ({ page }) => {
    await page.goto("/");

    const recentPostsDiv = page.getByTestId("recent-posts");

    // Filter for tag1
    await page
      .getByTestId("tags-list")
      .getByRole("button", { name: "tag1" })
      .click();

    await expect(
      recentPostsDiv.locator("div").nth(0).getByText("tag1", { exact: true })
    ).toBeVisible();
    await expect(
      recentPostsDiv
        .locator("div")
        .nth(0)
        .getByRole("heading", { name: "Blog Post 1", level: 3 })
    ).toBeVisible();

    // Clear the tag filter
    await page
      .getByTestId("tags-list")
      .getByRole("button", { name: "All", exact: true })
      .click();

    await expect(
      recentPostsDiv.locator("div").nth(0).getByText("tag1", { exact: true })
    ).toBeHidden();
    await expect(
      recentPostsDiv
        .locator("div")
        .nth(0)
        .getByRole("heading", { name: "Blog Post 1", level: 3 })
    ).toBeHidden();
  });

  test("Home page - Verify that links to blog posts work as expected", async ({
    page
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "View all posts →" }).click();
    await page.waitForURL("/articles");

    await page.goto("/");
    await page
      .getByTestId("tags-list")
      .getByRole("button", { name: "rolkotech" })
      .click();
    await page.getByRole("button", { name: "View more posts →" }).click();
    await page.waitForURL("/articles?search_by=tag&search_value=rolkotech");
  });

  test("Blog Posts page - Verify that pagination works", async ({ page }) => {
    await createArticle(page, 7);
    await createArticle(page, 8);

    const pagination = page.getByTestId("pagination");
    const blogPostsDiv = page.getByTestId("blogpost-list");

    // There should be no pagination on Blog Posts page
    await page.goto("/articles?search_by=tag&search_value=tag1");
    await expect(pagination).toBeEmpty();

    // There should be pagination on Blog Posts page with filters
    await page.goto("/articles?search_by=tag&search_value=rolkotech");
    await expect(pagination.getByRole("button", { name: "1" })).toBeVisible();
    await expect(pagination.getByRole("button", { name: "2" })).toBeVisible();
    await pagination.getByRole("button", { name: "2" }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    // There should be pagination on Blog Posts page without filters
    await page.goto("/articles");
    await expect(pagination.getByRole("button", { name: "1" })).toBeVisible();
    await expect(pagination.getByRole("button", { name: "2" })).toBeVisible();
    await pagination.getByRole("button", { name: "2" }).click();
    await expect(blogPostsDiv).not.toBeEmpty();
  });
});
