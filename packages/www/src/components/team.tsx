import Image from 'next/image'
import { useState } from 'react'

interface TeamMember {
  id: number
  name: string
  imageUrl: string
  rotation: number
}

const teamMembers: TeamMember[] = [
  { id: 1, name: 'Noah Chon Lee', imageUrl: 'https://media.licdn.com/dms/image/v2/D4E03AQEIl7Zcv2P6fA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1718251011461?e=1730937600&v=beta&t=3YKId4L0HumhNJn7vtDfXPyeXb8QlM4SQ8OtNoshoDs', rotation: -3 },
  { id: 2, name: 'Dipanshu Singh', imageUrl: 'https://media.licdn.com/dms/image/v2/C5603AQGXqAGj7Y9unw/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1643900832409?e=1730937600&v=beta&t=vjr0WImKx7CvN5FLlhqhqgpc1SkDV_lnuybozniwgU0', rotation: 4 },
  { id: 3, name: 'Nithin Mengani', imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQEmqK-2gsHTaA/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1676211040964?e=1730937600&v=beta&t=io1zSINJ5G04AZ7mspZ1K6hbQmjGiLskLm057lX-XKY', rotation: -2 },
  { id: 4, name: 'Swaraj Bachu', imageUrl: 'https://media.licdn.com/dms/image/v2/D4D03AQE3ulFkm99eFg/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1666785728361?e=1730937600&v=beta&t=W3s9l3n15-r_8Rqm2EKh-ATgpjWqj7hSj6mcIQuhnVo', rotation: 3 },
  { id: 5, name: 'Aryan Tiwari', imageUrl: 'https://media.licdn.com/dms/image/v2/D5603AQGsnS_CgdZSrg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1727976181403?e=1735171200&v=beta&t=u3fZwphHDRTywRmzQ82Zmj9uuAgWw6iuXd99gTT3iAA', rotation: -4 },
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