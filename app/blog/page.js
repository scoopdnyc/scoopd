import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import './blog-index.css'

export const metadata = {
  title: 'Blog',
  description: 'Writing on the New York restaurant reservation system: how it works, who shaped it, and how to navigate it.',
  alternates: {
    canonical: 'https://scoopd.nyc/blog',
  },
}

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

function getAllPosts() {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, f), 'utf-8')
      const { data } = matter(raw)
      return data
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

export default function BlogIndex() {
  const posts = getAllPosts()

  return (
    <div className="bl-index-page">
      <ScoopNav />
      <div className="bl-index-container">
        <h1 className="bl-index-heading">Blog</h1>
        <ul className="bl-index-list">
          {posts.map(post => {
            const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC',
            })
            return (
              <li key={post.slug} className="bl-index-item">
                <div className="bl-index-date">{date}</div>
                <h2 className="bl-index-title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="bl-index-description">{post.description}</p>
              </li>
            )
          })}
        </ul>
      </div>
      <ScoopFooter />
    </div>
  )
}
