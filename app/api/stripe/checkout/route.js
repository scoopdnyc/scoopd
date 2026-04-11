import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const supabase = await createSupabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentType = req.headers.get('content-type') || ''
  let founding, interval
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await req.formData()
    founding = form.get('founding') === 'true'
    interval = form.get('interval') || undefined
  } else {
    const body = await req.json().catch(() => ({}))
    founding = body.founding === true || body.founding === 'true'
    interval = body.interval
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, founding_member, status')
    .eq('user_id', user.id)
    .single()

  // Founding re-entry gate: lost the rate when they canceled, use standard price
  if (founding && subscription?.founding_member === true && subscription?.status === 'inactive') {
    founding = false
  }

  let priceId
  if (founding) {
    priceId = interval === 'year' ? process.env.STRIPE_FOUNDING_PRICE_YEAR : process.env.STRIPE_FOUNDING_PRICE_MONTH
  } else {
    priceId = interval === 'year' ? process.env.STRIPE_STANDARD_PRICE_YEAR : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
  }

  let customerId = subscription?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email })
    customerId = customer.id
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?canceled=true`,
    metadata: { user_id: user.id, founding: founding ? 'true' : 'false' },
  })

  return NextResponse.redirect(session.url, 303)
}
