"use client"

import type React from "react"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlusCircle, Copy, ExternalLink, DollarSign, Upload, X } from "lucide-react"
import { createPaymentLink, fetchPaymentLinks } from "@/app/dashboard/actions/dashboard"
import { toast } from "sonner"

export default function PaymentLinkTab({ projectId, apiKey }: { projectId: string; apiKey: string }) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const {
    data: paymentLinks = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["paymentLinks", projectId],
    queryFn: () => fetchPaymentLinks(projectId),
    enabled: !!projectId,
  })

  // Function to get the custom URL using payment ID
  const getCustomUrl = (paymentId: string) => {
    return `${window.location.protocol}//${window.location.host}/pay/${paymentId}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Link copied to clipboard!")
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file")
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB")
        return
      }

      setSelectedImage(file)
      toast.success("Image uploaded successfully")

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  // Helper function to convert File to FormData
  const createFormDataFromFile = async (file: File) => {
    const formData = new FormData()
    formData.append("image", file)
    return formData
  }

  const linkMutation = useMutation({
    mutationFn: async ({ name, price, image }: { name: string; price?: string; image?: File }) => {
      // Convert File to FormData if image exists
      let imageFormData: FormData | undefined = undefined
      if (image) {
        imageFormData = await createFormDataFromFile(image)
      }

      const res = await createPaymentLink(name, price, imageFormData)
      return res
    },
    onSuccess: async () => {
      await refetch()
      setName("")
      setPrice("")
      setSelectedImage(null)
      setImagePreview(null)
      toast.success("Payment link created successfully! You can see it below in the payment links table.")
    },
    onError: (error) => {
      toast.error("Failed to create payment link. Please try again.")
      console.error("Payment link creation error:", error)
    },
  })

  const handleCreatePaymentLink = async (e: React.FormEvent) => {
    e.preventDefault()
    await linkMutation.mutateAsync({
      name,
      price: price || undefined,
      image: selectedImage || undefined,
    })
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
            <fieldset disabled={linkMutation.isPending} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) - Optional</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-gray-500">Leave empty to allow customers to enter their own amount</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image - Optional</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {!imagePreview ? (
                    <div>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Label htmlFor="image" className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">Upload an image</span>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Product preview"
                        className="max-w-full h-32 object-cover rounded mx-auto"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                        disabled={linkMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <p className="text-xs text-gray-600 mt-2">{selectedImage?.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            <Button
              type="submit"
              className="bg-[#00B67A] text-white hover:bg-[#009966] w-full"
              disabled={linkMutation.isPending || !name.trim()}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {linkMutation.isPending ? "Creating..." : "Create Payment Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>Manage your payment links</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00B67A]"></div>
              <span className="ml-2 text-gray-600">Loading payment links...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error loading payment links</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try Again
              </Button>
            </div>
          ) : paymentLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No payment links created yet.</p>
              <p className="text-sm">Create your first payment link above to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Payment Link</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentLinks.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {link.product?.images?.[0] && (
                          <img
                            src={link.product.images[0] || "/placeholder.svg"}
                            alt={link.product?.name || "Product"}
                            className="w-8 h-8 object-cover rounded"
                          />
                        )}
                        <span className="font-medium">{link.product?.name || "Unnamed Product"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {link.product?.priceInFiat ? (
                        `$${link.product.priceInFiat.toFixed(2)}`
                      ) : (
                        <span className="text-gray-500">Variable</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={getCustomUrl(link.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate block max-w-xs"
                        title={getCustomUrl(link.id)}
                      >
                        {getCustomUrl(link.id)}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(getCustomUrl(link.id))}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={getCustomUrl(link.id)} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{link.createdAt ? new Date(link.createdAt).toLocaleDateString() : ""}</TableCell>
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
