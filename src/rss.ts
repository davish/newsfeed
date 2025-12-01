import { generateAtomFeed, parseFeed as parseFeedsmith } from "feedsmith";
import type { Atom, Rss } from "feedsmith/types";

export interface Feed {
  title: string;
  description?: string;
  link?: string;
  url: string;
  lastBuildDate?: string;
  posts: Post[];
}

export interface Post {
  title: string;
  date?: Date;
  url: string;
  content?: string;
  guid?: string;
  creator?: string;
  feed: Feed;
}

function convertFeedsmithToFeed(
  parsed: Awaited<ReturnType<typeof parseFeedsmith>>,
  feedUrl: string
): Feed {
  const feedsmith = parsed.feed;

  const result: Feed = {
    title: feedsmith.title || "",
    posts: [],
    url: feedUrl,
  };

  // Handle description/subtitle
  if ("subtitle" in feedsmith && feedsmith.subtitle) {
    result.description = feedsmith.subtitle;
  } else if ("description" in feedsmith && feedsmith.description) {
    result.description = feedsmith.description;
  }

  // Handle link
  if ("links" in feedsmith && feedsmith.links && feedsmith.links.length > 0) {
    const firstLink = feedsmith.links[0];
    if (firstLink?.href !== undefined) {
      result.link = firstLink.href;
    }
  } else if ("link" in feedsmith && feedsmith.link) {
    result.link = feedsmith.link;
  }

  // Handle lastBuildDate
  if ("updated" in feedsmith && feedsmith.updated) {
    const updated = feedsmith.updated;
    result.lastBuildDate =
      typeof updated === "string" ? updated : (updated as Date).toISOString();
  } else if ("lastBuildDate" in feedsmith && feedsmith.lastBuildDate) {
    const lastBuildDate = feedsmith.lastBuildDate;
    result.lastBuildDate =
      typeof lastBuildDate === "string"
        ? lastBuildDate
        : (lastBuildDate as Date).toISOString();
  }

  // Convert entries/items to posts
  // Handle both Atom entries and RSS items
  type EntryOrItem =
    | Atom.Entry<string>
    | Rss.Item<string>
    | (Atom.Entry<string> & { links?: Array<Atom.Link<string>> });

  const entries: EntryOrItem[] | undefined =
    "entries" in feedsmith
      ? (feedsmith.entries as EntryOrItem[])
      : "items" in feedsmith
      ? (feedsmith.items as EntryOrItem[])
      : undefined;

  if (entries) {
    result.posts = entries.map((entry) => {
      const post: Post = {
        title: entry.title || "",
        url: "",
        feed: result,
      };

      // Extract URL from links (Atom) or link (RSS)
      if (
        "links" in entry &&
        Array.isArray(entry.links) &&
        entry.links.length > 0
      ) {
        const firstLink = entry.links[0];
        if (firstLink && typeof firstLink === "object" && "href" in firstLink) {
          const href = firstLink.href;
          if (typeof href === "string") {
            post.url = href;
          }
        }
      } else if ("link" in entry && typeof entry.link === "string") {
        post.url = entry.link;
      }

      // Add date - handle both Atom and RSS date fields
      if ("updated" in entry && entry.updated) {
        const updated = entry.updated;
        post.date = typeof updated === "string" ? new Date(updated) : updated;
      } else if ("published" in entry && entry.published) {
        const published = entry.published;
        post.date =
          typeof published === "string" ? new Date(published) : published;
      } else if ("pubDate" in entry && entry.pubDate) {
        const pubDate = entry.pubDate;
        post.date = typeof pubDate === "string" ? new Date(pubDate) : pubDate;
      }

      // Add content
      if ("content" in entry && entry.content) {
        post.content =
          typeof entry.content === "string"
            ? entry.content
            : String(entry.content);
      } else if ("description" in entry && entry.description) {
        post.content =
          typeof entry.description === "string"
            ? entry.description
            : String(entry.description);
      }

      // Add guid/id
      if ("id" in entry && entry.id) {
        post.guid = typeof entry.id === "string" ? entry.id : String(entry.id);
      } else if ("guid" in entry && entry.guid) {
        const guid = entry.guid;
        post.guid = typeof guid === "string" ? guid : guid.value;
      }

      // Add creator/author
      if ("authors" in entry && entry.authors && entry.authors.length > 0) {
        const firstAuthor = entry.authors[0];
        if (firstAuthor) {
          if (typeof firstAuthor === "string") {
            post.creator = firstAuthor;
          } else if (
            typeof firstAuthor === "object" &&
            "name" in firstAuthor &&
            typeof firstAuthor.name === "string"
          ) {
            post.creator = firstAuthor.name;
          }
        }
      } else if ("creator" in entry && typeof entry.creator === "string") {
        post.creator = entry.creator;
      }

      return post;
    });
  }

  return result;
}

/**
 * Parses an RSS feed from XML string content
 * @param xmlContent - XML content of the RSS feed
 * @returns Parsed RSS feed with all posts
 */
export async function parseRSSString(
  xmlContent: string,
  feedUrl: string
): Promise<Feed> {
  const parsed = await parseFeedsmith(xmlContent);
  return convertFeedsmithToFeed(parsed, feedUrl);
}

/**
 * Fetches and parses an RSS feed from a URL
 * @param url - URL of the RSS feed to fetch
 * @returns Parsed RSS feed with all posts
 */
export async function fetchRSSFeed(url: string): Promise<Feed> {
  const response = await fetch(url);
  const xmlContent = await response.text();
  return parseRSSString(xmlContent, url);
}

/**
 * Generates an Atom feed XML string from a list of posts
 * Preserves original feed information using atom:source elements
 * @param posts - Array of posts from potentially multiple feeds
 * @param feedTitle - Title for the generated feed
 * @param feedId - Unique identifier for the generated feed (defaults to first post's feed URL)
 * @returns Atom feed XML string
 */
export function atomFeedOfPosts(
  posts: Post[],
  feedTitle: string = "Combined Feed",
  feedId?: string
): string {
  // Find the most recent post date for the feed's updated element
  const mostRecentDate =
    posts
      .map((p) => p.date)
      .filter((d): d is Date => d !== undefined)
      .sort((a, b) => b.getTime() - a.getTime())[0] || new Date();

  const feedIdValue = feedId || posts[0]?.feed.url || "urn:uuid:unknown-feed";

  // Convert posts to Atom entries
  const entries: Atom.Entry<Date>[] = posts.map((post) => {
    const entry: Atom.Entry<Date> = {
      id: post.guid || post.url,
      title: post.title,
      updated: post.date || new Date(),
      links: [{ href: post.url }],
    };

    // Add published date
    if (post.date) {
      entry.published = post.date;
    }

    // Add author
    if (post.creator) {
      entry.authors = [{ name: post.creator }];
    }

    // Add content
    if (post.content) {
      entry.content = post.content;
    }

    // Add source to preserve original feed metadata
    const source: Atom.Source<Date> = {
      id: post.feed.url,
      title: post.feed.title,
    };

    if (post.feed.link) {
      source.links = [{ href: post.feed.link }];
    }

    if (post.feed.description) {
      source.subtitle = post.feed.description;
    }

    // Use feed's lastBuildDate or the post's date as source updated
    if (post.feed.lastBuildDate) {
      try {
        source.updated = new Date(post.feed.lastBuildDate);
      } catch {
        // If lastBuildDate can't be parsed, use post date
        if (post.date) {
          source.updated = post.date;
        }
      }
    } else if (post.date) {
      source.updated = post.date;
    }

    entry.source = source;

    return entry;
  });

  // Create the Atom feed structure
  const atomFeed: Atom.Feed<Date> = {
    id: feedIdValue,
    title: feedTitle,
    updated: mostRecentDate,
    entries,
  };

  // Generate XML using feedsmith
  return generateAtomFeed(atomFeed);
}
