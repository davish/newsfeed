import RSSParser from "rss-parser";
async function main() {
  console.log("RSS Feed");
  const parser = new RSSParser();
  const feed = await parser.parseURL('https://www.reddit.com/r/rust.rss');
  console.log(feed.title);
}

main();