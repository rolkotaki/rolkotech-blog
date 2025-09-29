import { test, expect } from "@playwright/test";
import {
  createArticle,
  loginSuperuser,
  loginTestUser,
  logout,
  TEST_IMAGE,
  testConfig
} from "./helpers/helper";

test.describe.serial("Blog Posts Tests", () => {
  test("Blog Posts page loads with minimum required elements", async ({
    page
  }) => {
    await page.goto("/articles");

    await expect(page.getByPlaceholder("Search articles...")).toBeVisible();
    const searchByFilter = page.locator('select[name="searchBy"]');
    await expect(searchByFilter).toBeVisible();
    await expect(searchByFilter.locator('option[value="title"]')).toHaveText(
      "Title"
    );
    await expect(searchByFilter.locator('option[value="tag"]')).toHaveText(
      "Tag"
    );
    await expect(searchByFilter.locator('option[value="content"]')).toHaveText(
      "Content"
    );
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeVisible();
  });

  test("Blog Posts page search buttons work as expected", async ({ page }) => {
    await page.goto("/articles");

    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Clear", exact: true })
    ).toBeHidden();

    await page.getByPlaceholder("Search articles...").fill("anything");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Clear", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Clear", exact: true })
    ).toBeEnabled();

    await page.getByRole("button", { name: "Clear", exact: true }).click();

    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Clear", exact: true })
    ).toBeHidden();
  });

  test("Blog Posts page searching works", async ({ page }) => {
    await createArticle(page, 6);
    await page.goto("/articles");

    const blogPostsDiv = page.getByTestId("blogpost-list");
    const searchByFilter = page.locator('select[name="searchBy"]');

    // Search by title
    await page.waitForTimeout(100);
    await searchByFilter.selectOption("title");
    await expect(searchByFilter).toHaveValue("title");
    await page.getByPlaceholder("Search articles...").fill("Blog Post X");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).toBeEmpty();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    await page.waitForTimeout(100);
    await searchByFilter.selectOption("title");
    await expect(searchByFilter).toHaveValue("title");
    await page.getByPlaceholder("Search articles...").fill("Blog Post 6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();
    await expect(
      blogPostsDiv.getByRole("heading", { name: "Blog Post 6" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    // Search by tag
    await page.waitForTimeout(100);
    await searchByFilter.selectOption("tag");
    await expect(searchByFilter).toHaveValue("tag");
    await page.getByPlaceholder("Search articles...").fill("tagx");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).toBeEmpty();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    await page.waitForTimeout(100);
    await searchByFilter.selectOption("tag");
    await expect(searchByFilter).toHaveValue("tag");
    await page.getByPlaceholder("Search articles...").fill("tag6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();
    await expect(
      blogPostsDiv.getByRole("heading", { name: "Blog Post 6" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    // Search by content
    await page.waitForTimeout(100);
    await searchByFilter.selectOption("content");
    await expect(searchByFilter).toHaveValue("content");
    await page.getByPlaceholder("Search articles...").fill("Blog Post X");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).toBeEmpty();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();

    await page.waitForTimeout(100);
    await searchByFilter.selectOption("content");
    await expect(searchByFilter).toHaveValue("content");
    await page.getByPlaceholder("Search articles...").fill("Blog Post 6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();
    await expect(
      blogPostsDiv.getByRole("heading", { name: "Blog Post 6" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear", exact: true }).click();
    await expect(blogPostsDiv).not.toBeEmpty();
  });

  test("Blog Posts - Featured toggle is visible for superusers", async ({
    page
  }) => {
    await page.goto("/articles");
    const blogPostsDiv = page.getByTestId("blogpost-list");
    const searchByFilter = page.locator('select[name="searchBy"]');
    await searchByFilter.selectOption("tag");
    await expect(searchByFilter).toHaveValue("tag");
    await page.waitForTimeout(100);
    await page.getByPlaceholder("Search articles...").fill("tag6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(
      blogPostsDiv.locator("div").nth(0).getByTitle("Mark as featured")
    ).toBeHidden();

    await loginSuperuser(page);
    await page.goto("/articles");

    await searchByFilter.selectOption("tag");
    await page.getByPlaceholder("Search articles...").fill("tag6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await expect(
      blogPostsDiv.locator("div").nth(0).getByTitle("Mark as featured")
    ).toBeVisible();
    await blogPostsDiv
      .locator("div")
      .nth(0)
      .getByTitle("Mark as featured")
      .click();
    await expect(
      blogPostsDiv.locator("div").nth(0).getByTitle("Remove from featured")
    ).toBeVisible();
  });

  test("Blog Post page loads with required elements", async ({ page }) => {
    const todaysDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });

    await page.goto("/articles");
    const blogPostsDiv = page.getByTestId("blogpost-list");
    const searchByFilter = page.locator('select[name="searchBy"]');
    await searchByFilter.selectOption("tag");
    await expect(searchByFilter).toHaveValue("tag");
    await page.waitForTimeout(100);
    await page.getByPlaceholder("Search articles...").fill("tag6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();

    await blogPostsDiv.locator("div").nth(0).click();
    await page.waitForURL("/articles/blog-post-6");

    await expect(
      page.getByRole("heading", { name: "Blog Post 6", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(`${todaysDate}`)).toBeVisible();
    await expect(
      page.getByTestId("blogpost-tags").getByText("rolkotech")
    ).toBeVisible();
    await expect(
      page.getByTestId("blogpost-tags").getByText("tag6")
    ).toBeVisible();
    await expect(page.getByAltText("Blog Post 6")).toBeVisible();
    await expect(
      page.locator("article").getByText("This is the content of Blog Post 6.")
    ).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Comments (0)", level: 2 })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Leave a comment...")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Post Comment" })
    ).toBeHidden();
    await expect(
      page.getByText("Want to join the conversation?")
    ).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: "Log in" })
    ).toBeVisible();
    await expect(
      page.locator("main").getByRole("link", { name: "sign up" })
    ).toBeVisible();
    await expect(
      page.getByText("No comments yet. Be the first to share your thoughts!")
    ).toBeVisible();

    // Edit and Delete buttons are only visible for superusers
    await expect(page.getByRole("button", { name: "Edit" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Delete" })).toBeHidden();
    await loginSuperuser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  test("Users can comment on the blog post", async ({ page }) => {
    await loginTestUser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });

    await expect(
      page.getByRole("heading", { name: "Comments (0)", level: 2 })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Leave a comment...")).toBeVisible();
    await expect(page.getByText("0/1000 characters")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Post Comment" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Post Comment" })
    ).toBeDisabled();
    await expect(
      page.getByText("No comments yet. Be the first to share your thoughts!")
    ).toBeVisible();

    const commentsDiv = page.getByTestId("comments");
    const todaysDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });

    // Add a comment
    await page
      .getByPlaceholder("Leave a comment...")
      .fill("This is a comment by Test User.");
    await expect(page.getByText("31/1000 characters")).toBeVisible();
    await page.getByRole("button", { name: "Post Comment" }).click();

    await expect(
      page.getByRole("heading", { name: "Comments (1)", level: 2 })
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByText(testConfig.testUserName.charAt(0).toUpperCase(), {
          exact: true
        })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByText("You")
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByText(`${todaysDate}`)
    ).toBeVisible();

    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByText("This is a comment by Test User.")
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Reply" })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Edit" })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Delete" })
    ).toBeVisible();

    // Add a reply
    await commentsDiv
      .locator("div")
      .first()
      .getByRole("button", { name: "Reply" })
      .click();

    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(1)
    ).toBeVisible();
    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(1)
    ).toBeDisabled();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeVisible();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeEnabled();

    await expect(
      commentsDiv.locator("div").first().getByPlaceholder("Write a reply...")
    ).toBeVisible();
    await commentsDiv
      .locator("div")
      .first()
      .getByPlaceholder("Write a reply...")
      .fill("This is a reply by Test User.");
    await expect(
      commentsDiv.locator("div").first().getByText("29/1000 characters")
    ).toBeVisible();

    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(1)
    ).toBeEnabled();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeEnabled();

    await commentsDiv.getByRole("button", { name: "Reply" }).nth(1).click();

    await expect(
      commentsDiv
        .locator("div")
        .first()
        .locator("div")
        .nth(1)
        .getByText(testConfig.testUserName.charAt(0).toUpperCase(), {
          exact: true
        })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().locator("div").nth(1).getByText("You")
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div")
        .first()
        .locator("div")
        .nth(1)
        .getByText(`${todaysDate}`)
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByRole("button", { name: "Edit" })
        .nth(1)
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByRole("button", { name: "Delete" })
        .nth(1)
    ).toBeVisible();
  });

  test("Another user can comment and reply on the blog post", async ({
    page
  }) => {
    await loginSuperuser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });

    const commentsDiv = page.getByTestId("comments");
    const todaysDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    });

    // Add a comment
    await page
      .getByPlaceholder("Leave a comment...")
      .fill("This is a comment by Superuser.");
    await expect(page.getByText("31/1000 characters")).toBeVisible();
    await page.getByRole("button", { name: "Post Comment" }).click();

    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByText(testConfig.superuserName.charAt(0).toUpperCase(), {
          exact: true
        })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByText("You")
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByText(`${todaysDate}`)
    ).toBeVisible();

    await expect(
      commentsDiv
        .locator("div")
        .first()
        .getByText("This is a comment by Superuser.")
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Reply" })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Edit" })
    ).toBeVisible();
    await expect(
      commentsDiv.locator("div").first().getByRole("button", { name: "Delete" })
    ).toBeVisible();

    // Add a reply
    await commentsDiv
      .locator("div.mb-6")
      .nth(1)
      .getByRole("button", { name: "Reply" })
      .click();

    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(2)
    ).toBeVisible();
    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(2)
    ).toBeDisabled();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeVisible();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeEnabled();

    await expect(
      commentsDiv
        .locator("div.mb-6")
        .nth(1)
        .getByPlaceholder("Write a reply...")
    ).toBeVisible();
    await commentsDiv
      .locator("div.mb-6")
      .nth(1)
      .getByPlaceholder("Write a reply...")
      .fill("This is a reply by Superuser.");
    await expect(
      commentsDiv.locator("div.mb-6").nth(1).getByText("29/1000 characters")
    ).toBeVisible();

    await expect(
      commentsDiv.getByRole("button", { name: "Reply" }).nth(2)
    ).toBeEnabled();
    await expect(
      commentsDiv.getByRole("button", { name: "Cancel" })
    ).toBeEnabled();

    await commentsDiv.getByRole("button", { name: "Reply" }).nth(2).click();

    await expect(
      commentsDiv
        .locator("div.mb-6")
        .nth(1)
        .locator(".space-y-3 > div")
        .nth(1)
        .getByText(testConfig.superuserName.charAt(0).toUpperCase(), {
          exact: true
        })
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div.mb-6")
        .nth(1)
        .locator(".space-y-3 > div")
        .nth(1)
        .getByText("You")
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div.mb-6")
        .nth(1)
        .locator(".space-y-3 > div")
        .nth(1)
        .getByRole("button", { name: "Edit" })
    ).toBeVisible();
    await expect(
      commentsDiv
        .locator("div.mb-6")
        .nth(1)
        .locator(".space-y-3 > div")
        .nth(1)
        .getByRole("button", { name: "Delete" })
    ).toBeVisible();
  });

  test("Comment buttons as visible/hidden as epected", async ({ page }) => {
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });
    const commentsDiv = page.getByTestId("comments");

    // Not logged in
    let count: number = await commentsDiv
      .getByRole("button", { name: "Delete" })
      .count();
    expect(count).toBe(0);
    count = await commentsDiv.getByRole("button", { name: "Edit" }).count();
    expect(count).toBe(0);
    count = await commentsDiv.getByRole("button", { name: "Reply" }).count();
    expect(count).toBe(0);

    // Logged in as user
    await loginTestUser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });
    count = await commentsDiv.getByRole("button", { name: "Delete" }).count();
    expect(count).toBe(2);
    count = await commentsDiv.getByRole("button", { name: "Edit" }).count();
    expect(count).toBe(2);
    count = await commentsDiv.getByRole("button", { name: "Reply" }).count();
    expect(count).toBe(2);
    await logout(page);

    // Logged in as superuser
    await loginSuperuser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });
    count = await commentsDiv.getByRole("button", { name: "Delete" }).count();
    expect(count).toBe(4);
    count = await commentsDiv.getByRole("button", { name: "Edit" }).count();
    expect(count).toBe(2);
    count = await commentsDiv.getByRole("button", { name: "Reply" }).count();
    expect(count).toBe(2);
  });

  test("Superuser can edit the blog post", async ({ page }) => {
    await loginSuperuser(page);
    await page.goto("/articles/blog-post-6");
    await page.waitForLoadState("networkidle", { timeout: 3000 });
    const image_filename: string = TEST_IMAGE.split("/").pop() || "";
    const todaysDate = new Date().toISOString().split("T")[0];
    const yesterdaysDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    const yestserdaysDateFormatted = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC"
    });

    await expect(
      page.getByRole("button", { name: "Edit" }).first()
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).first().click();

    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "Edit" }).first().click();

    // Verify that the form is pre-filled with existing data
    await expect(page.getByLabel("Title")).toHaveValue("Blog Post 6");
    await expect(page.getByLabel("URL Slug")).toHaveValue("blog-post-6");
    await expect(page.getByLabel("Content")).toHaveValue(
      "This is the content of Blog Post 6."
    );
    await expect(page.getByLabel("Tags")).toHaveValue("rolkotech,tag6");
    await expect(page.getByLabel("Blog Post Image")).toHaveValue(
      image_filename
    );
    await expect(page.getByLabel("Publication Date")).toHaveValue(todaysDate);
    await expect(page.getByLabel("Mark as featured")).toBeChecked();

    // Edit the blog post
    await page.getByLabel("Title").fill("Blog Post 6 - Edited");
    await page.getByLabel("URL Slug").fill("blog-post-6-edited");
    await page
      .getByLabel("Content")
      .fill("This is the edited content of Blog Post 6.");
    await page.getByLabel("Tags").fill("rolkotech,tag6edited,newtag");
    await page.getByLabel("Publication Date").fill(yesterdaysDate);
    await page.getByLabel("Mark as featured").uncheck();

    // Save the changes
    await page.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForURL("/articles/blog-post-6-edited");

    // Verify that the changes are reflected on the blog post page
    await expect(
      page.getByRole("heading", { name: "Blog Post 6 - Edited", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(`${yestserdaysDateFormatted}`)).toBeVisible();
    await expect(
      page.getByTestId("blogpost-tags").getByText("rolkotech")
    ).toBeVisible();
    await expect(
      page.getByTestId("blogpost-tags").getByText("tag6edited")
    ).toBeVisible();
    await expect(
      page.getByTestId("blogpost-tags").getByText("newtag")
    ).toBeVisible();
    await expect(
      page
        .locator("article")
        .getByText("This is the edited content of Blog Post 6.")
    ).toBeVisible();
  });

  test("Superuser can delete the blog post", async ({ page }) => {
    await loginSuperuser(page);
    await page.goto("/articles/blog-post-6-edited");

    await expect(
      page.getByRole("button", { name: "Delete" }).first()
    ).toBeVisible();

    // Handle confirm dialog
    let dialogHandled = false;
    page.on("dialog", async (dialog) => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toBe(
        "Are you sure you want to delete this blog post? This action cannot be undone."
      );
      await dialog.accept();
      dialogHandled = true;
    });

    await page
      .getByRole("button", { name: "Delete" })
      .first()
      .click({ noWaitAfter: true, timeout: 5000 });
    await expect(() => expect(dialogHandled).toBe(true)).toPass({
      timeout: 5000
    });

    // Verify that the blog post is deleted
    await page.waitForURL("/articles");
    const searchByFilter = page.locator('select[name="searchBy"]');
    const blogPostsDiv = page.getByTestId("blogpost-list");

    await page.waitForTimeout(100);
    await searchByFilter.selectOption("title");
    await expect(searchByFilter).toHaveValue("title");
    await page.waitForTimeout(100);
    await page.getByPlaceholder("Search articles...").fill("Blog Post 6");
    await expect(
      page.getByRole("button", { name: "Search", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(blogPostsDiv).toBeEmpty();
  });
});
