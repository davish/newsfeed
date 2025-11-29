import { XMLParser } from "fast-xml-parser";

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
export function parseOPML(xmlContent: string): Data {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const parsed = parser.parse(xmlContent);
  const opml = parsed.opml;

  const feeds: Feed[] = [];

  function extractFeeds(outline: any): void {
    if (!outline) return;

    if (Array.isArray(outline)) {
      outline.forEach((item) => extractFeeds(item));
      return;
    }

    if (outline["@_xmlUrl"] && outline["@_type"] === "rss") {
      feeds.push({
        title: outline["@_title"] || outline["@_text"] || "",
        xmlUrl: outline["@_xmlUrl"],
        htmlUrl: outline["@_htmlUrl"],
        text: outline["@_text"],
      });
    }

    if (outline.outline) {
      extractFeeds(outline.outline);
    }
  }

  if (opml?.body?.outline) {
    extractFeeds(opml.body.outline);
  }

  return {
    title: opml?.head?.title,
    dateCreated: opml?.head?.dateCreated,
    ownerEmail: opml?.head?.ownerEmail,
    feeds,
  };
}

