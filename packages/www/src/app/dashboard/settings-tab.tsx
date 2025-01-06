'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff } from 'lucide-react'

import { toast } from "@/hooks/use-toast"
import { FlexibleAlertDialog } from '@/components/flexible-alert-dialog'
import { switchApiKey } from './actions/dashboard'

interface SettingsTabProps {
  projectId: string
  initialApiKey: string
}

export function SettingsTab({ projectId, initialApiKey }: SettingsTabProps) {
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey)
  }

  const handleResetApiKey = async () => {
    setIsResetting(true)
    try {
      // Simulating API call with a dummy promise
      const res = await switchApiKey() 
      if(res.success){
        const newApiKey = res.apiKey
        setApiKey(newApiKey)
        toast({
          title: "Success",
          description: "API key has been reset successfully.",
        })
      }
      
    } catch (error) {
      console.error('Error resetting API key:', error)
      toast({
        title: "Error",
        description: "Failed to reset API key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
      setShowResetConfirmation(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Developer Settings</h3>
        
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex items-center space-x-2">
            <div className="relative flex-grow">
              <Input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                readOnly
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={toggleApiKeyVisibility}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={() => setShowResetConfirmation(true)}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset API Key"}
            </Button>
          </div>
        </div>
      </div>

      <FlexibleAlertDialog
        isOpen={showResetConfirmation}
        onOpenChange={setShowResetConfirmation}
        title="Are you sure you want to reset the API key?"
        description="This action cannot be undone. The old API key will be invalidated immediately."
        confirmText="Reset API Key"
        onConfirm={handleResetApiKey}
      />
    </div>
  )
}

