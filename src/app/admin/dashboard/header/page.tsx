"use client";
import { getCurrentAdmin } from '@/api/adminAuthApi';
import { Bell } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

interface AdminInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
}

const AdminHeader = () => {
  const [adminInfo, setAdminInfo] = useState<AdminInfo>({
    id: '',
    name: 'Admin',
    role: 'Administrator',
    email: '',
    status: 'ACTIVE'
  });
  const [loading, setLoading] = useState(true);

  // Format role for display
  const formatRole = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'admin':
        return 'Administrator';
      case 'moderator':
        return 'Moderator';
      case 'support':
        return 'Support';
      default:
        return role;
    }
  };
  // Fetch current admin details from API
  const fetchAdminDetails = async () => {
    try {
      setLoading(true);

      const details = await getCurrentAdmin();

      setAdminInfo({
        id: details.id,
        name: details.full_name || details.username || 'Admin',
        role: formatRole(details.role),
        email: details.email,
        status: details.status
      });

      logger.info('Current admin details loaded', { adminId: details.id, role: details.role });

    } catch (error) {
      logger.error('Failed to fetch current admin details:', error);

      // Don't show error to user, just use defaults
      setAdminInfo({
        id: '',
        name: 'Admin',
        role: 'Administrator',
        email: '',
        status: 'ACTIVE'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDetails();

    // Listen for admin token updates (when user logs in)
    const handleTokenUpdate = () => {
      logger.debug('Token updated, refetching admin details');
      fetchAdminDetails();
    };

    window.addEventListener('adminTokenUpdated', handleTokenUpdate);

    return () => {
      window.removeEventListener('adminTokenUpdated', handleTokenUpdate);
    };
  }, []);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='border-b py-2 border-[#E5E7EB]'>
      <div className='flex gap-4 pr-8 items-center justify-self-end'>
        <div className='flex items-center gap-4'>
          <div>
            {loading ? (
              <>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse mb-1'></div>
                <div className='h-3 w-20 bg-gray-200 rounded animate-pulse'></div>
              </>
            ) : (
              <>
                <h1 className='text-sm font-medium text-gray-900'>
                  {adminInfo.name}
                </h1>
                <p className='text-[#6A7282] text-xs'>
                  {adminInfo.role}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminHeader
