import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList } from "../PageList"
import { FullSlug, getAllSegmentPrefixes, simplifySlug, resolveRelative } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"

const numPages = 10
function MaturityContent(props: QuartzComponentProps) {
  const { tree, fileData, allFiles, cfg } = props
  const slug = fileData.slug
  
  if (!(slug?.startsWith("maturity/") || slug === "maturity")) {
    throw new Error(`Component "MaturityContent" tried to render a non-maturity page: ${slug}`)
  }

  const maturity = simplifySlug(slug.slice("maturity/".length) as FullSlug)
  const allPagesWithMaturity = (maturity: string) =>
    allFiles.filter((file) =>
      (file.frontmatter?.maturity ?? []).flatMap(getAllSegmentPrefixes).includes(maturity),
    )
  const content =
    (tree as Root).children.length === 0
      ? fileData.description
      : htmlToJsx(fileData.filePath!, tree)
  const cssClasses: string[] = fileData.frontmatter?.cssclasses ?? []
  const classes = ["popover-hint", ...cssClasses].join(" ")

    const pages = allPagesWithMaturity(maturity)
    const listProps = {
      ...props,
      allFiles: pages,
    }
    return (
      <div class={classes}>
        <article>{content}</article>
        <div class="page-listing">
          <span>{i18n(cfg.locale).pages.maturityContent.itemsUnderTag({ count: pages.length })}</span>
          <div>
            <PageList {...listProps} />
          </div>
        </div>
      </div>
    )
}

MaturityContent.css = style + PageList.css
export default (() => MaturityContent) satisfies QuartzComponentConstructor