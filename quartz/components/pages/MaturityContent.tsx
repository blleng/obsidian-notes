import { QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { Fragment, jsx, jsxs } from "preact/jsx-runtime"
import { toJsxRuntime } from "hast-util-to-jsx-runtime"
import style from "../styles/listPage.scss"
import { PageList } from "../PageList"
import { FullSlug, getAllSegmentPrefixes, simplifySlug } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { Root } from "hast"

function MaturityContent(props: QuartzComponentProps) {
  const { tree, fileData, allFiles } = props
  const slug = fileData.slug
  
  if (!(slug?.startsWith("maturitys/") || slug === "maturitys")) {
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
      : // @ts-ignore
        toJsxRuntime(tree, { Fragment, jsx, jsxs, elementAttributeNameCase: "html" })
  if (maturity === "" || slug.slice(-6) == "/index") {
    // Most likely this is the index page
    const maturitys = [...new Set(allFiles.flatMap((data) => data.frontmatter?.maturity ?? []))]
    const maturityItemMap: Map<string, QuartzPluginData[]> = new Map()
    for (const maturity of maturitys) {
        maturityItemMap.set(maturity, allPagesWithMaturity(maturity))
    }
    return (
      <div class="popover-hint">
        <article>
          <p>{content}</p>
        </article>
        <hr/>
        <div>
          {maturitys.map((maturity) => {
            const pages = maturityItemMap.get(maturity)!
            const contentPage = allFiles.filter((file) => file.slug === `maturity/${maturity}`)[0]
            const content = contentPage?.description
            const title = contentPage?.frontmatter?.title
            return (
              <div>
                <h2>
                  <a class="internal tag-link" href={`/maturity/${maturity}`}>
                    {title}
                  </a>
                </h2>
                {content && <p>{content}</p>}
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
      <div class="popover-hint">
        <article>{content}</article>
        <p>{pages.length} item at this maturity.</p>
        <div>
          <PageList {...listProps} />
        </div>
      </div>
    )
  }
}

MaturityContent.css = style + PageList.css
export default (() => MaturityContent) satisfies QuartzComponentConstructor