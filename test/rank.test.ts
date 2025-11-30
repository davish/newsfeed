import { describe, it, expect } from "vitest";
import { rankPosts } from "../src/rank.js";
import type { Feed, Post } from "../src/rss.js";

// Helper function to create a feed with posts that have feed references
function createFeed(
  title: string,
  url: string,
  postsData: Omit<Post, "feed" | "feedUrl">[]
): Feed {
  const feed: Feed = {
    title,
    url,
    posts: [],
  };
  feed.posts = postsData.map((postData) => ({
    ...postData,
    feedUrl: url,
    feed,
  }));
  return feed;
}

describe("rankPosts", () => {
  it("ranks posts from multiple feeds correctly", () => {
    const baseTime = new Date("2025-01-01T00:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Feed 1: posts every 2 days (average interval = 2 days)
    const feed1 = createFeed("Feed 1", "https://example.com/feed1.xml", [
      {
        title: "Post 1-1",
        url: "https://example.com/post1-1",
        date: new Date(baseTime - 4 * dayMs), // 4 days ago
      },
      {
        title: "Post 1-2",
        url: "https://example.com/post1-2",
        date: new Date(baseTime - 2 * dayMs), // 2 days ago
      },
      {
        title: "Post 1-3",
        url: "https://example.com/post1-3",
        date: new Date(baseTime), // today
      },
    ]);

    // Feed 2: posts every 1 day (average interval = 1 day)
    const feed2 = createFeed("Feed 2", "https://example.com/feed2.xml", [
      {
        title: "Post 2-1",
        url: "https://example.com/post2-1",
        date: new Date(baseTime - 1 * dayMs), // 1 day ago
      },
    ]);

    const ranked = rankPosts([feed1, feed2]);

    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post 1-3",
        "Post 1-2",
        "Post 2-1",
        "Post 1-1",
      ]
    `);
  });

  it("handles posts without dates by placing them at the start", () => {
    const baseTime = new Date("2025-01-01T00:00:00Z").getTime();

    const feed = createFeed("Feed", "https://example.com/feed.xml", [
      {
        title: "Post with date",
        url: "https://example.com/post1",
        date: new Date(baseTime),
      },
      {
        title: "Post without date",
        url: "https://example.com/post2",
      },
    ]);

    const ranked = rankPosts([feed]);
    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post without date",
        "Post with date",
      ]
    `);
  });

  it("handles feeds with fewer than 2 posts (null average interval)", () => {
    const baseTime = new Date("2025-01-01T00:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Feed with only 1 post (can't calculate average)
    const feed1 = createFeed("Feed 1", "https://example.com/feed1.xml", [
      {
        title: "Post 1-1",
        url: "https://example.com/post1-1",
        date: new Date(baseTime - 1 * dayMs),
      },
    ]);

    // Feed with 2 posts (can calculate average)
    const feed2 = createFeed("Feed 2", "https://example.com/feed2.xml", [
      {
        title: "Post 2-1",
        url: "https://example.com/post2-1",
        date: new Date(baseTime - 3 * dayMs),
      },
      {
        title: "Post 2-2",
        url: "https://example.com/post2-2",
        date: new Date(baseTime - 1 * dayMs),
      },
    ]);

    const ranked = rankPosts([feed1, feed2]);

    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post 2-2",
        "Post 1-1",
        "Post 2-1",
      ]
    `);
  });

  it("handles empty feeds", () => {
    const feed1: Feed = {
      title: "Empty Feed",
      url: "https://example.com/feed1.xml",
      posts: [],
    };

    const feed2 = createFeed(
      "Feed with posts",
      "https://example.com/feed2.xml",
      [
        {
          title: "Post",
          url: "https://example.com/post",
          date: new Date("2025-01-01T00:00:00Z"),
        },
      ]
    );

    const ranked = rankPosts([feed1, feed2]);
    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post",
      ]
    `);
  });

  it("handles all posts without dates", () => {
    const feed = createFeed("Feed", "https://example.com/feed.xml", [
      {
        title: "Post 1",
        url: "https://example.com/post1",
      },
      {
        title: "Post 2",
        url: "https://example.com/post2",
      },
    ]);

    const ranked = rankPosts([feed]);
    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post 1",
        "Post 2",
      ]
    `);
  });

  it("handles feed with posts that have some dates missing", () => {
    const baseTime = new Date("2025-01-01T00:00:00Z").getTime();

    const feed = createFeed("Feed", "https://example.com/feed.xml", [
      {
        title: "Post with date",
        url: "https://example.com/post1",
        date: new Date(baseTime),
      },
      {
        title: "Post without date 1",
        url: "https://example.com/post2",
      },
      {
        title: "Post without date 2",
        url: "https://example.com/post3",
      },
    ]);

    const ranked = rankPosts([feed]);
    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Post without date 1",
        "Post without date 2",
        "Post with date",
      ]
    `);
  });

  it("correctly calculates ranking score as date + average interval", () => {
    const baseTime = new Date("2025-01-01T00:00:00Z").getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Feed with average interval of 3 days
    const feed = createFeed("Feed", "https://example.com/feed.xml", [
      {
        title: "Old post",
        url: "https://example.com/old",
        date: new Date(baseTime - 6 * dayMs), // 6 days ago
      },
      {
        title: "Recent post",
        url: "https://example.com/recent",
        date: new Date(baseTime - 3 * dayMs), // 3 days ago
      },
      {
        title: "Latest post",
        url: "https://example.com/latest",
        date: new Date(baseTime), // today
      },
    ]);

    const ranked = rankPosts([feed]);

    expect(ranked.map((p) => p.title)).toMatchInlineSnapshot(`
      [
        "Latest post",
        "Recent post",
        "Old post",
      ]
    `);
  });
});
