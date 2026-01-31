import { Globe } from 'lucide-react'
import React from 'react'

const Footer = () => {
    return (
        <div className='py-4  my-4 shadow-lg flex items-center border border-t-2 border-b-2 border-gray-300  justify-between bg-white px-8'>
            <div><p className='text-sm'>&copy; 2025 CareerBot</p></div>
            <div className='flex gap-4 text-sm'>
                <div className='flex gap-2 items-center'>
                    <Globe className='w-4 h-4 ' />
                    <span>English (i18n)</span>
                </div>
                <span>Privacy</span>
                <span>Terms</span>
            </div>
        </div>
    )
}

export default Footer
