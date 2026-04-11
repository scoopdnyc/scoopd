import ScoopNav from '../components/ScoopNav'
import ScoopFooter from '../components/ScoopFooter'
import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service | Scoopd',
  robots: { index: false, follow: false },
}

export default function TermsPage() {
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
        <h1 className="lg-title">Terms of Service</h1>
        <div className="lg-date">Effective date: April 10, 2026</div>

        <p className="lg-intro">
          Welcome to Scoopd. Please read these Terms of Service carefully before using our website, products, and services.
          If you have any questions, contact us at support@scoopd.nyc.
          <br /><br />
          Scoopd is a restaurant reservation intelligence platform. We track when hard-to-get restaurants release reservations
          and provide subscribers with information about the exact platform, time, and date reservations become available.
          Scoopd does not make reservations on your behalf, does not use bots or automated tools to secure reservations, and
          does not broker, transfer, or resell reservations. We provide information only. Any reservation you make as a result
          of using our Services is made directly by you through the relevant reservation platform.
          <br /><br />
          When we use the word "you" in these Terms, it refers to any visitor or user of the Services, whether free or paid.
        </p>

        <div className="lg-section">
          <h2 className="lg-h2">Agreement to Terms</h2>
          <p className="lg-p">
            These Terms of Service constitute a binding contract between you and Scoopd. Your use of the Services in any way
            means that you agree to all of these Terms and that you have read and understood them. These Terms include the
            provisions in this document as well as those in our Privacy Policy, which is incorporated herein by reference.
          </p>
          <p className="lg-allcaps">
            IF YOU DO NOT AGREE TO ALL OF THESE TERMS, DO NOT USE OR ACCESS THE SERVICES IN ANY MANNER.
          </p>
          <p className="lg-allcaps">
            ARBITRATION NOTICE AND CLASS ACTION WAIVER: EXCEPT FOR CERTAIN TYPES OF DISPUTES DESCRIBED IN THE ARBITRATION
            SECTION BELOW, YOU AGREE THAT DISPUTES BETWEEN YOU AND SCOOPD WILL BE RESOLVED BY BINDING, INDIVIDUAL
            ARBITRATION AND YOU WAIVE YOUR RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Changes to These Terms</h2>
          <p className="lg-p">
            We reserve the right to change these Terms at any time. If we make material changes we will post a notice on
            scoopd.nyc and notify you by email at the address associated with your account. If you continue to use the
            Services after a change takes effect, that constitutes your acceptance of the updated Terms. If you do not agree
            to the updated Terms you may cancel your subscription and stop using the Services at any time.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Eligibility</h2>
          <p className="lg-p">
            You must be at least 18 years of age to use the Services or create an account. By using the Services you
            represent and warrant that you are at least 18 years old and have the legal capacity to enter into a binding
            contract. If you are under 18 do not use the Services. We do not knowingly collect information from anyone under
            18. If we learn that a user is under 18 we will terminate their account and delete their information promptly.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Your Account</h2>
          <p className="lg-p">
            You are responsible for maintaining the confidentiality of your account credentials and for all activity that
            occurs under your account. You agree to provide accurate, complete, and current information when creating your
            account, promptly update your information to keep it accurate and current, notify us immediately at
            support@scoopd.nyc if you become aware of any unauthorized use of your account, not share your account
            credentials with any other person, and not transfer your account to any other person without our prior written
            permission. We are not liable for any loss or damage arising from your failure to protect your account
            credentials.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">What Scoopd Is and Is Not</h2>
          <p className="lg-p">
            Scoopd provides restaurant reservation release intelligence. This means we research, verify, and publish
            information about when specific restaurants make reservations available to the public, including the platform
            used, the release time, and the number of days in advance reservations are released.
          </p>
          <p className="lg-p">
            Scoopd expressly does not make reservations on your behalf, use bots, scripts, or automated tools to access
            reservation platforms, broker, transfer, buy, or sell reservations, guarantee the availability of any
            reservation at any time, or guarantee the accuracy of any release time or schedule at any given moment.
          </p>
          <p className="lg-p">
            Restaurant reservation release schedules change without notice and are outside our control. We update our
            intelligence regularly but cannot guarantee real-time accuracy. Your use of our intelligence to attempt to secure
            a reservation is entirely at your own risk. Scoopd is not responsible for missed reservations, changed release
            windows, platform outages, or any other outcome arising from your use of the Services.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Acceptable Use</h2>
          <p className="lg-p">
            You agree that you will not use the Services to violate any applicable law or regulation, infringe the
            intellectual property rights or any other rights of any third party, scrape, crawl, copy, or systematically
            extract data from the Services by any means manual or automated, use bots, scripts, or other automated tools to
            access the Services, attempt to gain unauthorized access to any part of the Services or related systems, reverse
            engineer or decompile the Services, reproduce or redistribute any content from the Services without our prior
            written permission, share your account credentials with any other person, use the Services on behalf of a third
            party for commercial purposes without our written consent, or interfere with the proper functioning of the
            Services. Violation of any of the above is grounds for immediate termination of your account without notice or
            refund.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Subscription and Payment</h2>
          <p className="lg-p">
            Scoopd offers a free tier and a paid premium subscription. Premium features are available only to active paying
            subscribers.
          </p>
          <p className="lg-p">
            Standard pricing: Monthly plan $9.99 per month. Annual plan $60.00 per year billed as a single charge at a
            $5.00 per month effective rate.
          </p>
          <p className="lg-p">
            Founding Member pricing: A limited Founding Member rate was offered to early subscribers at the time of launch
            through a specific invitation. Founding Member pricing is not available to the general public and may not be
            shared, transferred, or combined with any other offer. Founding Member rates are $2.99 per month or $18.00 per
            year billed as a single charge. Founding Member pricing is guaranteed for the life of your subscription provided
            it remains active and in good standing. If you cancel a Founding Member subscription for any reason including
            non-payment, the Founding Member rate is permanently and irrevocably forfeited. Any subsequent subscription will
            be billed at the then-current standard rate. Scoopd reserves the right to verify Founding Member eligibility
            and to terminate Founding Member pricing for any account found to have obtained it outside of the original
            invitation channel.
          </p>
          <p className="lg-p">
            All payments are processed by Stripe, Inc. By subscribing you agree to Stripe's Terms of Service at
            stripe.com/legal and Stripe's Privacy Policy at stripe.com/privacy. Scoopd is not responsible for any errors or
            acts of Stripe in processing your payment.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Recurring Billing</h2>
          <p className="lg-allcaps">
            BY SUBSCRIBING TO A PAID PLAN YOU AUTHORIZE SCOOPD TO CHARGE YOUR PAYMENT METHOD ON A RECURRING BASIS --
            MONTHLY OR ANNUALLY DEPENDING ON YOUR SELECTED PLAN -- WITHOUT FURTHER AUTHORIZATION FROM YOU UNTIL YOU CANCEL.
            YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW AT THE END OF EACH BILLING PERIOD AT THE THEN-CURRENT RATE FOR YOUR
            PLAN. WE WILL NOTIFY ANNUAL SUBSCRIBERS AT LEAST 14 DAYS BEFORE THEIR RENEWAL DATE. TO CANCEL, VISIT
            SCOOPD.NYC/ACCOUNT BEFORE YOUR RENEWAL DATE. CANCELLATION TAKES EFFECT AT THE END OF YOUR CURRENT BILLING
            PERIOD.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Cancellation and Refunds</h2>
          <p className="lg-p">
            You may cancel your subscription at any time through your account page at scoopd.nyc/account. Upon cancellation
            you will retain access to premium features until the end of your current paid billing period. Your subscription
            will not renew after that date.
          </p>
          <p className="lg-allcaps">
            SCOOPD DOES NOT OFFER REFUNDS FOR ANY SUBSCRIPTION FEES ALREADY PAID, INCLUDING FOR UNUSED PORTIONS OF A
            BILLING PERIOD. THIS APPLIES TO BOTH MONTHLY AND ANNUAL PLANS. IF YOU CANCEL AN ANNUAL PLAN MID-YEAR YOU WILL
            RETAIN ACCESS THROUGH THE END OF THE ANNUAL PERIOD BUT WILL NOT RECEIVE A PRORATED REFUND.
          </p>
          <p className="lg-p">
            If you believe you were charged in error contact us at support@scoopd.nyc within 30 days of the charge and we
            will investigate.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Changes to Pricing</h2>
          <p className="lg-p">
            We reserve the right to change standard pricing at any time. We will provide at least 30 days written notice to
            existing subscribers before any price change takes effect for their plan. Founding Member rates are not subject
            to standard price changes for as long as the Founding Member subscription remains continuously active.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Suspension and Termination</h2>
          <p className="lg-p">
            We reserve the right to suspend or terminate your access to the Services at any time with or without notice for
            any reason including but not limited to violation of these Terms, non-payment, or conduct that we determine in
            our sole discretion to be harmful to the Services or other users. Upon termination your right to access the
            Services ends immediately. If your account is terminated for cause no refund will be issued. You may request a
            copy of your account data within 30 days of termination by contacting support@scoopd.nyc.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Intellectual Property</h2>
          <p className="lg-p">
            All content on Scoopd including but not limited to restaurant intelligence data, editorial descriptions, the
            drop date calculation methodology, design, code, trademarks, and copy is owned by or licensed to Scoopd and is
            protected by applicable intellectual property laws. Nothing in these Terms grants you any ownership interest in
            our content or Services. You may not reproduce, distribute, publicly display, create derivative works from, or
            commercially exploit any Scoopd content without our prior written permission.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Third Party Services</h2>
          <p className="lg-p">
            The Services may contain links to or integrations with third party platforms including Resy, OpenTable, and
            DoorDash. These third party services are not operated by Scoopd and we are not responsible for their content,
            availability, terms, or privacy practices. Your interactions with third party services are governed by their own
            terms and policies.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Accessibility</h2>
          <p className="lg-p">
            Scoopd is committed to making the Services accessible to all users including those with disabilities. We aim to
            conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA where reasonably practicable. If you
            experience any accessibility barriers while using the Services or require content in an alternative format
            please contact us at support@scoopd.nyc and describe the issue. We will make reasonable efforts to address
            accessibility concerns promptly. We welcome feedback on how we can improve the accessibility of the Services.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Disclaimer of Warranties</h2>
          <p className="lg-allcaps">
            THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, NON-INFRINGEMENT, ACCURACY, OR UNINTERRUPTED AVAILABILITY. SCOOPD DOES NOT WARRANT THAT THE SERVICES
            WILL BE FREE OF ERRORS OR THAT ANY INFORMATION PROVIDED WILL BE ACCURATE, COMPLETE, OR CURRENT AT ANY GIVEN
            TIME. YOU USE THE SERVICES AND RELY ON ANY INFORMATION PROVIDED ENTIRELY AT YOUR OWN RISK. SOME JURISDICTIONS
            DO NOT ALLOW THE EXCLUSION OF IMPLIED WARRANTIES SO SOME OF THE ABOVE EXCLUSIONS MAY NOT APPLY TO YOU.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Limitation of Liability</h2>
          <p className="lg-allcaps">
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, SCOOPD AND ITS OFFICERS, EMPLOYEES, AGENTS, AND SUCCESSORS
            SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, PUNITIVE, OR CONSEQUENTIAL DAMAGES OF ANY KIND
            ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SERVICES, INCLUDING BUT NOT LIMITED TO MISSED
            RESERVATIONS, LOST DINING OPPORTUNITIES, LOST PROFITS, OR RELIANCE ON ANY INFORMATION PROVIDED, EVEN IF
            SCOOPD HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN NO EVENT SHALL SCOOPD'S TOTAL CUMULATIVE
            LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE GREATER OF (A) THE TOTAL AMOUNT YOU PAID TO SCOOPD IN THE TWELVE
            MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM OR (B) ONE HUNDRED DOLLARS ($100.00). SOME
            JURISDICTIONS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF CERTAIN DAMAGES SO SOME OF THE ABOVE LIMITATIONS MAY
            NOT APPLY TO YOU.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Indemnification</h2>
          <p className="lg-p">
            You agree to defend, indemnify, and hold harmless Scoopd and its officers, employees, agents, and successors
            from and against any and all claims, liabilities, damages, losses, costs, and expenses including reasonable
            attorneys fees arising out of or in any way related to your use of the Services, your violation of these Terms,
            your violation of any applicable law or the rights of any third party, or any content or information you submit
            to or through the Services.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Arbitration and Dispute Resolution</h2>
          <p className="lg-p">
            Any dispute, claim, or controversy arising out of or relating to these Terms or the Services that cannot be
            resolved through good faith negotiation within 30 days shall be finally settled by binding individual
            arbitration administered by JAMS in New York County, New York, in accordance with JAMS Streamlined Arbitration
            Rules and Procedures then in effect. The arbitration shall be conducted by one arbitrator with substantial
            experience in commercial disputes. The arbitrator's award shall be final and binding and may be entered as a
            judgment in any court of competent jurisdiction.
          </p>
          <p className="lg-p">
            All claims must be brought on an individual basis only. You waive any right to bring or participate in any
            class action, collective action, or representative proceeding. If this class action waiver is found to be
            unenforceable, the entire arbitration agreement shall be null and void.
          </p>
          <p className="lg-p">
            Nothing in this section prevents either party from seeking emergency injunctive relief in a court of competent
            jurisdiction to prevent irreparable harm pending arbitration, or from bringing qualifying claims in small claims
            court in New York County, New York.
          </p>
          <p className="lg-p">
            Opt-out: You may opt out of this arbitration agreement by sending written notice to support@scoopd.nyc within
            30 days of first accepting these Terms. Your notice must include your name, the email address associated with
            your account, and a clear statement that you are opting out of arbitration.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Governing Law</h2>
          <p className="lg-p">
            These Terms are governed by and construed in accordance with the laws of the State of New York, without regard
            to its conflict of law provisions. Any claims not subject to arbitration shall be brought exclusively in the
            state or federal courts located in New York County, New York, and you consent to the personal jurisdiction of
            such courts.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Severability</h2>
          <p className="lg-p">
            If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or
            eliminated to the minimum extent necessary so that the remaining Terms shall remain in full force and effect.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Entire Agreement</h2>
          <p className="lg-p">
            These Terms, together with our Privacy Policy, constitute the entire agreement between you and Scoopd with
            respect to the Services and supersede all prior agreements and understandings relating to the Services.
          </p>
        </div>

        <div className="lg-section">
          <h2 className="lg-h2">Contact</h2>
          <p className="lg-p">Scoopd &nbsp;·&nbsp; support@scoopd.nyc &nbsp;·&nbsp; scoopd.nyc</p>
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
