import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { ProcessedContent, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FilePath, FullSlug, getAllSegmentPrefixes, joinSegments, pathToRoot, } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { MaturityContent } from "../../components"
import { write } from "./helpers"

export const MaturityPage: QuartzEmitterPlugin<FullPageLayout> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: MaturityContent(),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "MaturityPage",
    getQuartzComponents() {
      return [Head, Header, Body, ...header, ...beforeBody, pageBody, ...left, ...right, Footer]
    },
    async emit(ctx, content, resources): Promise<FilePath[]> {
      const fps: FilePath[] = []
      const allFiles = content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration

      const maturitys: Set<string> = new Set(
        allFiles.flatMap((data) => data.frontmatter?.maturity ?? []).flatMap(getAllSegmentPrefixes),
      )
      // add base maturity
      maturitys.add("index")

      const maturityDescriptions: Record<string, ProcessedContent> = Object.fromEntries(
        [...maturitys].map((maturity) => {
          let maturityName = "Maturity Index"
          switch(maturity) {
            case "sprout":
              maturityName = "Sprouts"
              break
            case "sapling":
              maturityName = "Saplings"
              break
            case "tree":
              maturityName = "Trees"
              break
            case "withered":
              maturityName = "Withered Leaves"
              break
            case "guideboard":
              maturityName = "Guide Boards"
              break
            case "raindrop":
              maturityName = "Raindrops"
              break
          }
          const title = maturityName
          return [
            maturity,
            defaultProcessedContent({
              slug: joinSegments("maturity", maturity) as FullSlug,
              frontmatter: { title, tags: [], maturitys: [] },
            }),
          ]
        }),
      )

      for (const [tree, file] of content) {
        const slug = file.data.slug!
        if (slug.startsWith("maturity/")) {
          const maturity = slug.slice("maturity/".length)
          if (maturitys.has(maturity)) {
            maturityDescriptions[maturity] = [tree, file]
          }
        }
      }

      for (const maturity of maturitys) {
        const slug = joinSegments("maturity", maturity) as FullSlug
        const externalResources = pageResources(pathToRoot(slug), resources)
        const [tree, file] = maturityDescriptions[maturity]
        const componentData: QuartzComponentProps = {
          ctx,
          fileData: file.data,
          externalResources,
          cfg,
          children: [],
          tree,
          allFiles,
        }

        const content = renderPage(cfg, slug, componentData, opts, externalResources)
        const fp = await write({
          ctx,
          content,
          slug: file.data.slug!,
          ext: ".html",
        })

        fps.push(fp)
      }
      return fps
    },
  }
}