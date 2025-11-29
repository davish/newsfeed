import RSSParser from "rss-parser";

export interface Post {
  title: string;
  date?: Date;
  url: string;
  content?: string;
  guid?: string;
  creator?: string;
}

export interface Feed {
  title: string;
  description?: string;
  link?: string;
  feedUrl?: string;
  lastBuildDate?: string;
  posts: Post[];
}

function parseFeed(feed: RSSParser.Output<{}>): Feed {
  const posts: Post[] = (feed.items || []).map((item) => {
    const post: Post = {
      title: item.title || "",
      url: item.link || "",
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

  const result: Feed = {
    title: feed.title || "",
    posts,
  };
  if (feed.description) result.description = feed.description;
  if (feed.link) result.link = feed.link;
  if (feed.feedUrl) result.feedUrl = feed.feedUrl;
  if ("lastBuildDate" in feed && feed.lastBuildDate) {
    result.lastBuildDate = feed.lastBuildDate as string;
  }
  return result;
}

/**
 * Parses an RSS feed from XML string content
 * @param xmlContent - XML content of the RSS feed
 * @returns Parsed RSS feed with all posts
 */
export async function parseRSSString(xmlContent: string): Promise<Feed> {
  const parser = new RSSParser();
  const feed = await parser.parseString(xmlContent);
  return parseFeed(feed);
}

/**
 * Fetches and parses an RSS feed from a URL
 * @param url - URL of the RSS feed to fetch
 * @returns Parsed RSS feed with all posts
 */
export async function fetchRSSFeed(url: string): Promise<Feed> {
  const parser = new RSSParser();
  const feed = await parser.parseURL(url);
  return parseFeed(feed);
}
