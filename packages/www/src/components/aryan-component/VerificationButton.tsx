"use client"
import { useState } from "react"
import type React from "react"

import axios from "axios"

const VerificationButton = () => {
  const [loading, setLoading] = useState(false)
  const [magicLink, setMagicLink] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleVerification = async () => {
    setLoading(true)
    try {
      const response = await axios.post("/api/register-user", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      })

      setMagicLink(response.data.magic_link)
    } catch (error) {
      console.error("Verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
            required
          />
        </div>

        <button
          onClick={handleVerification}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
        >
          {loading ? "Loading..." : "Verify Me"}
        </button>

        {magicLink && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-gray-700 mb-2">Click the link below to complete verification:</p>
            <a
              href={magicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm font-medium"
            >
              Complete Verification
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerificationButton

