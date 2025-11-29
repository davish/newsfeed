import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parseRSSString } from "../src/rss.js";

describe("parseRSSString", () => {
  it("parses RSS feed with snapshot", async () => {
    const xmlContent = readFileSync("test/example.rss.xml", "utf-8");
    const feed = await parseRSSString(xmlContent);

    expect(feed).toMatchInlineSnapshot(`
      {
        "description": "xkcd.com: A webcomic of romance and math humor.",
        "link": "https://xkcd.com/",
        "posts": [
          {
            "content": "<img src="https://imgs.xkcd.com/comics/bridge_clearance.png" title="A lot of the highway department's budget goes to adjusting the sign whenever the moon passes directly overhead." alt="A lot of the highway department's budget goes to adjusting the sign whenever the moon passes directly overhead." />",
            "date": 2025-11-28T05:00:00.000Z,
            "guid": "https://xkcd.com/3174/",
            "title": "Bridge Clearance",
            "url": "https://xkcd.com/3174/",
          },
          {
            "content": "<img src="https://imgs.xkcd.com/comics/satellite_imagery.png" title="Every weekend I take an ATV out into the desert and spend a day tracing a faint &quot;(C) GOOGLE 2009&quot; watermark across the landscape." alt="Every weekend I take an ATV out into the desert and spend a day tracing a faint &quot;(C) GOOGLE 2009&quot; watermark across the landscape." />",
            "date": 2025-11-26T05:00:00.000Z,
            "guid": "https://xkcd.com/3173/",
            "title": "Satellite Imagery",
            "url": "https://xkcd.com/3173/",
          },
          {
            "content": "<img src="https://imgs.xkcd.com/comics/fifteen_years.png" title="&quot;Want to feel old?&quot; &quot;Yes.&quot;" alt="&quot;Want to feel old?&quot; &quot;Yes.&quot;" />",
            "date": 2025-11-24T05:00:00.000Z,
            "guid": "https://xkcd.com/3172/",
            "title": "Fifteen Years",
            "url": "https://xkcd.com/3172/",
          },
          {
            "content": "<img src="https://imgs.xkcd.com/comics/geologic_core_sample.png" title="If you drill at the right angle and time things perfectly, your core sample can include a section of a rival team's coring equipment." alt="If you drill at the right angle and time things perfectly, your core sample can include a section of a rival team's coring equipment." />",
            "date": 2025-11-21T05:00:00.000Z,
            "guid": "https://xkcd.com/3171/",
            "title": "Geologic Core Sample",
            "url": "https://xkcd.com/3171/",
          },
        ],
        "title": "xkcd.com",
      }
    `);
  });

  it("parses Atom feed with snapshot", async () => {
    const xmlContent = readFileSync("test/example.atom.xml", "utf-8");
    const feed = await parseRSSString(xmlContent);

    expect(feed).toMatchInlineSnapshot(`
      {
        "lastBuildDate": "2025-11-28T00:00:00Z",
        "link": "https://xkcd.com/",
        "posts": [
          {
            "date": 2025-11-28T00:00:00.000Z,
            "title": "Bridge Clearance",
            "url": "https://xkcd.com/3174/",
          },
          {
            "date": 2025-11-26T00:00:00.000Z,
            "title": "Satellite Imagery",
            "url": "https://xkcd.com/3173/",
          },
          {
            "date": 2025-11-24T00:00:00.000Z,
            "title": "Fifteen Years",
            "url": "https://xkcd.com/3172/",
          },
          {
            "date": 2025-11-21T00:00:00.000Z,
            "title": "Geologic Core Sample",
            "url": "https://xkcd.com/3171/",
          },
        ],
        "title": "xkcd.com",
      }
    `);
  });
});
