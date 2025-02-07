import React from 'react'

export default function TermsOfService() {
  return (
    <div className="p-6 max-w-6xl mx-auto mt-12">
    <h1 className="text-3xl font-bold mb-4">Normie Tech Terms of Service</h1>
    <p className="text-sm text-gray-500 mb-6">Last Updated: 01 Feb, 2025</p>
    
    <p>Welcome to Normie Tech! These Terms of Service ("Terms") govern your access and use of Normie Tech's services, provided by Sonder Enterprises, Inc., a Delaware corporation ("Company," "we," or "us"). By using our services, you agree to these Terms. If you do not agree, do not use our services.</p>

    <h2 className="text-2xl font-semibold mt-6">1. Services Overview</h2>
    <p>Normie Tech acts as the Merchant of Record (MoR) for your transactions, enabling businesses to accept global credit card payments, with payments converted and deposited in real-time as stablecoins. As your MoR, we are the seller of record for all transactions processed through our platform.</p>

    <h2 className="text-2xl font-semibold mt-6">2. Eligibility</h2>
    <p>Our services are available to businesses, including sole proprietorships, that:</p>
    <ul className="list-disc ml-6">
      <li>Complete a Know Your Business (KYB) process</li>
      <li>Operate in compliance with U.S. laws and are not subject to sanctions</li>
      <li>Provide accurate tax information and documentation for payment processing</li>
    </ul>
    <p>By using our services, you confirm:</p>
    <ul className="list-disc ml-6">
      <li>You represent a legitimate business</li>
      <li>Your activities are legal and not subject to U.S. sanctions</li>
    </ul>
    <p>We reserve the right to refuse service to entities engaged in prohibited activities or operating in restricted jurisdictions.</p>

    <h2 className="text-2xl font-semibold mt-6">3. Prohibited Uses</h2>
    <p>You agree not to use Normie Tech's services for:</p>
    <ul className="list-disc ml-6">
      <li>Illegal activities</li>
      <li>Transactions involving sanctioned countries or entities as defined by the United States</li>
      <li>Activities violating any local, national, or international laws</li>
    </ul>

    <h2 className="text-2xl font-semibold mt-6">4. Responsibilities</h2>
    <h3 className="text-xl font-medium">Merchants:</h3>
    <ul className="list-disc ml-6">
      <li>Ensuring accurate wallet addresses and safeguarding private keys</li>
      <li>Responding promptly to customer disputes and chargeback inquiries</li>
      <li>Maintaining sufficient funds to cover potential disputes and refunds</li>
      <li>Providing necessary documentation for dispute resolution</li>
    </ul>

    <h3 className="text-xl font-medium mt-4">Dispute Resolution:</h3>
    <ul className="list-disc ml-6">
      <li>Notify you of any disputes or chargebacks</li>
      <li>Deduct dispute-related costs and refunds from your payouts or reserve</li>
      <li>Maintain a floating reserve from your payouts to cover potential disputes</li>
      <li>Process refunds and chargebacks according to card network rules</li>
    </ul>

    <h2 className="text-2xl font-semibold mt-6">5. Reserves and Payment Terms</h2>
    <p>We maintain a floating reserve from your payouts to cover potential disputes, chargebacks, and refunds. Reserve amounts are calculated based on your transaction volume and risk profile. Additional reserves may be required based on dispute history or business risk. We may invoice you for any shortfall in dispute or refund coverage. Reserve funds will be released according to our reserve schedule, typically 180 days after the transaction date.</p>

    <h2 className="text-2xl font-semibold mt-6">6. Payment Processing</h2>
    <p>We process transactions as the merchant of record. Transactions are converted and transferred to your provided cryptocurrency wallet, less applicable reserves and fees. We maintain the right to adjust payout schedules based on risk assessment. Settlement timing and frequency are subject to our policies and risk evaluation.</p>

    <h2 className="text-2xl font-semibold mt-6">7. Tax Responsibilities</h2>
    <p>You acknowledge and agree that:</p>
    <ul className="list-disc ml-6">
      <li>As the MoR, we will report transaction data to tax authorities as required by law</li>
      <li>You must provide accurate tax information and documentation for proper reporting</li>
      <li>You remain responsible for your own tax obligations, including income tax</li>
      <li>We will issue appropriate tax forms (e.g., 1099-K) as required by law</li>
      <li>You must notify us promptly of any changes to your tax information</li>
    </ul>

    <h2 className="text-2xl font-semibold mt-6">8. Data Collection and Privacy</h2>
    <p>Normie Tech collects and processes user data as required for KYB and transaction processing. By using our services, you consent to the collection and processing of data necessary for providing our services.</p>

    <h2 className="text-2xl font-semibold mt-6">9. Ownership and Intellectual Property</h2>
    <p>Normie Tech owns all software, trademarks, and proprietary technology used in delivering the service. Unauthorized use or reproduction is prohibited. Clients may only use Normie Tech branding with explicit written permission.</p>

    <h2 className="text-2xl font-semibold mt-6">10. Termination</h2>
    <p>We reserve the right to terminate or suspend your access to our services at our discretion, including but not limited to:</p>
    <ul className="list-disc ml-6">
      <li>Breach of these Terms</li>
      <li>Involvement in prohibited activities</li>
      <li>Regulatory requirements or compliance concerns</li>
      <li>Excessive disputes or chargebacks</li>
    </ul>
    <p>Termination notices will be provided via email.</p>

    <h2 className="text-2xl font-semibold mt-6">11. Updates to Terms</h2>
    <p>Normie Tech reserves the right to update these Terms at any time. Updates will be communicated via email. Continued use of the services constitutes acceptance of the updated Terms.</p>

    <h2 className="text-2xl font-semibold mt-6">12. Governing Law</h2>
    <p>These Terms are governed by the laws of the State of Delaware, USA. Any disputes arising from these Terms or services will be subject to the exclusive jurisdiction of Delaware courts.</p>

    <h2 className="text-2xl font-semibold mt-6">13. Contact Information</h2>
    <p>For inquiries or support, contact us at: <a href="mailto:support@normie.tech" className="text-blue-500 underline">support@normie.tech</a></p>
  </div>
  )
}
