import Link from 'next/link'
import { createSupabaseServer } from '../../lib/supabase-server'
import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import './how-it-works.css'

export const metadata = {
  title: 'How Scoopd Works — Restaurant Reservation Drop Times Explained',
  description: 'Scoopd tracks when NYC restaurants release reservations — the exact platform, time, and date. Here\'s how we do it and how to use it.',
  openGraph: {
    title: 'How Scoopd Works — Restaurant Reservation Drop Times Explained',
    description: 'Scoopd tracks when NYC restaurants release reservations — the exact platform, time, and date. Here\'s how we do it and how to use it.',
    url: 'https://scoopd.nyc/how-it-works',
    siteName: 'Scoopd',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'How Scoopd Works — Restaurant Reservation Drop Times Explained',
    description: 'Scoopd tracks when NYC restaurants release reservations — the exact platform, time, and date. Here\'s how we do it and how to use it.',
  },
}

export default async function HowItWorks() {
  const serverSupabase = await createSupabaseServer()
  const { data: { user } } = await serverSupabase.auth.getUser()

  return (
    <main style={{background:'#0f0f0d',minHeight:'100vh',color:'#e8e4dc',fontFamily:"var(--font-dm-sans), sans-serif"}}>
      <ScoopNav />

      <div style={{padding:'0 2rem'}}>
        <div className="hiw-hero">
          <div className="hiw-eyebrow">The Guide</div>
          <h1 className="hiw-headline">Why NYC reservations<br />are a different game.</h1>
          <p className="hiw-hero-sub">Getting a table at Carbone or Lilia has nothing to do with luck. It comes down to knowing exactly when the window opens and being ready before anyone else does.</p>
        </div>

        <div className="hiw-content">

          <div className="hiw-section">
            <div className="hiw-section-num">01</div>
            <h2 className="hiw-section-title">The reservation landscape has changed</h2>
            <div className="hiw-section-body">
              <p>Ten years ago, getting into a popular NYC restaurant meant calling ahead or showing up and hoping. Now it means competing with hundreds of people the second a booking window opens. Sometimes at midnight. Sometimes at 9 AM sharp, weeks in advance.</p>
              <p>Resy and OpenTable made reservations more accessible. They also created a new problem. Everyone knows how to book online, which means the best tables at the hardest restaurants are gone in seconds. Often before most people have had their first coffee.</p>
              <p>NYC dining has split into two worlds. Restaurants you can book whenever. And restaurants where you either know when to move or you don't get in.</p>
            </div>
          </div>

          <div className="hiw-section">
            <div className="hiw-section-num">02</div>
            <h2 className="hiw-section-title">What a drop time is</h2>
            <div className="hiw-section-body">
              <p>Most reservation-based restaurants in NYC release availability on a rolling schedule. Instead of opening every future date at once, they release a fixed window that moves forward one day at a time. A restaurant with a 30-day window opens a new date every single morning at a specific time.</p>
              <p>That moment is the drop time.</p>
              <div className="hiw-highlight">
                If a restaurant releases at 10 AM, a new date becomes bookable every day at exactly 10 AM. Being there at 10:00:01 instead of 10:00:00 is often the difference between getting the table and watching it disappear.
              </div>
              <p>Some restaurants work differently. Certain spots release an entire month of availability on the first of each prior month. Others drop in two-week blocks on set dates. The pattern depends on the restaurant and which platform they use.</p>
            </div>
          </div>

          <div className="hiw-section">
            <div className="hiw-section-num">03</div>
            <h2 className="hiw-section-title">How the platforms differ</h2>
            <div className="hiw-section-body">
              <p>Resy, OpenTable, and DoorDash each handle reservations differently, and the differences matter more than most people realize.</p>
              <div className="hiw-platform-grid">
                <div className="hiw-platform-card">
                  <div className="hiw-platform-name">Resy</div>
                  <div className="hiw-platform-desc">Home to most of the high-demand restaurants in NYC. Each restaurant controls its own release schedule and the information is not always consistent.</div>
                </div>
                <div className="hiw-platform-card">
                  <div className="hiw-platform-name">OpenTable</div>
                  <div className="hiw-platform-desc">A larger network with its own conventions around how booking windows are counted and displayed. More consistent in practice but gaps still exist.</div>
                </div>
                <div className="hiw-platform-card">
                  <div className="hiw-platform-name">DoorDash</div>
                  <div className="hiw-platform-desc">Has become the exclusive booking platform for a growing group of NYC restaurants. UI is by far the weakest and releases may not follow a standard pattern.</div>
                </div>
              </div>
              <p>The practical result is that the same stated window means different things depending on where a restaurant books. Knowing the platform matters as much as knowing the time.</p>
            </div>
          </div>

          <div className="hiw-section">
            <div className="hiw-section-num">04</div>
            <h2 className="hiw-section-title">General preparation</h2>
            <div className="hiw-section-body">
              <p>Knowing the drop time is the starting point. Being ready to act the second the window opens is everything else. A few things that apply no matter which platform you are working with.</p>
              <ul className="hiw-tip-list">
                <li>Have your account logged in and payment method saved before the drop time. Any friction in the booking flow costs you the table.</li>
                <li>Know your party size and the time slots you want before you get there. Making decisions in the moment while the page is live is how you miss.</li>
                <li>Get to the restaurant page before the drop. Searching at 10:00:01 is already too late at the hardest places.</li>
                <li>Desktop and mobile behave differently on each platform. Know which one works better for the specific restaurant you are going after.</li>
                <li>Missing the initial drop is not the end. Cancellations happen throughout the day, especially in the hours around when a restaurant opens its doors for service.</li>
              </ul>
            </div>
          </div>

          <div className="hiw-section">
            <div className="hiw-section-num">05</div>
            <h2 className="hiw-section-title">Where Scoopd fits in</h2>
            <div className="hiw-section-body">
              <p>The information about when restaurants drop, on which platform, and at what exact time is scattered across the internet. Most of it is wrong or out of date. Restaurant bios get ignored, secondary articles repeat old information, and the work of keeping it accurate has never been done properly.</p>
              <p>Scoopd maintains the database so you don't have to. Every release time we publish has been verified against what actually happens, not what a restaurant bio claims or what a blog post written two years ago says.</p>
              <p>The free directory gives you the release time and booking window for every restaurant we track. The window is accurate. Using it still requires knowing how to count correctly across platforms, which is where most people get tripped up. The premium tier handles that for you. Instead of knowing a restaurant drops 30 days out at 10 AM and doing the math yourself, Scoopd tells you that Carbone opens for April 15 tomorrow morning at 10 AM. Set your alarm.</p>
              <p>Not every diner is chasing a specific restaurant. Some people have a date locked in and want to know what is worth going after. Scoopd works for that too. Tell us you want to dine on May 5th and we show you what becomes bookable between now and then, across every restaurant we track, in the order it drops.</p>
            </div>
          </div>

          <div className="hiw-cta-block">
            <div className="hiw-cta-title">Be first to know.</div>
            {user ? (
              <>
                <p className="hiw-cta-sub">Track your restaurants and manage your subscription.</p>
                <Link href="/account" className="hiw-cta-btn">Go to my account →</Link>
              </>
            ) : (
              <>
                <p className="hiw-cta-sub">Join the waitlist for exact drop date calculations, real-time alerts, and the full Scoopd platform when it launches.</p>
                <Link href="/signup" className="hiw-cta-btn">Join the waitlist</Link>
              </>
            )}
          </div>

        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}