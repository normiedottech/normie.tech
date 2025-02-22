import BookNoahACall from '@/components/aryan-component/book-a-call'
import React from 'react'

export default function Booking() {
  return (
    <div className='min-h-[90vh] flex flex-col items-center justify-center'>
<h1 className='text-xl lg:text-2xl w-[50%] text-center'>
Thank you! We would be happy to chat. Contact us at support@normie.tech if these times don't work.
</h1>
<div className="w-[50%] flex justify-center mt-4">
<BookNoahACall/>
</div>
    </div>
  )
}
