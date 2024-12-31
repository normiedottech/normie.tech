// app/pay/[...slug]/page.tsx
import { redirect } from 'next/navigation'

export default async function PaymentPage({
  params
}: {
  params: { slug: string[] }
}) {
  const paymentId = params.slug.join('/')
  
  const stripeUrl = `https://buy.stripe.com/${paymentId}`
  redirect(stripeUrl)
}