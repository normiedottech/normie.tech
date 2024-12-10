'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Copy, ExternalLink } from 'lucide-react'
import { fetchPaymentLinks, getUserApiKey } from '@/app/dashboard/actions/dashboard'
import { normieTechClient } from '@/lib/normie-tech'
import { useSession } from 'next-auth/react'

export default function PaymentLinkTab({projectId,apiKey}:{projectId:string,apiKey:string}) {
  const [name, setName] = useState("")
  // Fetch payment links using React Query
  const { data: paymentLinks = [], isLoading, isError,refetch } = useQuery({
    queryKey: ['paymentLinks', projectId],
    queryFn: () => fetchPaymentLinks(projectId),
    enabled: !!projectId, // Ensures the query runs only if projectId is available
  })
  

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Link copied to clipboard")
  }
  const linkMutation = useMutation({
    mutationFn: async ({name}:{name:string}) => {


      const res = await normieTechClient.POST("/v1/{projectId}/0/payment-links",{
        body:{
          name,
        },
        params:{
          header:{
            "x-api-key":apiKey
          },
          path:{
            projectId:projectId
          }
        }
      })
      
    },
    onSuccess: async () => {
      await refetch()
      setName(''); // Clear input field
    }
  })

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await linkMutation.mutateAsync({name})
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Payment Link</CardTitle>
          <CardDescription>Generate a new payment link for your customers</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePaymentLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter payment link name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" >
              <PlusCircle className="mr-2 h-4 w-4" />
              {linkMutation.isPending ? "Loading..." : "Create Payment Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Link Information</CardTitle>
          <CardDescription>List of all created payment links</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : isError ? (
            <p>Error loading payment links</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                 
                  <TableHead>Link</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentLinks.map((link) => (
                  <TableRow key={link.id}>
                
                    <TableCell>
                      <a href={link.link} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        {link.link}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(link.link)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={link.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
