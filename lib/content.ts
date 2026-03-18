import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"

export interface PostFrontmatter {
  title: string
  date: string
  description: string
  tags?: string[]
  featured?: boolean
  draft?: boolean
  status?: "shipped" | "in-progress" | "upcoming"
  challenge?: string
  week?: number
  stats?: Array<{ value: string; label: string }>
}

export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  content: string
}

const contentDir = path.join(process.cwd(), "content")

export async function getPosts(type: "blog" | "work", includeDrafts = false): Promise<Post[]> {
  const dir = path.join(contentDir, type)

  let files: string[]
  try {
    files = await fs.readdir(dir)
  } catch {
    return []
  }

  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
      .map(async (filename) => {
        const filePath = path.join(dir, filename)
        const raw = await fs.readFile(filePath, "utf-8")
        const { data, content } = matter(raw)

        // Filter out drafts in production
        if (data.draft && process.env.NODE_ENV === "production" && !includeDrafts) {
          return null
        }

        return {
          slug: filename.replace(/\.mdx$/, ""),
          frontmatter: data as PostFrontmatter,
          content,
        }
      })
  )

  return posts
    .filter((p): p is Post => p !== null)
    .sort(
      (a, b) =>
        new Date(b.frontmatter.date).getTime() -
        new Date(a.frontmatter.date).getTime()
    )
}

export async function getPost(
  type: "blog" | "work",
  slug: string
): Promise<Post | null> {
  const filePath = path.join(contentDir, type, `${slug}.mdx`)

  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = matter(raw)

    if (data.draft && process.env.NODE_ENV === "production") {
      return null
    }

    return {
      slug,
      frontmatter: data as PostFrontmatter,
      content,
    }
  } catch {
    return null
  }
}
