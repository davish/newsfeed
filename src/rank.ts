import type { Feed } from "./rss.js";

/**
 * Calculates the average time between posts in a feed
 * @param feed - The RSS feed to analyze
 * @returns Average time between posts in milliseconds, or null if there are fewer than 2 posts with dates
 */
export function averageTimeBetweenPosts(feed: Feed): number | null {
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
