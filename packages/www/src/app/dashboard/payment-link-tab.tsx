'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Link, Copy, ExternalLink } from 'lucide-react'

// Dummy data for existing payment links
const initialPaymentLinks = [
  { id: 1, title: "Monthly Subscription", description: "Access to premium content", url: "https://pay.example.com/monthly-sub", createdAt: "2023-06-01T10:00:00Z" },
  { id: 2, title: "One-time Donation", description: "Support our cause", url: "https://pay.example.com/donate", createdAt: "2023-06-10T14:30:00Z" },
]

export default function PaymentLinkTab() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [paymentLinks, setPaymentLinks] = useState(initialPaymentLinks)

  const handleCreatePaymentLink = (e: React.FormEvent) => {
    e.preventDefault()
    const newLink = {
      id: paymentLinks.length + 1,
      title,
      description,
      url: `https://pay.example.com/${title.toLowerCase().replace(/\s+/g, '-')}`,
      createdAt: new Date().toISOString(),
    }
    setPaymentLinks([newLink, ...paymentLinks])
    setTitle("")
    setDescription("")
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You might want to add a toast notification here
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter payment link title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter payment link description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <Button type="submit">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Payment Link
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>{link.title}</TableCell>
                  <TableCell>{link.description}</TableCell>
                  <TableCell>{new Date(link.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(link.url)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
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
        </CardContent>
      </Card>
    </div>
  )
}

