'use client'

import { IconStarFilled } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { useEffect, useState } from 'react'

const feedbackData = [
  {
    id: 1,
    content: "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Deleniti consequatur sapiente magnam minima delectus voluptates? Vero dolor temporibus laudantium? Blanditiis non labore, animi dolorem sequi libero veritatis doloremque vitae iure?",
    author: "Shad",
    role: "CEO, Company",
    avatar: "https://github.com/shadcn.png",
    rating: 4
  },
  {
    id: 2,
    content: "Dolor sit amet consectetur adipisicing elit. Deleniti consequatur sapiente magnam minima delectus voluptates? Vero dolor temporibus laudantium? Blanditiis non labore, animi dolorem sequi libero veritatis doloremque vitae iure?",
    author: "Jane",
    role: "CTO, Another Company",
    avatar: "https://github.com/jane.png",
    rating: 5
  },
  {
    id: 3,
    content: "Consectetur adipisicing elit. Deleniti consequatur sapiente magnam minima delectus voluptates? Vero dolor temporibus laudantium? Blanditiis non labore, animi dolorem sequi libero veritatis doloremque vitae iure?",
    author: "John",
    role: "CFO, Third Company",
    avatar: "https://github.com/john.png",
    rating: 5
  },
  {
    id: 4,
    content: "Adipisicing elit. Deleniti consequatur sapiente magnam minima delectus voluptates? Vero dolor temporibus laudantium? Blanditiis non labore, animi dolorem sequi libero veritatis doloremque vitae iure?",
    author: "Emma",
    role: "COO, Fourth Company",
    avatar: "https://github.com/emma.png",
    rating: 4
  },
  // Add more feedback items as needed
]

interface Feedback {
  id: number
  content: string
  author: string
  role: string
  avatar: string
  rating: number
}

const FeedbackCard = ({ feedback }: { feedback: Feedback }) => (
  <Card className="p-4 w-full max-w-sm mx-auto">
    <div className="flex items-center space-x-1 mb-2">
      {[...Array(feedback.rating)].map((_, i) => (
        <IconStarFilled key={i} className="text-yellow-400" />
      ))}
    </div>
    <p className="mb-4 text-sm">{feedback.content}</p>
    <div className="flex items-center space-x-2">
      <Avatar>
        <AvatarImage src={feedback.avatar} alt={feedback.author} />
        <AvatarFallback>{feedback.author.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div>
        <h2 className="font-semibold">{feedback.author}</h2>
        <p className="text-sm text-gray-500">{feedback.role}</p>
      </div>
    </div>
  </Card>
)

export default function FeedbackSection() {
  return (
    <div className="mx-auto px-4 md:px-10 my-20">
      <div className="w-full max-w-6xl mx-auto relative">
        <Carousel
          className="w-full"
          opts={{
            align: "start",
          }}
        >
          <CarouselContent>
            {feedbackData.map((feedback) => (
              <CarouselItem key={feedback.id} className="md:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <FeedbackCard feedback={feedback} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="md:absolute top-0 left-0 right-0 h-full flex items-center justify-between pointer-events-none">
            <CarouselPrevious className="absolute left-0 lg:left-[-3rem] translate-x-0 pointer-events-auto transform -translate-y-1/2 top-1/2" />
            <CarouselNext className="absolute right-0 lg:right-[-3rem] translate-x-0 pointer-events-auto transform -translate-y-1/2 top-1/2" />
          </div>
        </Carousel>
      </div>
    </div>
  )
}

