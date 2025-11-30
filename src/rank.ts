import type { Feed, Post } from "./rss.js";

/**
 * Calculates the average time between posts in a feed
 * @param feed - The RSS feed to analyze
 * @returns Average time between posts in milliseconds, or null if there are fewer than 2 posts with dates
 */
function averageTimeBetweenPosts(feed: Feed): number | null {
  // Extract dates from posts, preferring isoDate over pubDate
  const dates = feed.posts
    .map((post) => post.date?.getTime())
    .filter((date): date is number => date !== null)
    .sort((a, b) => a - b); // Sort chronologically (oldest first)

  // Need at least 2 posts with dates to calculate an average interval
  if (dates.length < 2) {
    return null;
  }

  // Calculate time differences between consecutive posts
  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const current = dates[i];
    const previous = dates[i - 1];
    if (current !== undefined && previous !== undefined) {
      intervals.push(current - previous);
    }
  }

  // Calculate average interval
  const sum = intervals.reduce((acc, interval) => acc + interval, 0);
  return sum / intervals.length;
}

const comparePosts =
  (cache: Map<string, number | null>) =>
  (a: Post, b: Post): number => {
    const aDate = a.date?.getTime();
    const bDate = b.date?.getTime();
    if (!aDate || !bDate) {
      if (!aDate && bDate) {
        return -1;
      } else if (!bDate && aDate) {
        return 1;
      } else {
        return 0;
      }
    }

    const aScore = aDate + (cache.get(a.feed.url) ?? 0);
    const bScore = bDate + (cache.get(b.feed.url) ?? 0);
    return bScore - aScore;
  };

export function rankPosts(feeds: Feed[]): Post[] {
  const averageTimeBetweenPostsCache = new Map<string, number | null>();
  feeds.forEach((feed) => {
    const average = averageTimeBetweenPosts(feed);
    averageTimeBetweenPostsCache.set(feed.url, average);
  });
  return feeds
    .flatMap((feed) => feed.posts)
    .sort(comparePosts(averageTimeBetweenPostsCache));
}
