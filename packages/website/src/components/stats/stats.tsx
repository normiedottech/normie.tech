"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface SpeedometerStatProps {
  value: number
  label: string
  max: number
}

export default function SpeedometerStat({ value, label, max }: SpeedometerStatProps) {
  const [currentValue, setCurrentValue] = useState(0)
  
  useEffect(() => {
    const animationDuration = 2000 // 2 seconds
    const steps = 60
    const stepDuration = animationDuration / steps
    let step = 0

    const timer = setInterval(() => {
      step++
      setCurrentValue(prevValue => {
        const newValue = (value / steps) * step
        return newValue > value ? value : newValue
      })

      if (step >= steps) {
        clearInterval(timer)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [value])

  const percentage = (currentValue / max) * 100
  const dashArray = 283 // Circumference of a circle with r=45 (2 * PI * r)
  const dashOffset = dashArray - (dashArray * Math.min(percentage, 100)) / 100

  return (
    <Card className="w-48 h-48">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        <div className="relative w-full h-full">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-muted-foreground"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
            <circle
              className="text-primary transition-all duration-500 ease-out"
              strokeWidth="10"
              strokeDasharray={dashArray}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(currentValue).toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

