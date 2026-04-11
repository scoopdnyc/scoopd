import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | Scoopd',
  robots: { index: false, follow: false },
}

export default function PrivacyPage() {
  return (
    <main style={{ background: '#0f0f0d', minHeight: '100vh', color: '#e8e4dc', fontFamily: "var(--font-dm-sans), sans-serif" }}>
      <style>{`
        .lg-doc { max-width: 760px; margin: 0 auto; padding: 4rem 2rem 6rem; }
        .lg-eyebrow { font-family: var(--font-dm-mono), monospace; font-size: 11px; letter-spacing: 2.5px; color: #c9a96e; text-transform: uppercase; margin-bottom: 1rem; }
        .lg-title { font-family: var(--font-playfair), serif; font-size: 42px; line-height: 1.1; color: #e8e4dc; margin: 0 0 0.5rem; }
        .lg-date { font-size: 13px; color: #6b6b60; margin-bottom: 3rem; }
        .lg-intro { font-size: 15px; color: #8a8a80; line-height: 1.8; margin-bottom: 3rem; border-bottom: 0.5px solid #2a2a26; padding-bottom: 3rem; }
        .lg-section { margin-bottom: 2.5rem; }
        .lg-h2 { font-family: var(--font-playfair), serif; font-size: 20px; color: #c9a96e; margin: 0 0 0.875rem; line-height: 1.3; }
        .lg-p { font-size: 15px; color: #e8e4dc; line-height: 1.8; margin: 0 0 1rem; }
        .lg-p:last-child { margin-bottom: 0; }
        .lg-allcaps { font-size: 13px; color: #8a8a80; line-height: 1.8; margin: 0 0 1rem; }
        .lg-allcaps:last-child { margin-bottom: 0; }
        .lg-footer-doc { border-top: 0.5px solid #2a2a26; margin-top: 4rem; padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 13px; color: #6b6b60; }
        .lg-footer-links { display: flex; gap: 1.5rem; }
        .lg-footer-links a { color: #8a8a80; text-decoration: none; }
        .lg-footer-links a:hover { color: #c9a96e; }
        @media (max-width: 600px) {
          .lg-doc { padding: 3rem 1.5rem 4rem; }
          .lg-title { font-size: 32px; }
          .lg-footer-doc { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <ScoopNav />

      <div className="lg-doc">
        <div className="lg-eyebrow">Legal</div>
        <h1 className="lg-title">Privacy Policy</h1>
        <div className="lg-date">Effective date: April 10, 2026</div>

        <p className="lg-intro">
          At Scoopd we take your privacy seriously. This Privacy Policy explains what personal information we collect, how
          we use it, who we share it with, and your rights with respect to it. By using our Services you acknowledge that
          you have read and understood this policy.
        </p>

        <div className="lg-section">
          <h2 className="lg-h2">Who We Are</h2>
          <p className="lg-p">
            Scoopd is a restaurant reservation intelligence platform operating at scoopd.nyc. For the purposes of
            applicable data protection law, Scoopd is the data controller of personal information collected through the
            Services. Contact: support@scoopd.nyc
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Information We Collect</h2>
          <p className="lg-p">
            Information you provide directly: Email address and password when you create an account. Payment information
            when you subscribe to a paid plan. We do not store your full card number, expiration date, or CVV. Payment
            details are collected and stored directly by Stripe, Inc. We retain only a tokenized reference and the last
            four digits of your card for display purposes.
          </p>
          <p className="lg-p">
            Information collected automatically: Log data including your IP address, browser type, operating system,
            referring URLs, pages visited, and time spent on the Services. Device identifiers. Cookie data and similar
            tracking technologies as described below.
          </p>
          <p className="lg-p">
            Analytics data: We use Google Analytics to understand how users interact with the Services. Google Analytics
            collects anonymized usage data including page views, session duration, traffic sources, and general geographic
            location based on IP address. This data is processed by Google LLC in accordance with their privacy policy. You
            can opt out of Google Analytics data collection at tools.google.com/dlpage/gaoptout.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">How We Use Your Information</h2>
          <p className="lg-p">
            We use the information we collect to create and maintain your account, process subscription payments and manage
            your billing, provide you with the Services including calculating and displaying reservation drop dates, send
            transactional emails including account confirmations, password resets, and drop alerts if you have enabled them,
            respond to your support requests and communications, analyze and improve the Services, detect and prevent fraud,
            abuse, and security incidents, and comply with applicable legal obligations. We do not use your personal
            information for behavioral advertising or targeted advertising. We do not sell your personal information to any
            third party.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Legal Basis for Processing (GDPR)</h2>
          <p className="lg-p">
            If you are located in the European Economic Area, the United Kingdom, or Switzerland, we process your personal
            information on the following legal bases.
          </p>
          <p className="lg-p">
            Contractual necessity: We process your email address, account information, and payment data as necessary to
            perform our contract with you and provide the Services you have subscribed to.
          </p>
          <p className="lg-p">
            Legitimate interests: We process usage data, log data, and analytics data to operate, maintain, and improve the
            Services, prevent fraud, and ensure security. We have assessed that these legitimate interests are not
            overridden by your privacy rights.
          </p>
          <p className="lg-p">
            Legal obligation: We may process and retain certain data as required to comply with applicable laws,
            regulations, and legal process.
          </p>
          <p className="lg-p">
            Consent: Where we rely on consent as a legal basis you may withdraw your consent at any time by contacting
            support@scoopd.nyc or using the unsubscribe link in any email we send. Withdrawal of consent does not affect
            the lawfulness of processing prior to withdrawal.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Third Parties We Share Data With</h2>
          <p className="lg-p">
            We share your personal information only with the following service providers who assist us in operating the
            Services. All third party processors are required to handle your data in accordance with applicable law and our
            instructions.
          </p>
          <p className="lg-p">
            Stripe, Inc. -- payment processing. Stripe's privacy policy is available at stripe.com/privacy. Supabase --
            database hosting and user authentication infrastructure. Vercel -- website hosting and deployment
            infrastructure. Google LLC -- analytics via Google Analytics. Data is anonymized before transmission. Resend --
            transactional email delivery for account and alert emails sent from scoopd.nyc. Zoho Corporation -- support
            email inbox at support@scoopd.nyc.
          </p>
          <p className="lg-p">
            We may also disclose your information to law enforcement, regulators, or other third parties when required by
            applicable law, court order, or legal process, or when we believe in good faith that disclosure is necessary to
            protect the rights, property, or safety of Scoopd, our users, or others. In the event of a merger,
            acquisition, or sale of all or substantially all of our assets, your information may be transferred to the
            acquiring entity. We will notify you before your information is transferred and becomes subject to a different
            privacy policy.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Cookies and Tracking Technologies</h2>
          <p className="lg-p">
            We use cookies and similar technologies to operate and improve the Services. Essential cookies are required for
            the Services to function including session cookies that keep you logged in. Analytics cookies are used by Google
            Analytics to collect anonymized usage data. You can control cookies through your browser settings. Note that
            blocking essential cookies will prevent you from logging in or accessing premium features. Our Services do not
            currently respond to Do Not Track browser signals.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Data Retention</h2>
          <p className="lg-p">
            We retain your personal information for as long as your account is active or as needed to provide the Services.
            If you delete your account we will delete your personal data within 30 days except where we are required to
            retain it by applicable law. Payment transaction records may be retained for up to seven years in accordance
            with financial record-keeping requirements.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Data Security</h2>
          <p className="lg-p">
            We implement appropriate technical and organizational measures to protect your personal information against
            unauthorized access, loss, disclosure, or destruction. These measures include encrypted data transmission via
            HTTPS, secure database access controls, and authentication protections through Supabase. No method of
            transmitting or storing data is completely secure. While we work to protect your information we cannot guarantee
            absolute security. You are responsible for maintaining the security of your account credentials.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Your Rights</h2>
          <p className="lg-p">
            Depending on where you are located you may have the right to access personal information we hold about you,
            correct inaccurate or incomplete information, request deletion of your personal information subject to certain
            exceptions, request your personal information in a portable machine-readable format, object to certain
            processing of your personal information, request restriction of processing in certain circumstances, and
            withdraw consent where processing is based on consent.
          </p>
          <p className="lg-p">
            To exercise any of these rights contact us at support@scoopd.nyc. We will respond within 30 days. We may ask
            you to verify your identity before processing your request.
          </p>
          <p className="lg-p">
            If you are located in the European Economic Area or United Kingdom and believe we have processed your personal
            information in violation of applicable law, you have the right to lodge a complaint with your local data
            protection authority. In the UK this is the Information Commissioner's Office at ico.org.uk. A list of EU
            supervisory authorities is available at edpb.europa.eu.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">International Data Transfers</h2>
          <p className="lg-p">
            The Services are hosted and operated in the United States. If you are located outside the United States your
            personal information will be transferred to and processed in the United States where data protection laws may
            differ from those in your country. For users in the European Economic Area and United Kingdom, where we
            transfer personal data outside of those regions we rely on appropriate safeguards including Standard
            Contractual Clauses approved by the European Commission or equivalent mechanisms. If you would like more
            information contact us at support@scoopd.nyc.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Accessibility of This Policy</h2>
          <p className="lg-p">
            This Privacy Policy is available at scoopd.nyc/privacy. If you require this policy in an alternative format
            due to a disability or accessibility need please contact us at support@scoopd.nyc and we will make reasonable
            efforts to accommodate your request.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">California Residents</h2>
          <p className="lg-p">
            Under the California Consumer Privacy Act and California Civil Code Section 1798.83, California residents have
            the right to know what personal information we collect, use, disclose, and sell, the right to delete personal
            information we have collected, the right to opt out of the sale of personal information (Scoopd does not sell
            personal information), and the right not to be discriminated against for exercising privacy rights. To exercise
            your California privacy rights contact us at support@scoopd.nyc. We will respond within 45 days.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Nevada Residents</h2>
          <p className="lg-p">
            Nevada residents have the right to opt out of the sale of personal information. Scoopd does not sell personal
            information. Contact support@scoopd.nyc with any questions.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Children</h2>
          <p className="lg-p">
            The Services are not directed at children under the age of 18 and we do not knowingly collect personal
            information from anyone under 18. If you believe a child under 18 has provided personal information to us
            contact us at support@scoopd.nyc and we will delete that information promptly.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Changes to This Policy</h2>
          <p className="lg-p">
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting a
            notice on scoopd.nyc and by sending an email to the address associated with your account at least 14 days
            before the change takes effect. Your continued use of the Services after a change takes effect constitutes your
            acceptance of the updated policy.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Contact</h2>
          <p className="lg-p">Scoopd &nbsp;·&nbsp; support@scoopd.nyc &nbsp;·&nbsp; scoopd.nyc</p>
          <p className="lg-p">For EU and UK residents regarding GDPR matters: support@scoopd.nyc</p>
        </div>

        <div className="lg-footer-doc">
          <span>Effective April 10, 2026</span>
          <div className="lg-footer-links">
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
      <ScoopFooter />
    </main>
  )
}
