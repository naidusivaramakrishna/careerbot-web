"use client"

import React from 'react'
import { Ticket, CircleDot, Clock, Hourglass, CheckCircle2, AlertTriangle } from 'lucide-react'
import { TicketStatsResponse } from '@/api/adminTicketApi'

interface TicketSummaryCardsProps {
  stats: TicketStatsResponse | null
  isLoading?: boolean
}

const TicketSummaryCards: React.FC<TicketSummaryCardsProps> = ({ stats, isLoading = false }) => {
  const cards = [
    { title: 'Total Tickets', value: stats?.total, icon: Ticket, card: 'bg-blue-50 border-blue-100', iconBox: 'bg-blue-100 text-blue-600' },
    { title: 'Open', value: stats?.open, icon: CircleDot, card: 'bg-red-50 border-red-100', iconBox: 'bg-red-100 text-red-600' },
    { title: 'In Progress', value: stats?.in_progress, icon: Clock, card: 'bg-amber-50 border-amber-100', iconBox: 'bg-amber-100 text-amber-600' },
    { title: 'Waiting for User', value: stats?.waiting_user, icon: Hourglass, card: 'bg-violet-50 border-violet-100', iconBox: 'bg-violet-100 text-violet-600' },
    { title: 'Resolved', value: stats?.resolved, icon: CheckCircle2, card: 'bg-green-50 border-green-100', iconBox: 'bg-green-100 text-green-600' },
    { title: 'Urgent', value: stats?.urgent, icon: AlertTriangle, card: 'bg-rose-50 border-rose-100', iconBox: 'bg-rose-100 text-rose-600' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map(({ title, value, icon: Icon, card, iconBox }) => (
        <div key={title} className={`${card} rounded-xl border p-4 shadow-sm`}>
          <div className="flex items-center gap-3">
            <div className={`${iconBox} p-2.5 rounded-lg`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-gray-600">{title}</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{isLoading || value === undefined ? '–' : value}</p>
        </div>
      ))}
    </div>
  )
}

export default TicketSummaryCards
