import { ReferralTable } from '@/components/referral-table'

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Referral Statistics</h1>
      <ReferralTable />
    </main>
  )
}

