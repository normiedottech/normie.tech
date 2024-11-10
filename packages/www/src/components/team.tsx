import Image from 'next/image'
import { useState } from 'react'

interface TeamMember {
  id: number
  name: string
  imageUrl: string
  rotation: number
}

const teamMembers: TeamMember[] = [
  { id: 1, name: 'Noah Chon Lee', imageUrl: '/noah.jpg', rotation: -3 },
  { id: 2, name: 'Dipanshu Singh', imageUrl: '/dipanshu.webp', rotation: 4 },
  { id: 3, name: 'Nithin Mengani', imageUrl: '/nithin.webp', rotation: -2 },
  { id: 4, name: 'Swaraj Bachu', imageUrl: '/swaraj.webp', rotation: 3 },
  { id: 5, name: 'Aryan Tiwari', imageUrl: '/aryan.webp', rotation: -4 },
]

export default function TeamPolaroids() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  return (
    <div className="flex justify-center items-start space-x-4 py-8">
      {teamMembers.map((member) => (
        <div
          key={member.id}
          className="relative group"
          onMouseEnter={() => setHoveredId(member.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{ transform: `rotate(${member.rotation}deg)` }}
        >
          <div
            className={`
              relative w-[65px] bg-white
              transform transition-all duration-300 ease-in-out
              ${hoveredId === member.id ? 'scale-110 z-10' : ''}
              border-[1px] p-1 border-white rounded
              shadow-[inset_0_0_3px_rgba(0,0,0,0.24),0_4px_8px_-7px_rgba(31,28,28,0.12),0_16px_32px_-7px_rgba(31,28,28,0.04)]
            `}
          >
            <div className="overflow-hidden">
              <Image
                src={member.imageUrl}
                alt={member.name}
                width={55}
                height={55}
                className="w-full rounded object-cover filter saturate-[110%] brightness-95"
              />
            </div>
            <div className="h-[23px] flex items-center justify-center bg-white">
              <p className="text-black text-[8px] font-['Caveat',_cursive] leading-none">
                {member.name}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}