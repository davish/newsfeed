import { describe, it, expect } from "vitest";
import { atomFeedOfPosts } from "../src/rss.js";
import type { Feed, Post } from "../src/rss.js";

// Helper function to create a feed with posts that have feed references
function createFeed(
  title: string,
  url: string,
  postsData: Omit<Post, "feed">[]
): Feed {
  const feed: Feed = {
    title,
    url,
    posts: [],
  };
  feed.posts = postsData.map((postData) => ({
    ...postData,
    feed,
  }));
  return feed;
}

describe("atomFeedOfPosts", () => {
  it("generates valid Atom feed from posts", () => {
    const feed1 = createFeed("Tech Blog", "https://example.com/tech/feed.xml", [
      {
        title: "First Post",
        url: "https://example.com/tech/post1",
        date: new Date("2025-01-01T00:00:00Z"),
        content: "<p>Hello World</p>",
        guid: "https://example.com/tech/post1",
        creator: "John Doe",
      },
    ]);

    feed1.description = "A blog about tech";
    feed1.link = "https://example.com/tech/";

    const xml = atomFeedOfPosts(feed1.posts, "My Combined Feed");

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/tech/feed.xml</id>
        <title>My Combined Feed</title>
        <updated>2025-01-01T00:00:00.000Z</updated>
        <entry>
          <author>
            <name>John Doe</name>
          </author>
          <content>
            <![CDATA[<p>Hello World</p>]]>
          </content>
          <id>https://example.com/tech/post1</id>
          <link href="https://example.com/tech/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/tech/feed.xml</id>
            <link href="https://example.com/tech/"/>
            <subtitle>A blog about tech</subtitle>
            <title>Tech Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>First Post</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("preserves source feed information in atom:source", () => {
    const feed1 = createFeed("Tech Blog", "https://example.com/tech/feed.xml", [
      {
        title: "First Post",
        url: "https://example.com/tech/post1",
        date: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    feed1.description = "A blog about tech";
    feed1.link = "https://example.com/tech/";
    feed1.lastBuildDate = "2025-01-01T12:00:00Z";

    const xml = atomFeedOfPosts(feed1.posts);

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/tech/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-01T00:00:00.000Z</updated>
        <entry>
          <id>https://example.com/tech/post1</id>
          <link href="https://example.com/tech/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/tech/feed.xml</id>
            <link href="https://example.com/tech/"/>
            <subtitle>A blog about tech</subtitle>
            <title>Tech Blog</title>
            <updated>2025-01-01T12:00:00.000Z</updated>
          </source>
          <title>First Post</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("combines posts from multiple feeds with separate sources", () => {
    const feed1 = createFeed("Tech Blog", "https://example.com/tech/feed.xml", [
      {
        title: "Tech Post",
        url: "https://example.com/tech/post1",
        date: new Date("2025-01-01T00:00:00Z"),
      },
    ]);
    feed1.description = "Tech news";

    const feed2 = createFeed("Food Blog", "https://example.com/food/feed.xml", [
      {
        title: "Food Post",
        url: "https://example.com/food/post1",
        date: new Date("2025-01-02T00:00:00Z"),
      },
    ]);
    feed2.description = "Food recipes";

    const allPosts = [...feed1.posts, ...feed2.posts];
    const xml = atomFeedOfPosts(allPosts, "Combined Feed");

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/tech/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-02T00:00:00.000Z</updated>
        <entry>
          <id>https://example.com/tech/post1</id>
          <link href="https://example.com/tech/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/tech/feed.xml</id>
            <subtitle>Tech news</subtitle>
            <title>Tech Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>Tech Post</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
        <entry>
          <id>https://example.com/food/post1</id>
          <link href="https://example.com/food/post1"/>
          <published>2025-01-02T00:00:00.000Z</published>
          <source>
            <id>https://example.com/food/feed.xml</id>
            <subtitle>Food recipes</subtitle>
            <title>Food Blog</title>
            <updated>2025-01-02T00:00:00.000Z</updated>
          </source>
          <title>Food Post</title>
          <updated>2025-01-02T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("handles empty posts array", () => {
    const xml = atomFeedOfPosts([]);

    // Just verify structure since date will vary
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain("<title>Combined Feed</title>");
    expect(xml).toContain("<id>urn:uuid:unknown-feed</id>");
    expect(xml).toContain("<updated>");
    expect(xml).not.toContain("<entry>");
    expect(xml).toContain("</feed>");
  });

  it("escapes XML special characters", () => {
    const feed = createFeed("Blog", "https://example.com/feed.xml", [
      {
        title: 'Post with <special> & "characters"',
        url: "https://example.com/post1",
        date: new Date("2025-01-01T00:00:00Z"),
        content: '<script>alert("XSS")</script>',
      },
    ]);

    const xml = atomFeedOfPosts(feed.posts);

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-01T00:00:00.000Z</updated>
        <entry>
          <content>
            <![CDATA[<script>alert("XSS")</script>]]>
          </content>
          <id>https://example.com/post1</id>
          <link href="https://example.com/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>
            <![CDATA[Post with <special> & "characters"]]>
          </title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("includes all optional post fields when available", () => {
    const feed = createFeed("Blog", "https://example.com/feed.xml", [
      {
        title: "Complete Post",
        url: "https://example.com/post1",
        date: new Date("2025-01-01T00:00:00Z"),
        content: "<p>Full content here</p>",
        guid: "unique-guid-123",
        creator: "Jane Smith",
      },
    ]);

    const xml = atomFeedOfPosts(feed.posts);

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-01T00:00:00.000Z</updated>
        <entry>
          <author>
            <name>Jane Smith</name>
          </author>
          <content>
            <![CDATA[<p>Full content here</p>]]>
          </content>
          <id>unique-guid-123</id>
          <link href="https://example.com/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>Complete Post</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("uses post URL as id when guid is missing", () => {
    const feed = createFeed("Blog", "https://example.com/feed.xml", [
      {
        title: "Post without GUID",
        url: "https://example.com/post1",
        date: new Date("2025-01-01T00:00:00Z"),
      },
    ]);

    const xml = atomFeedOfPosts(feed.posts);

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-01T00:00:00.000Z</updated>
        <entry>
          <id>https://example.com/post1</id>
          <link href="https://example.com/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>Post without GUID</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });

  it("uses most recent post date as feed updated time", () => {
    const feed = createFeed("Blog", "https://example.com/feed.xml", [
      {
        title: "Old Post",
        url: "https://example.com/post1",
        date: new Date("2025-01-01T00:00:00Z"),
      },
      {
        title: "Recent Post",
        url: "https://example.com/post2",
        date: new Date("2025-01-05T00:00:00Z"),
      },
      {
        title: "Middle Post",
        url: "https://example.com/post3",
        date: new Date("2025-01-03T00:00:00Z"),
      },
    ]);

    const xml = atomFeedOfPosts(feed.posts);

    expect(xml).toMatchInlineSnapshot(`
      "<?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <id>https://example.com/feed.xml</id>
        <title>Combined Feed</title>
        <updated>2025-01-05T00:00:00.000Z</updated>
        <entry>
          <id>https://example.com/post1</id>
          <link href="https://example.com/post1"/>
          <published>2025-01-01T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-01T00:00:00.000Z</updated>
          </source>
          <title>Old Post</title>
          <updated>2025-01-01T00:00:00.000Z</updated>
        </entry>
        <entry>
          <id>https://example.com/post2</id>
          <link href="https://example.com/post2"/>
          <published>2025-01-05T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-05T00:00:00.000Z</updated>
          </source>
          <title>Recent Post</title>
          <updated>2025-01-05T00:00:00.000Z</updated>
        </entry>
        <entry>
          <id>https://example.com/post3</id>
          <link href="https://example.com/post3"/>
          <published>2025-01-03T00:00:00.000Z</published>
          <source>
            <id>https://example.com/feed.xml</id>
            <title>Blog</title>
            <updated>2025-01-03T00:00:00.000Z</updated>
          </source>
          <title>Middle Post</title>
          <updated>2025-01-03T00:00:00.000Z</updated>
        </entry>
      </feed>
      "
    `);
  });
});
