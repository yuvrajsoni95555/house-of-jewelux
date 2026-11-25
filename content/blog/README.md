# How to add a blog post

1. Copy any post in this folder and rename it, for example `2026-12-01-my-new-post.md`.
2. Edit the frontmatter at the top (between the `---` lines):

```
---
title: The title shown on the page
slug: the-address-of-the-post        (letters, numbers and dashes; becomes /blog/the-address-of-the-post/)
excerpt: One or two sentences for the card, Google and social previews.
date: 2026-12-01                     (YYYY-MM-DD; newest posts come first)
author: House of Jewelux Atelier
authorAvatar: /images/house_of_jewelux_official_logo.png
authorBio: One short sentence about the author.
category: Jewellery Care             (use one of: Jewellery Care, Style Guide, Craft & Heritage, or a new one)
tags: [silver, care, tips]
coverImage: /images/your-photo.jpg   (any image in /images, or an https:// link)
coverAlt: Describe what the cover photo shows
featured: false                      (true = shown large at the top of /blog)
draft: false                         (true = not published)
---
```

3. Write the article below the frontmatter in Markdown:
   - `## Heading` and `### Smaller heading` (they also build the table of contents)
   - `- item` for lists, `1. item` for numbered lists
   - `> text` for a quote
   - `**bold**`, `*italic*`, `[link text](https://…)` or `[link text](/#contact)`
   - `![What the photo shows](/images/photo.jpg "Caption under the photo")` for a photo with a caption

4. Build the blog (creates the pages, the RSS feed and the sitemap entries):

```
node scripts/build_blog.js
```

5. Commit and publish as usual. Reading time is calculated automatically (about 200 words per minute).

Run the build again after editing `index.html`, because each blog page is a copy of it with its own SEO tags.
