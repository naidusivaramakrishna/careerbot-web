"use client"
import { Crown, MessageSquare, Settings, Sparkles, Upload } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useProfileContext } from '../context/ProfileContext'
import { ProfileData } from '../_types/ProfileData'
import Image from 'next/image'

const RightSection = () => {
    const { profileData } = useProfileContext()
    const [completionPercentage, setCompletionPercentage] = useState(0)

    // Calculate profile completion percentage
    const calculateCompletion = (profile: ProfileData): number => {
        if (!profile) return 0

        let filledSections = 0
        const totalSections = 5 // Personal Info, Education, Work Experience, Skills, Employment Info

        // 1. Personal Information - Check if key fields are filled
        if (profile?.personalInformation) {
            const { fullName, email, phone, location, headline, summary } = profile.personalInformation
            if (fullName && email && (phone || location || headline || summary)) {
                filledSections++
                console.log('✅ Personal Information: Complete')
            } else {
                console.log('❌ Personal Information: Incomplete', { fullName, email, phone, location, headline, summary })
            }
        }

        // 2. Education - Check if at least one education entry exists
        if (profile?.education && profile.education.length > 0) {
            const hasValidEducation = profile.education.some(
                edu => edu.institution && edu.degree
            )
            if (hasValidEducation) {
                filledSections++
                console.log('✅ Education: Complete')
            } else {
                console.log('❌ Education: Incomplete', profile.education)
            }
        } else {
            console.log('❌ Education: No entries')
        }

        // 3. Work Experience - Check if at least one experience exists
        if (profile?.workExperience && profile.workExperience.length > 0) {
            const hasValidExperience = profile.workExperience.some(
                exp => exp.company && exp.job_title // Fixed: use job_title instead of position
            )
            if (hasValidExperience) {
                filledSections++
                console.log('✅ Work Experience: Complete')
            } else {
                console.log('❌ Work Experience: Incomplete', profile.workExperience)
            }
        } else {
            console.log('❌ Work Experience: No entries')
        }

        // 4. Skills - Check if at least one skill exists
        if (profile?.skills && profile.skills.length > 0) {
            filledSections++
            console.log('✅ Skills: Complete', profile.skills)
        } else {
            console.log('❌ Skills: No entries')
        }

        // 5. Employment Info - Check if any field is filled
        if (profile?.employmentInfo) { // Fixed: use employmentInfo instead of employmentInformation
            const {
                authorized_to_work,
                disability_status,
                gender,
                willing_to_relocate,
                employment_status,
                work_mode,
                preferred_job_type,
                notice_period_days,
                preferred_industries,
                preferred_roles,
                preferred_locations
            } = profile.employmentInfo

            if (authorized_to_work !== undefined ||
                disability_status ||
                gender ||
                willing_to_relocate !== undefined ||
                employment_status ||
                work_mode ||
                preferred_job_type ||
                notice_period_days ||
                (preferred_industries && preferred_industries.length > 0) ||
                (preferred_roles && preferred_roles.length > 0) ||
                (preferred_locations && preferred_locations.length > 0)) {
                filledSections++
                console.log('✅ Employment Info: Complete')
            } else {
                console.log('❌ Employment Info: Incomplete', profile.employmentInfo)
            }
        } else {
            console.log('❌ Employment Info: No data')
        }

        // Calculate percentage (round to nearest whole number)
        const percentage = Math.round((filledSections / totalSections) * 100)
        console.log(`📊 Completion: ${filledSections}/${totalSections} sections = ${percentage}%`)
        return percentage
    }

    // Recalculate completion whenever profileData changes
    useEffect(() => {
        console.log('🔄 Profile data updated:', profileData)
        const newPercentage = calculateCompletion(profileData)
        console.log('📊 New percentage calculated:', newPercentage)
        setCompletionPercentage(newPercentage)
    }, [profileData])

    // Force recalculation on component mount and when data changes
    useEffect(() => {
        const percentage = calculateCompletion(profileData)
        setCompletionPercentage(percentage)
    }, [profileData?.education, profileData?.workExperience, profileData?.skills, profileData?.employmentInfo, profileData?.personalInformation])

    return (
        <div className='flex-1 w-1/5'>
            <div>
                <div className="bg-white p-4 rounded-xl my-4 shadow-sm">
                    <h3 className='my-4 font-semibold text-lg'>Quick Actions</h3>
                    <h3 className='my-4 text-sm'>Auto fill your profile within seconds.</h3>
                    <div className='flex flex-col gap-2 mt-2'>
                        <div className='flex items-center cursor-pointer gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-orange-200 rounded-lg'>
                            <Upload className='w-5 h-5' />
                            <span className='text-lg'>Upload Resume</span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 mt-2'>
                        <div className='flex items-center cursor-pointer gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-orange-200 rounded-lg'>
                            <Image src="/assets/icons/linkedin-icon.svg" alt='linkedin-icon' className='w-5 h-5' width={20} height={20} />
                            <span className='text-lg'>Import from Linkedin</span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 mt-2'>
                        <div className='flex items-center cursor-pointer gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-orange-200 rounded-lg'>
                            <Sparkles className='w-5 h-5' />
                            <span className='text-lg'>Improve with AI</span>
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 mt-2'>
                        <div className='flex items-center cursor-pointer gap-2 border p-2 bg-[#F9F9FA] border-gray-400 hover:bg-orange-200 rounded-lg'>
                            <Settings className='w-5 h-5' />
                            <span className='text-lg'>Manage Settings</span>
                        </div>
                    </div>
                </div>
                <div className="bg-[#F9F9FA] p-4 rounded-xl my-4 shadow-sm">
                    <div className='flex items-center justify-between'>
                        <h1 className='my-4 font-semibold text-xl'>Profile Completion</h1>
                        <div className='rounded-full border border-neutral-200 px-3 py-0.5'>
                            {completionPercentage}%
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className="bg-[#3e3197] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                        ></div>
                    </div>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl border border-[#2200FF33]/20 my-4 shadow bg-[#DAD5F9]">
                    <div className='w-16 h-16 text-white rounded-full flex items-center justify-center bg-gradient-to-r from-[#2200FF] to-[#1800B3]'>
                        <Crown className='w-10 h-10' />
                    </div>
                    <h3 className='my-4 font-semibold text-xl'>Upgrade to CareerBot Pro</h3>
                    <p className='text-center text-[#818798]'>Get unlimited job applications, AI resume optimization, and priority support.</p>
                    <button className='rounded-lg my-4 text-white border border-neutral-200 gap-2 cursor-pointer bg-gradient-to-r from-[#2200FF] to-[#1800B3] w-full px-4 py-3'>
                        <span>Upgrade Now</span>
                    </button>
                    <p className='text-sm text-[#818798]'>30 day money back guarantee</p>
                </div>
                <div className="flex flex-col items-center p-4 rounded-xl my-4 shadow bg-white">
                    <MessageSquare className='w-10 h-10 text-[#7B899D]' />
                    <h3 className='my-4 font-semibold text-[#344256] text-lg'>Need Help?</h3>
                    <p className='text-[#7B899D]'>Get expert advice on optimizing your profile.</p>
                    <button className='rounded-lg my-4 font-semibold text-black border border-[#DDE2E9] gap-2 cursor-pointer bg-[#F9F9FA] w-full px-4 py-3'>
                        <span className='text-[#344256]'>Contact Support</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RightSection