import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { fetchPaymentLinkById } from './app/dashboard/actions/dashboard'

export async function middleware(request: NextRequest) {
  // Check if the request is for a payment link
  if (request.nextUrl.pathname.startsWith('/pay/')) {
    // Extract the payment ID from the URL
    const paymentId = request.nextUrl.pathname.replace('/pay/', '')

    try {
      // Fetch the custom payment link using the payment ID
      const customLink = await fetchPaymentLinkById(paymentId)

      // Construct the Stripe URL
      const stripeUrl = `${customLink}`

      // Return a redirect response to Stripe URL
      return NextResponse.redirect(stripeUrl)
    } catch (error) {
      // Handle errors (e.g., payment link not found)
      return NextResponse.redirect('/error')  // Redirect to an error page if payment link is not found
    }
  }

  // Continue with the request if it's not a payment link
  return NextResponse.next()
}

// Configure matcher for the middleware
export const config = {
  matcher: '/pay/:path*'
}
