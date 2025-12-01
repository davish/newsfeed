import { parseOpml } from "feedsmith";

export interface Feed {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  text?: string;
}

export interface Data {
  title?: string;
  dateCreated?: string;
  ownerEmail?: string;
  feeds: Feed[];
}

/**
 * Parses OPML content from a string
 * @param xmlContent - OPML XML content as a string
 * @returns Parsed OPML data with feed information
 */
type ParsedOutline = {
  text?: string;
  type?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  title?: string;
  outlines?: Array<ParsedOutline>;
};

export function parseOPML(xmlContent: string): Data {
  const parsed = parseOpml(xmlContent);

  const feeds: Feed[] = [];

  function extractFeeds(outlines?: Array<ParsedOutline>): void {
    if (!outlines) return;

    for (const outline of outlines) {
      // Check if this outline has an xmlUrl and is a feed
      if (outline.xmlUrl && (outline.type === "rss" || !outline.type)) {
        const feed: Feed = {
          title: outline.title || outline.text || "",
          xmlUrl: outline.xmlUrl,
        };
        if (outline.text !== undefined) {
          feed.text = outline.text;
        }
        if (outline.htmlUrl !== undefined) {
          feed.htmlUrl = outline.htmlUrl;
        }
        feeds.push(feed);
      }

      // Recursively process nested outlines
      if (outline.outlines) {
        extractFeeds(outline.outlines);
      }
    }
  }

  // Extract feeds from body outlines
  if (parsed.body?.outlines) {
    extractFeeds(parsed.body.outlines as Array<ParsedOutline>);
  }

  const result: Data = {
    feeds,
  };

  if (parsed.head?.title !== undefined) {
    result.title = parsed.head.title;
  }
  if (parsed.head?.dateCreated !== undefined) {
    const dateCreated = parsed.head.dateCreated;
    result.dateCreated =
      typeof dateCreated === "string"
        ? dateCreated
        : (dateCreated as Date).toISOString();
  }
  if (parsed.head?.ownerEmail !== undefined) {
    result.ownerEmail = parsed.head.ownerEmail;
  }

  return result;
}
