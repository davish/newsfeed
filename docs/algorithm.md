I have a lot of news sources. Some post every week, some post every day, some post only once per month.
I want to follow all my feeds without having the ones that post less frequently drown out the ones that
post all the time.

I want to make sure I see posts from feeds that post less frequently closer to the top.

If a feed posts once per month and has a post in the past month, it should show up before any of the non-today
posts from feeds that post daily.

There's two ways to do this:

The first way is to construct the feed incrementally going backwards in time. At every step, say "for feeds that publish monthly, are there any posts in the past month?" "for feeds that publish weekly, are there any posts in the past week"? and then add posts bit by bit. This is "exactly" what I want but it's also a bit awkward since I need to keep track of a "current day" that goes backward in time.

The second way is to construct some comparison function that will order posts how I want. I want to give
a ranking boost to posts from feeds that publish less frequently. Can I just sort posts in descending order
where the "score" is pubDate + averageTimeBetweenPostsForFeed?
