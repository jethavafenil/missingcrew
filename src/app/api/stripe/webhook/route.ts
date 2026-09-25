import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { subscriptionRepo, userRepo, crewProfileRepo, SYSTEM_REQUESTER } from '@/lib/repo'
import { webhookEventsRepo } from '@/lib/payments/webhook-events'
import { getPaymentProvider } from '@/lib/payments'

export async function POST(request: NextRequest) {
  // Raw body as text: Stripe's signature covers the exact bytes, so the body
  // must not be parsed/re-serialized before verification.
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = getPaymentProvider('stripe').verifyWebhook(body, signature) as Stripe.Event
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Idempotency: Stripe retries failed deliveries and occasionally resends.
  // A claimed event is processed exactly once; duplicates return success.
  const isFirstDelivery = await webhookEventsRepo.claim('stripe', event.id, event.type)
  if (!isFirstDelivery) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    // Safe date conversion for Stripe timestamps (seconds) or Date strings
    const toSafeDate = (value: unknown, fallbackMsFromNow = 0): Date => {
      if (typeof value === 'number') {
        const d = new Date(value * 1000)
        return isNaN(d.getTime()) ? new Date(Date.now() + fallbackMsFromNow) : d
      }
      if (typeof value === 'string' || value instanceof Date) {
        const d = new Date(value as any)
        return isNaN(d.getTime()) ? new Date(Date.now() + fallbackMsFromNow) : d
      }
      return new Date(Date.now() + fallbackMsFromNow)
    }

    // Resolve a plan by Stripe price ID, falling back to the monthly amount
    // when the price ID isn't stored in the database
    const resolvePlan = async (
      priceId: string,
      unitAmount: number | null | undefined
    ) => {
      let plan = await subscriptionRepo.findPlanByStripePriceId(priceId)
      if (!plan && unitAmount) {
        const amount = Math.round(unitAmount / 100)
        plan = await subscriptionRepo.findPlanByPrice(amount)
      }
      return plan
    }

    // Create or update the subscription row for a user (the update path
    // leaves any existing Razorpay identifiers untouched, matching the
    // Prisma upsert this replaces)
    const upsertSubscriptionByUser = async (
      userId: string,
      planId: string,
      stripeCustomerId: string,
      stripeSubscriptionId: string,
      stripePriceId: string,
      periodStart: Date,
      periodEnd: Date
    ) => {
      const existing = await subscriptionRepo.findByUserId(userId, SYSTEM_REQUESTER)
      if (existing) {
        await subscriptionRepo.update(
          existing.id,
          {
            planId,
            stripeSubscriptionId,
            stripePriceId,
            status: 'ACTIVE',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          SYSTEM_REQUESTER
        )
      } else {
        await subscriptionRepo.create(
          userId,
          {
            planId,
            stripeCustomerId,
            stripeSubscriptionId,
            stripePriceId,
            status: 'ACTIVE',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
          SYSTEM_REQUESTER
        )
      }
    }

    // Update crew profile tier (warn-and-continue if the profile is missing)
    const updateCrewTier = async (
      label: string,
      userId: string,
      data: Parameters<typeof crewProfileRepo.updateByUserId>[1]
    ) => {
      const updatedCrew = await crewProfileRepo.updateByUserId(userId, data, SYSTEM_REQUESTER)
      if (!updatedCrew) {
        console.warn(`${label}: CrewProfile not found for user, skipping tier update:`, userId)
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        try {
          if (session.mode === 'subscription' && session.subscription) {
            const subscription = await getStripe().subscriptions.retrieve(
              session.subscription as string,
              { expand: ['items.data.price'] }
            ) as any // Stripe Response type doesn't expose all properties

            const customerId = session.customer as string
            const subscriptionId = subscription.id
            const priceId = subscription.items.data[0].price.id

            // Find user by Stripe customer ID
            const customer = await getStripe().customers.retrieve(customerId)
            let userId = (customer as Stripe.Customer).metadata?.userId as string | undefined

            // Fallback: resolve user by email if metadata is missing
            if (!userId) {
              const customerEmail = (customer as Stripe.Customer).email
              if (customerEmail) {
                const user = await userRepo.findByEmail(customerEmail, SYSTEM_REQUESTER)
                if (user) {
                  userId = user.id
                }
              }
            }

            if (!userId) {
              console.error('checkout.session.completed: No userId found for customer. Missing metadata and email lookup failed.')
              break
            }

            // Find the plan by Stripe price ID (primary) or fallback by amount
            let plan = await resolvePlan(priceId, subscription.items.data[0].price.unit_amount)

            if (!plan) {
              console.error('checkout.session.completed: No plan found for price ID or amount match:', priceId)
              break
            }

            // Create or update subscription record
            await upsertSubscriptionByUser(
              userId,
              plan.id,
              customerId,
              subscriptionId,
              priceId,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000)
            )

            // Update crew profile tier (guard if profile missing)
            const subscriptionTier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
            await updateCrewTier('checkout.session.completed', userId, { subscriptionTier })

          }
        } catch (e) {
          console.error('checkout.session.completed handler error:', e)
          // Do not rethrow to avoid 500s; log the error for investigation
        }
        break
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as any
        try {
          const customerId = subscription.customer as string
          const subscriptionId = subscription.id
          const priceId = subscription.items.data[0].price.id

          // Resolve user
          const customer = await getStripe().customers.retrieve(customerId)
          let userId = (customer as Stripe.Customer).metadata?.userId as string | undefined
          if (!userId) {
            const customerEmail = (customer as Stripe.Customer).email
            if (customerEmail) {
              const user = await userRepo.findByEmail(customerEmail, SYSTEM_REQUESTER)
              if (user) userId = user.id
            }
          }
          if (!userId) {
            console.error('customer.subscription.created: No userId resolved for customer', customerId)
            break
          }

          // Map plan
          let plan = await resolvePlan(priceId, subscription.items.data[0].price.unit_amount)
          if (!plan) {
            console.error('customer.subscription.created: Plan not found for price', priceId)
            break
          }

          await upsertSubscriptionByUser(
            userId,
            plan.id,
            customerId,
            subscriptionId,
            priceId,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000)
          )

          const subscriptionTier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
          await updateCrewTier('customer.subscription.created', userId, { subscriptionTier })

          // Send welcome/activation email (best-effort)
          try {
            const cust = await getStripe().customers.retrieve(customerId)
            const emailTo = (cust as Stripe.Customer).email || ''
            if (emailTo) {
              const subject = `Your MissingCrew subscription is active - ${plan.name}`
              const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                  <h2 style="color: #2563eb;">Subscription Activated</h2>
                  <p>Hi${(cust as Stripe.Customer).name ? ' ' + (cust as Stripe.Customer).name : ''},</p>
                  <p>Your subscription to <strong>${plan.name}</strong> is now active. Enjoy the premium features!</p>
                  <p><a href="https://missingcrew.vercel.app/dashboard">Go to your dashboard</a></p>
                  <p>— The MissingCrew Team</p>
                </div>
              `
              await sendEmail({ to: emailTo, subject, html })
            }
          } catch (e) {
            console.error('customer.subscription.created: failed to send activation email', e)
          }

        } catch (e) {
          console.error('customer.subscription.created handler error:', e)
          // Do not rethrow to avoid Stripe retries; log and continue
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any // Stripe types don't expose all properties

        const existingSub = await subscriptionRepo.findByStripeSubscriptionId(subscription.id)

        if (existingSub) {
          const status =
            subscription.status === 'active' ? 'ACTIVE' :
            subscription.status === 'canceled' ? 'CANCELED' :
            subscription.status === 'past_due' ? 'PAST_DUE' :
            subscription.status === 'unpaid' ? 'UNPAID' : 'ACTIVE'

          await subscriptionRepo.update(existingSub.id, {
            status,
            currentPeriodStart: toSafeDate(subscription.current_period_start),
            currentPeriodEnd: toSafeDate(subscription.current_period_end, 30 * 24 * 60 * 60 * 1000),
          }, SYSTEM_REQUESTER)

        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        try {
          const existingSub = await subscriptionRepo.findByStripeSubscriptionId(subscription.id)

          if (existingSub) {
            await subscriptionRepo.update(existingSub.id, { status: 'CANCELED' }, SYSTEM_REQUESTER)

            // Downgrade to FREE_TRIAL (guard if profile missing)
            await updateCrewTier('customer.subscription.deleted', existingSub.userId, {
              subscriptionTier: 'FREE_TRIAL',
              trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days grace
            })

          }
        } catch (e) {
          console.error('customer.subscription.deleted handler error:', e)
          // Do not rethrow
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        try {
          // If we have a subscription ID on the invoice, upsert the subscription record
          const invoiceSubscriptionId = (invoice as any).subscription as string | undefined
          if (invoiceSubscriptionId) {
            const subscription = await getStripe().subscriptions.retrieve(invoiceSubscriptionId, {
              expand: ['items.data.price']
            }) as any

            const customerId = invoice.customer as string
            const subscriptionId = subscription.id
            const priceId = subscription.items.data[0].price.id

            // Resolve user from customer metadata or email
            const customer = await getStripe().customers.retrieve(customerId)
            let userId = (customer as Stripe.Customer).metadata?.userId as string | undefined
            if (!userId) {
              const customerEmail = (customer as Stripe.Customer).email
              if (customerEmail) {
                const user = await userRepo.findByEmail(customerEmail, SYSTEM_REQUESTER)
                if (user) userId = user.id
              }
            }
            if (!userId) {
              console.error('invoice.payment_succeeded: No userId resolved for customer', customerId)
              break
            }

            // Map plan by priceId or fallback by amount
            let plan = await resolvePlan(priceId, subscription.items.data[0].price.unit_amount)
            if (!plan) {
              console.error('invoice.payment_succeeded: Plan not found for price', priceId)
              break
            }

            await upsertSubscriptionByUser(
              userId,
              plan.id,
              customerId,
              subscriptionId,
              priceId,
              new Date(subscription.current_period_start * 1000),
              new Date(subscription.current_period_end * 1000)
            )

            const subscriptionTier = plan.name === 'Pro Profile' ? 'PRO' : 'BASIC'
            await updateCrewTier('invoice.payment_succeeded', userId, { subscriptionTier })

            // Send invoice email to customer (best-effort)
            try {
              const emailTo = invoice.customer_email || (customer as Stripe.Customer).email || ''
              if (emailTo) {
                const invoiceUrl = invoice.hosted_invoice_url || ''
                const invoicePdf = invoice.invoice_pdf || ''
                const planLabel = plan.name
                const amountRupees = (invoice.amount_paid ?? 0) / 100
                const subject = `Your MissingCrew invoice - ${planLabel}`
                const html = `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #2563eb;">Payment Successful</h2>
                    <p>Hi${(customer as Stripe.Customer).name ? ' ' + (customer as Stripe.Customer).name : ''},</p>
                    <p>Thank you for your payment. Your subscription to <strong>${planLabel}</strong> is now active.</p>
                    <p><strong>Amount:</strong> ₹${amountRupees.toFixed(2)}</p>
                    ${invoiceUrl ? `<p>You can view your invoice here: <a href="${invoiceUrl}">${invoiceUrl}</a></p>` : ''}
                    ${invoicePdf ? `<p>Download PDF: <a href="${invoicePdf}">Invoice PDF</a></p>` : ''}
                    <p>Need help? Reply to this email.</p>
                    <p>— The MissingCrew Team</p>
                  </div>
                `
                await sendEmail({ to: emailTo, subject, html })
              } else {
                console.warn('invoice.payment_succeeded: No email available on invoice/customer to send receipt')
              }
            } catch (e) {
              console.error('invoice.payment_succeeded: Failed to send email', e)
            }

          }
        } catch (e) {
          console.error('invoice.payment_succeeded handler error:', e)
          // Do not rethrow to avoid Stripe retries
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any // Stripe types don't expose all properties

        if (invoice.subscription && typeof invoice.subscription === 'string') {
          const existingSub = await subscriptionRepo.findByStripeSubscriptionId(invoice.subscription)

          if (existingSub) {
            await subscriptionRepo.update(existingSub.id, { status: 'PAST_DUE' }, SYSTEM_REQUESTER)
          }
        }

        break
      }

      default:
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
