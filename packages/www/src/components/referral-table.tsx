'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getReferralStats, ReferralStat } from '../actions/leaderboard'

export function ReferralTable() {
  const [referralStats, setReferralStats] = useState<ReferralStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchReferralStats() {
      try {
        const stats = await getReferralStats()
        setReferralStats(stats)
        setIsLoading(false)
      } catch (err) {
        setError('Failed to fetch referral stats')
        setIsLoading(false)
      }
    }

    fetchReferralStats()
  }, [])

  if (isLoading) return <div className="text-center p-4">Loading...</div>
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Top Referrals</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Rank</TableHead>
              <TableHead>Referral</TableHead>
              <TableHead className="text-right">Total Fees Earned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referralStats.map((stat, index) => (
              <TableRow key={stat.referral}>
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell>{stat.referral}</TableCell>
                <TableCell className="text-right">
                  ${stat.totalFees.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

