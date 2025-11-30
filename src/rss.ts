import RSSParser from "rss-parser";
import { generateAtomFeed } from "feedsmith";
import type { Atom } from "feedsmith/types";

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

function parseFeed(feed: RSSParser.Output<{}>, url: string): Feed {
  // Create the Feed object first (with empty posts array temporarily)
  const result: Feed = {
    title: feed.title || "",
    posts: [],
    url,
  };
  if (feed.description) result.description = feed.description;
  if (feed.link) result.link = feed.link;
  if ("lastBuildDate" in feed && feed.lastBuildDate) {
    result.lastBuildDate = feed.lastBuildDate as string;
  }

  // Now create posts with reference to the feed
  const posts: Post[] = (feed.items || []).map((item) => {
    const post: Post = {
      title: item.title || "",
      url: item.link || "",
      feed: result,
    };
    if (item.content) post.content = item.content;
    if (item.guid) post.guid = item.guid;
    if (item.isoDate) {
      const parsedDate = new Date(item.isoDate);
      if (!isNaN(parsedDate.getTime())) {
        post.date = parsedDate;
      }
    }
    if (item.creator) post.creator = item.creator;
    return post;
  });

  // Assign posts to the feed
  result.posts = posts;
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
  const parser = new RSSParser();
  const feed = await parser.parseString(xmlContent);
  return parseFeed(feed, feedUrl);
}

/**
 * Fetches and parses an RSS feed from a URL
 * @param url - URL of the RSS feed to fetch
 * @returns Parsed RSS feed with all posts
 */
export async function fetchRSSFeed(url: string): Promise<Feed> {
  const parser = new RSSParser();
  const feed = await parser.parseURL(url);
  return parseFeed(feed, url);
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
