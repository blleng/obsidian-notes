---
title: Maturity systems of my digital garden
info: Constructing a maturity systems for my notes in digital garden
date: 2024-02-27T12:28
update: 2024-02-27T13:10
tags:
  - note/2024/02
  - note/frontend
id: note20240227122841
dg-publish: true
noteIcon: 2
---
>[!tip] Notice
>This papaer is partially written by Chat-GPT

The cultivation of knowledge entails a process, and visualizing this construction process becomes imperative. I am endeavoring to establish a system of identification to denote the maturity level of each article within my digital garden, ensuring a keen grasp on their completeness. The development of this system not only delineates the process of knowledge formation but also serves as a catalyst for my personal growth.

# Overview
As noticed at the [[index#Maturity Levels|home]] page, I employ the growth stages of a tree to depict the completion status of articles, using raindrops to signify inspirational content, guideboards to represent guiding material, and withered leaves to denote outdated content.

So far, these icons are solely integrated within the titles of each article. Going forward, I will endeavor to extend this system to every internal link and strive to visually display the quantity of each article category (e.g. [my previous garden](https://dg.freezing.cool)), facilitating the documentation of the growth process within my digital garden.

# Modification Process

## Frontmatter property
In frontmatter, I use property `noteIcon` (from 1 to 6) to identify the category:

```markdown
---
...
noteIcon: 1|2|3|4|5|6
...
---
```
## Icons preparation
These icons are all from [lucide](https://lucide.dev). Just choose icons you like and get their SVG files (or codes). Encode the SVG into Base64 format for embedding these icons within the CSS file.
These base64 codes are documented within the `/quartz/styles/custom.scss` file:

```scss
body {
  --note-icon-1: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-2: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-3: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-4: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-5: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-6: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
}
```

## Import note-icon data in rendered page
Edit `/quartz/components/ArticleTitle.tsx` file to import icon data for `article title`:

```diff
   const title = fileData.frontmatter?.title
+  const icon = fileData.frontmatter?.noteIcon
   if (title) {
-     return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
+     return <h1 class={classNames(displayClass, "article-title")} data-icon={icon}>{title}</h1>
   } else {
     return null
   }
```
## Apply Icons to article title
In `/quartz/styles/custom.scss` file, we can finally complete the work:
```scss
h1.article-title[data-icon]::before {
  content: " ";
  display: inline-block;
  width: 1em;
  height: 1em;
  background-size: contain;
  background-repeat: no-repeat;
}

h1.article-title[data-icon="1"]::before {
  background-image: var(--note-icon-1)
}

h1.article-title[data-icon="2"]::before {
  background-image: var(--note-icon-2)
}

h1.article-title[data-icon="3"]::before {
  background-image: var(--note-icon-3)
}

h1.article-title[data-icon="4"]::before {
  background-image: var(--note-icon-4)
}

h1.article-title[data-icon="5"]::before {
  background-image: var(--note-icon-5)
}

h1.article-title[data-icon="6"]::before {
  background-image: var(--note-icon-6)
}
```

# To do

Visually display the quantity of each article category (e.g. [my previous garden](https://dg.freezing.cool))

```poetry
To be continued
```
