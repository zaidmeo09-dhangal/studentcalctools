# StudentCalcTools CMS Setup

## Best CMS for this website

Use Pages CMS.

Reason: your site is already static on GitHub Pages. Pages CMS lets you edit Markdown blog posts from a simple online dashboard, while your site stays fast and free.

## Files included

- `.pages.yml`: CMS fields for blog posts
- `_config.yml`: Jekyll site config
- `blog.html`: dynamic blog listing page
- `_layouts/post.html`: single blog post template with SEO, Article schema and FAQ schema
- `_posts/2026-05-10-how-to-calculate-gpa.md`: sample blog post
- `assets/images/.gitkeep`: image folder placeholder

## What CMS fields are included

- Blog title
- Slug
- Publish date
- Status
- Author
- Category
- Tags
- Primary keyword
- Secondary keywords
- Meta title
- Meta description
- Blog card excerpt
- Featured image
- Image alt text
- Read time
- FAQs
- Blog content

## How to install

1. Download this ZIP.
2. Extract it.
3. Copy all files into your GitHub Pages repository root.
4. Replace your old `blog.html` with the new `blog.html` from this package.
5. Commit and push changes.
6. Open your website and check `/blog.html`.
7. Go to `https://app.pagescms.org`.
8. Connect your GitHub account.
9. Select your StudentCalcTools repository.
10. Pages CMS will read `.pages.yml` and show the blog post editor fields.

## Important before domain

Current `_config.yml` uses:

```yaml
url: "https://zaidmeo09-dhangal.github.io"
baseurl: "/studentcalctools"
```

After custom domain, change it to:

```yaml
url: "https://yourdomain.com"
baseurl: ""
```

## How FAQ schema works

In CMS, add FAQs as question and answer fields. The `post.html` template automatically creates visible FAQs and FAQPage JSON-LD schema.

## How blog cards work

The new `blog.html` no longer needs hardcoded cards. It loops through `_posts` automatically and shows every published post with the same card style.

## Best workflow

1. Open Pages CMS.
2. Click Blog Posts.
3. Create new post.
4. Fill all SEO fields.
5. Add featured image.
6. Add FAQs.
7. Write blog content.
8. Save.
9. GitHub Pages will rebuild and publish the post.
