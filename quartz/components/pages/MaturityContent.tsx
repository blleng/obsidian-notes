import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import style from "../styles/listPage.scss"
import { PageList } from "../PageList"
import { FullSlug, getAllSegmentPrefixes, simplifySlug, resolveRelative } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"
import { htmlToJsx } from "../../util/jsx"
import { i18n } from "../../i18n"

const numPages = 5
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

  if (maturity === "/" || slug.slice(-6) == "/index") {
    const maturitys = [
      ...new Set(
        allFiles.flatMap((data) => data.frontmatter?.maturity ?? []).flatMap(getAllSegmentPrefixes),
      ),
    ].sort((a, b) => a.localeCompare(b))
    const maturityItemMap: Map<string, QuartzPluginData[]> = new Map()
    for (const maturity of maturitys) {
        maturityItemMap.set(maturity, allPagesWithMaturity(maturity))
    }
    
    return (
      <div class={classes}>
        <article>
          <p>{content}</p>
        </article>
        <span class="maturity-count">{i18n(cfg.locale).pages.maturityContent.totalTags({ count: maturitys.length })}</span>
        <hr/>
        <div>
          {maturitys.map((maturity) => {
            const pages = maturityItemMap.get(maturity)!
            const listProps = {
              ...props,
              allFiles: pages,
            }

            const contentPage = allFiles.filter((file) => file.slug === `maturity/${maturity}`)[0]
            const content = contentPage?.description
            const title = contentPage?.frontmatter?.title
            return (
              <div>
                <h2 data-icon={maturity}>
                  <a class="internal tag-link" href={`/maturity/${maturity}`}>
                    {title}
                  </a>
                </h2>
                {content && <p>{content}</p>}
                <div class="page-listing">
                  <span class="maturity-count">
                    {i18n(cfg.locale).pages.maturityContent.itemsUnderTag({ count: pages.length })}
                    {pages.length > numPages && (
                      <>
                        {" "}
                        <span class="maturity-count">
                          {i18n(cfg.locale).pages.maturityContent.showingFirst({ count: numPages })}
                        </span>
                      </>
                    )}
                  </span>
                  <PageList limit={numPages} {...listProps} />
                </div>
             </div>
            )
          })}
        </div>
      </div>
    )
  } else {
    const pages = allPagesWithMaturity(maturity)
    const listProps = {
      ...props,
      allFiles: pages,
    }

    return (
      <div class={classes}>
        <article>{content}</article>
        <div class="page-listing">
          <span class="maturity-count">{i18n(cfg.locale).pages.maturityContent.itemsUnderTag({ count: pages.length })}</span>
          <div>
            <PageList {...listProps} />
          </div>
        </div>
      </div>
    )
  }
}

MaturityContent.css = style + PageList.css
export default (() => MaturityContent) satisfies QuartzComponentConstructor