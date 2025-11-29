import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseOPML } from "../src/opml.js";

describe("parseOPML", () => {
  it("extracts feeds correctly", () => {
    const xmlContent = readFileSync("test/example.opml", "utf-8");
    const result = parseOPML(xmlContent);

    expect(result).toMatchInlineSnapshot(`
      {
        "dateCreated": "Mon, 01 Jan 2024 12:00:00 +0000",
        "feeds": [
          {
            "htmlUrl": "https://xkcd.com/",
            "text": "xkcd.com",
            "title": "xkcd.com",
            "xmlUrl": "https://xkcd.com/rss.xml",
          },
          {
            "htmlUrl": "http://jvns.ca",
            "text": "Julia Evans",
            "title": "Julia Evans",
            "xmlUrl": "https://jvns.ca/atom.xml",
          },
          {
            "htmlUrl": "https://danluu.com/atom/index.xml",
            "text": "Dan Luu",
            "title": "Dan Luu",
            "xmlUrl": "https://danluu.com/atom.xml",
          },
        ],
        "ownerEmail": "test@example.com",
        "title": "Test RSS Subscriptions",
      }
    `);
  });

  it("handles empty OPML", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Empty OPML</title>
  </head>
  <body>
  </body>
</opml>`;

    const result = parseOPML(xmlContent);
    expect(result).toMatchInlineSnapshot(`
      {
        "dateCreated": undefined,
        "feeds": [],
        "ownerEmail": undefined,
        "title": "Empty OPML",
      }
    `);
  });

  it("filters non-RSS outlines and handles nested outlines", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Mixed OPML</title>
  </head>
  <body>
    <outline text="RSS Feed" title="RSS Feed" type="rss" xmlUrl="https://example.com/rss.xml"/>
    <outline text="Folder" title="Folder" type="folder">
      <outline text="Nested RSS" title="Nested RSS" type="rss" xmlUrl="https://example.com/nested.xml"/>
    </outline>
  </body>
</opml>`;

    const result = parseOPML(xmlContent);
    expect(result).toMatchInlineSnapshot(`
      {
        "dateCreated": undefined,
        "feeds": [
          {
            "htmlUrl": undefined,
            "text": "RSS Feed",
            "title": "RSS Feed",
            "xmlUrl": "https://example.com/rss.xml",
          },
          {
            "htmlUrl": undefined,
            "text": "Nested RSS",
            "title": "Nested RSS",
            "xmlUrl": "https://example.com/nested.xml",
          },
        ],
        "ownerEmail": undefined,
        "title": "Mixed OPML",
      }
    `);
  });

  it("handles feeds without htmlUrl", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>No HTML URL</title>
  </head>
  <body>
    <outline text="Feed" title="Feed" type="rss" xmlUrl="https://example.com/feed.xml"/>
  </body>
</opml>`;

    const result = parseOPML(xmlContent);
    expect(result).toMatchInlineSnapshot(`
      {
        "dateCreated": undefined,
        "feeds": [
          {
            "htmlUrl": undefined,
            "text": "Feed",
            "title": "Feed",
            "xmlUrl": "https://example.com/feed.xml",
          },
        ],
        "ownerEmail": undefined,
        "title": "No HTML URL",
      }
    `);
  });

  it("uses text as fallback for title", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Fallback Title</title>
  </head>
  <body>
    <outline text="Feed Text" type="rss" xmlUrl="https://example.com/feed.xml"/>
  </body>
</opml>`;

    const result = parseOPML(xmlContent);
    expect(result).toMatchInlineSnapshot(`
      {
        "dateCreated": undefined,
        "feeds": [
          {
            "htmlUrl": undefined,
            "text": "Feed Text",
            "title": "Feed Text",
            "xmlUrl": "https://example.com/feed.xml",
          },
        ],
        "ownerEmail": undefined,
        "title": "Fallback Title",
      }
    `);
  });
});
