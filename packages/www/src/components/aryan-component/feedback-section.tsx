'use client'

import { IconStarFilled } from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { useEffect, useState } from 'react'

const feedbackData = [
  {
    id: 1,
    content: "We can now onboard non-web3 participants using traditional payment methods, allowing them to engage in the ecosystem without the steep learning curve associated with purchasing and bridging different cryptocurrencies on different blockchain",
    author: "Benjamin Life",
    role: "Open Civics",
    avatar: "https://media.licdn.com/dms/image/v2/D5603AQH9ZncYF5ao1A/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1720406360825?e=1743638400&v=beta&t=p-ptV8GCpZprYTvCVnHgte62EsFpGx7GYWBaXzX9lIY",
    rating: 4
  },
  {
    id: 2,
    content: "Normie Tech’s seamless PayPal integration was a game-changer for our BioFi Pathfinders Round, making it significantly more accessible to the broader bioregional and environmental movement. Their expertise ensured we could reach a wider audience beyond the Web3 space, allowing for more inclusive participation",
    author: "Monty Merlin",
    role: "Celo PG",
    avatar: "https://media.licdn.com/dms/image/v2/D5603AQGQ9ETme8urVg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1730749028619?e=1743638400&v=beta&t=71YyoVs4Zpqbl-8hOoSzUmyH8_9yAYaO2oIW8f2Ih94",
    rating: 5
  },
  {
    id: 3,
    content: "I was most impressed with their integration into the Gitcoin community rounds. Being able to donate via credit card and verifying uniqueness through bank account was a gamechanger",
    author: "Devansh Mehta",
    role: "Voicedeck",
    avatar: "https://media.licdn.com/dms/image/v2/C4D03AQHev-Ivlsu1pQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1657654999431?e=1743638400&v=beta&t=PMQ9JES3LoURizOUHWUNgfMKJIJsi8GoXQwvx8me1es",
    rating: 5
  },
  // {
  //   id: 4,
  //   content: "Adipisicing elit. Deleniti consequatur sapiente magnam minima delectus voluptates? Vero dolor temporibus laudantium? Blanditiis non labore, animi dolorem sequi libero veritatis doloremque vitae iure?",
  //   author: "Emma",
  //   role: "COO, Fourth Company",
  //   avatar: "https://github.com/emma.png",
  //   rating: 4
  // },
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
  <Card className="p-4 w-full max-w-sm mx-auto my-24">
    {/* <div className="flex items-center space-x-1 mb-2">
      {[...Array(feedback.rating)].map((_, i) => (
        <IconStarFilled key={i} className="text-[#00B67A]" />
      ))}
    </div> */}
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
          className="w-full "
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
          <div className="md:absolute  md:hidden top-0 left-0 right-0 h-full flex items-center justify-between pointer-events-none">
            <CarouselPrevious className="absolute left-0 lg:left-[-3rem] translate-x-0 pointer-events-auto transform -translate-y-1/2 top-1/2" />
            <CarouselNext className="absolute right-0 lg:right-[-3rem] translate-x-0 pointer-events-auto transform -translate-y-1/2 top-1/2" />
          </div>
        </Carousel>
      </div>
    </div>
  )
}

