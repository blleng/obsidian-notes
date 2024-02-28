import { pathToRoot, slugTag } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const TagList: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags
  const maturity = fileData.frontmatter?.noteIcon
  let icon = ""
  switch(maturity) {
    case 1:
      icon = "Sprout"
      break
    case 2:
      icon = "Sapling"
      break
    case 3:
      icon = "Tree"
      break
    case 4:
      icon = "Withered"
      break
    case 5:
      icon = "Guideboard"
      break
    case 6:
      icon = "Raindrop"
      break
  }
  const maturityLink = `/maturity/${maturity}.html`

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
          const display = `#${tag}`
          const linkDest = baseDir + `/tags/${slugTag(tag)}`
          return (
            <li>
              <a href={linkDest} class="internal tag-link">
                {display}
              </a>
            </li>
          )
        })}
      </ul>
    )
  } else {
    return null
  }
}

TagList.css = `
.tags {
  list-style: none;
  display: flex;
  padding-left: 0;
  gap: 0.4rem;
  margin: 1rem 0;
  flex-wrap: wrap;
  justify-self: end;
}

.section-li > .section > .tags {
  justify-content: flex-end;
}
  
.tags > li {
  display: inline-block;
  white-space: pre-wrap;
  margin: 0;
  overflow-wrap: normal;
}

a.internal.tag-link {
  border-radius: 8px;
  background-color: var(--highlight);
  padding: 0.2rem 0.4rem;
  margin: 0 0.1rem;
}
`

export default (() => TagList) satisfies QuartzComponentConstructor
