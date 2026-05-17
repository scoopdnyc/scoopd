import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { compileMDX } from 'next-mdx-remote/rsc'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ScoopNav from '../../components/ScoopNav'
import ScoopFooter from '../../components/ScoopFooter'
import './blog.css'

export const revalidate = 86400

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

function getAllSlugs() {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))
}

function getRawPost(slug) {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(file)) return null
  return fs.readFileSync(file, 'utf-8')
}

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const raw = getRawPost(slug)
  if (!raw) return {}
  const { data } = matter(raw)
  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: `https://scoopd.nyc/blog/${slug}`,
    },
    openGraph: {
      title: data.title,
      description: data.description,
      url: `https://scoopd.nyc/blog/${slug}`,
      type: 'article',
      publishedTime: data.publishedAt,
      modifiedTime: data.updatedAt,
      siteName: 'Scoopd',
      images: [{ url: `/blog/${slug}/opengraph-image` }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/blog/${slug}/opengraph-image`],
    },
  }
}

export default async function BlogPost({ params }) {
  const { slug } = await params
  const raw = getRawPost(slug)
  if (!raw) notFound()

  const { data } = matter(raw)
  const { content } = await compileMDX({ source: raw, options: { parseFrontmatter: true } })

  const postUrl = `https://scoopd.nyc/blog/${slug}`

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    image: `https://scoopd.nyc/blog/${slug}/opengraph-image`,
    datePublished: data.publishedAt,
    dateModified: data.updatedAt ?? data.publishedAt,
    author: [
      { '@type': 'Organization', name: 'Scoopd', url: 'https://scoopd.nyc' },
      { '@type': 'Person', name: 'Scoopd Editorial Team' },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Scoopd',
      url: 'https://scoopd.nyc',
      logo: { '@type': 'ImageObject', url: 'https://scoopd.nyc/opengraph-image' },
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scoopd.nyc' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://scoopd.nyc/blog' },
      { '@type': 'ListItem', position: 3, name: data.title, item: postUrl },
    ],
  }

  const publishDate = new Date(data.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="bl-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ScoopNav />
      <div className="bl-container">
        <nav className="bl-breadcrumb">
          <Link href="/">Home</Link>
          <span className="bl-breadcrumb-sep">/</span>
          <Link href="/blog">Blog</Link>
          <span className="bl-breadcrumb-sep">/</span>
          <span>{data.title}</span>
        </nav>
        <header className="bl-header">
          <h1 className="bl-title">{data.title}</h1>
          <div className="bl-meta">
            <time dateTime={data.publishedAt}>{publishDate}</time>
            <span className="bl-byline">By the Scoopd Editorial Team</span>
          </div>
        </header>
        <div className="bl-body">
          {content}
        </div>
        <div className="bl-cta">
          <p className="bl-cta-text">Scoopd tracks drop times for every restaurant on this list.</p>
          <Link href="/signup" className="bl-cta-link">Get access →</Link>
        </div>
      </div>
      <ScoopFooter />
    </div>
  )
}
