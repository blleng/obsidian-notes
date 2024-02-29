---
title: Maturity systems of my digital garden
description: Constructing a maturity systems for my notes in digital garden
date: 2024-02-27T12:28
update: 2024-03-01T01:08
tags:
  - note/2024/02
  - note/frontend
id: note20240227122841
dg-publish: true
maturity: tree
---
The cultivation of knowledge entails a process, and visualizing this construction process becomes imperative. I am endeavoring to establish a system of identification to denote the [[maturity/index|maturity]] level of each note within my digital garden, ensuring a keen grasp on their completeness. The development of this system not only delineates the process of knowledge production but also pushes me to conduct a whole development of thoughts.

This note serves as a record of the construction.

# Overview
Generally, I employ the growth stages of a tree ([[sprout|sprout]], [[sapling|sapling]], [[tree|tree]]) to depict the completion status of articles, using [[raindrop|raindrops]] to signify inspirational content, [[guideboard|guide boards]] to represent guiding material, and [[withered|withered leaves]] to denote outdated content.

In each note, a front-matter property `maturity` is used to classify different types of maturity. A component and a plugin are constructed to create pages listing notes based on their maturity level.
# Modification Process

## Front-matter property
In front-matter part of a note, I use a property `maturity` to identify the type:

```markdown
---
...
maturity: sprout|sapling|tree|withered|guideboard|raindrop
---
```
## Icons preparation
I use a series of icons to visually represent the maturity level of the notes. These icons are all chosen from [lucide](https://lucide.dev). Just choose icons you like and get their SVG files (or codes). ==Encode the SVG into Base64== format for embedding these icons within the CSS file.
These base64 codes are documented within the `/quartz/styles/custom.scss` file:

```scss title="quartz/styles/custom.scss"
body {
  --note-icon-1: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-2: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-3: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-4: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-5: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
  --note-icon-6: url(data:image/svg+xml;base64,YOUR_BASE64_CODES_HERE);
}
```

## Data type of maturity
To generate listing pages of each maturity,  function `flatMap` is used, which can only deal with `string[]` type. We shall convert the maturity value in front-matter into `array` type.
We use `frontmatter.ts` `transformer` to deal with it:
```ts title="quartz/plugins/transformers/frontmatter.ts" {12-20,36}
export const FrontMatter: QuartzTransformerPlugin<Partial<Options> | undefined> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "FrontMatter",
    markdownPlugins({ cfg }) {
      return [
        [remarkFrontmatter, ["yaml", "toml"]],
        () => {
          return (_, file) => {
          ...
          ...  
            if (data.maturity && !Array.isArray(data.maturity)) {
              data.maturity = data.maturity
                .toString()
                .split(",")
                .map((maturity: string) => maturity.trim())
            } else {
              data.maturity = ["sprout"]
            }
            data.maturity = [...new Set(data.maturity?.map((maturity: string) => slugTag(maturity)))]
            ...
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    frontmatter: { [key: string]: unknown } & {
      title: string
    } & Partial<{
        ...
        ...
        maturity: string[]
      }>
  }
}
```

## i18n of maturity
Edit the `i18n` file for proper display of texts.

```ts title="quartz/i18n/locales/definition.ts" {5-9}
...
export interface Translation {
  ...
  .pages: {
    maturityContent: {
      itemsUnderTag: (variables: { count: number }) => string
      showingFirst: (variables: { count: number }) => string
      totalTags: (variables: { count: number }) => string
    }
  }
}
```

Choose ==your own language==, take `en-US` as an example:
```ts title="quartz/i18n/locales/en-US.ts" {5-10}
export default {
  ...
  pages {
    ...
    maturityContent: {
      itemsUnderTag: ({ count }) =>
        count === 1 ? "1 page under this maturity." : `${count} pages under this maturity.`,
      showingFirst: ({ count }) => `Showing recent ${count} pages.`,
      totalTags: ({ count }) => `${count} total types of maturity in all.`,
    },
  },
}
```

## Add maturity in tags field
Maturity value of each note is added in the `tags` field in the rendered page.

```ts title="quartz/components/TagList.tsx" {4-27,33-37,45-51}
...
const TagList: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags
  let maturity : string[]
  maturity = fileData.frontmatter?.maturity ?? ["sprout"]
  let icon = ""
  switch(maturity[0]) {
    case "sprout":
      icon = "Sprout"
      break
    case "sapling":
      icon = "Sapling"
      break
    case "tree":
      icon = "Tree"
      break
    case "withered":
      icon = "Withered"
      break
    case "guideboard":
      icon = "Guideboard"
      break
    case "raindrop":
      icon = "Raindrop"
      break
  }
  const maturityLink = `/maturity/${maturity}`

  const baseDir = pathToRoot(fileData.slug!)
  if (tags && tags.length > 0) {
    return (
      <ul class={classNames(displayClass, "tags")}>
        <li>
          <a href={maturityLink} class="internal tag-link" data-icon={maturity}>
            {icon}
          </a>
        </li>
        {tags.map((tag) => {
          ...
        })}
      </ul>
    )
  } else {
    return (
      <ul class={classNames(displayClass, "tags")}>
        <li>
          <a href={maturityLink} class="internal tag-link" data-icon={maturity}>
            {icon}
          </a>
        </li>
      </ul>
    )
  }
}
...
```

## Generate listing pages of each maturity
To generate pages which lists notes based on their maturity, we need new `component` and `plugin/emitter`.

The source code of these two file can be found here:
- component: [MaturityContent](https://github.com/blleng/obsidian-notes/blob/main/quartz/components/pages/MaturityContent.tsx)
- emitter: [maturityPage](https://github.com/blleng/obsidian-notes/blob/main/quartz/plugins/emitters/maturityPage.tsx)
## Necessary styles
We need  some necessary styles for proper display.

```scss title="quartz/styles/custom.scss"
*[data-icon]::before {
  content: " ";
  display: inline-block;
  padding-right: 0.3em;
  background-size: contain;
  background-repeat: no-repeat;
}

a.internal.tag-link[data-icon]::before{
  width: 1.4em;
}

h2[data-icon]::before{
  height: 1.2em;
  width: 1.2em;
  margin-bottom: -0.15em;
}

*[data-icon="sprout"]::before {
  background-image: var(--note-icon-1)
}

*[data-icon="sapling"]::before {
  background-image: var(--note-icon-2)
}

*[data-icon="tree"]::before {
  background-image: var(--note-icon-3)
}

*[data-icon="withered"]::before {
  background-image: var(--note-icon-4)
}

*[data-icon="guideboard"]::before {
  background-image: var(--note-icon-5)
}

*[data-icon="raindrop"]::before {
  background-image: var(--note-icon-6)
}

span.maturity-count {
  font-weight: bold;
  font-style: italic;
  font-family: var(--headerFont);
}
```

At this stage, the modification has finished.