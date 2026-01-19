"use client"
import React from 'react'
import { Activity, CreditCard, Database, FileText, Gauge, IndianRupee, ScanLine, TrendingUp, Users, Zap } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Legend
} from "recharts";
import Dropdown from '@/components/common/CustomDropdown';
const userGrowthData = [
  { month: "Jan", users: 3500 },
  { month: "Feb", users: 4800 },
  { month: "Mar", users: 6200 },
  { month: "Apr", users: 7500 },
  { month: "May", users: 8900 },
  { month: "Jun", users: 10200 },
  { month: "Jul", users: 13000 },
];

const revenueData = [
  { month: "Jan", revenue: 30000, subscriptions: 18000 },
  { month: "Feb", revenue: 32000, subscriptions: 28000 },
  { month: "Mar", revenue: 40000, subscriptions: 25000 },
  { month: "Apr", revenue: 42000, subscriptions: 27000 },
  { month: "May", revenue: 45000, subscriptions: 30000 },
  { month: "Jun", revenue: 50000, subscriptions: 32000 },
  { month: "Jul", revenue: 55000, subscriptions: 34000 },
];

const subscriptionData = [
  { name: "Free", value: 59 },
  { name: "Basic", value: 20 },
  { name: "Pro", value: 16 },
  { name: "Enterprise", value: 10 },
];

const COLORS = ["#3b82f6", "#facc15", "#f97316", "#ef4444"];

const recentActivity = [
  { name: "Venu", action: "Created a new resume", time: "2 minutes ago" },
  { name: "Hari", action: "Scanned their resume", time: "5 minutes ago" },
  { name: "Gowtham", action: "Upgraded to Pro", time: "12 minutes ago" },
  { name: "Shiva", action: "Applied to 3 jobs", time: "18 minutes ago" },
  { name: "Rudra", action: "Completed Profile setup", time: "25 minutes ago" },
  { name: "Ganesh", action: "Created a new resume", time: "32 minutes ago" },
];

const options = ["Today", "Last 7 Days", "Monthly"];

const AdminDashboard = () => {

  const handleSelection = (value: string) => {
    console.log("Selected option:", value);
  };

  return (
    <div>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='font-semibold text-xl'>Dashboard</h1>
          <p className='text-[#4A5565] text-xs'>Monitor key metrics and system performance</p>
        </div>
        <Dropdown
          options={options}
          defaultValue="Monthly"
          onChange={handleSelection}
          className="w-34"
        />
      </div>

      <div className='grid grid-cols-3 gap-4 my-8'>
        {/* Total users */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>Total Users</h1>
              <p>9000</p>
            </div>
            <Users className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +12%
            </span>
            from last month
          </p>
        </div>

        {/* Active users */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>Active Users</h1>
              <p>8100</p>
            </div>
            <TrendingUp className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +12%
            </span>
            from last month
          </p>
        </div>

        {/* Resumes Created */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>Resumes Created</h1>
              <p>7500</p>
            </div>
            <FileText className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +15.5%
            </span>
            from last month
          </p>
        </div>

        {/* ATS Scans */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>ATS Scans</h1>
              <p>6818</p>
            </div>
            <ScanLine className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +24%
            </span>
            from last month
          </p>
        </div>

        {/* Revenue */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>Revenue</h1>
              <p>₹50000</p>
            </div>
            <IndianRupee className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +14.2%
            </span>
            from last month
          </p>
        </div>

        {/* Subscriptions */}
        <div className='bg-white rounded-lg p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-[#4A5565] text-sm'>Subscriptions</h1>
              <p>2720</p>
            </div>
            <CreditCard className='w-6 h-6' />
          </div>
          <p className='text-[#6A7282] text-sm flex  gap-2'>
            <span className='text-[#00A63E] flex gap-2 items-center'>
              <TrendingUp className='w-4 h-4' />
              +8.5%
            </span>
            from last month
          </p>
        </div>
      </div>
      <div className='bg-white p-4 my-4 rounded-lg'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='font-semibold text-lg'>Real-Time Statistics</h1>
            <p className='text-[#6A7282] text-sm'>Live system metrics</p>
          </div>
          <div className='rounded-lg border border-[#00C950] px-2 py-1 w-fit text-sm flex items-center gap-2'>
            <div className='w-2 h-2 rounded-full bg-[#00C950]'></div>
            <span className='text-[#00A63E]'>Live</span>
          </div>
          <div className='text-sm font-semibold text-[#4A5565]'>
            Auto-refresh (30s)
          </div>
        </div>
        <div className='grid grid-cols-5 gap-4 my-4'>
          <div className='bg-[#DBEAFE] p-4 flex flex-col gap-2 items-center rounded-xl'>
            <Users className='w-6 h-6 text-[#155DFC]' />
            <p>298</p>
            <p className='text-[#4A5565]'>Users Online</p>
          </div>
          <div className='bg-[#E0E7FF] p-4 flex flex-col gap-2 items-center rounded-xl'>
            <Activity className='w-6 h-6 text-[#4F39F6]' />
            <p>413</p>
            <p className='text-[#4A5565]'>Active Sessions</p>
          </div>
          <div className='bg-[#F3E8FF] p-4 flex flex-col gap-2 items-center rounded-xl'>
            <Zap className='w-6 h-6 text-[#9810FA]' />
            <p>1894</p>
            <p className='text-[#4A5565]'>API Requests/min</p>
          </div>
          <div className='bg-[#FCE7F3] p-4 flex flex-col gap-2 items-center rounded-xl'>
            <Database className='w-6 h-6 text-[#E60076]' />
            <p>4426</p>
            <p className='text-[#4A5565]'>DB Queries/sec</p>
          </div>
          <div className='bg-[#DCFCE7] p-4 flex flex-col gap-2 items-center rounded-xl'>
            <Gauge className='w-6 h-6 text-[#00A63E]' />
            <p>298</p>
            <p className='text-[#4A5565]'>Cache Hit Rate</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-screen">
        {/* User Growth */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">User Growth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue & Subscriptions */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold  mb-3">Revenue & Subscriptions</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" />
              <Bar dataKey="subscriptions" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold  mb-3">Subscription Breakdown</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={subscriptionData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-3 text-center text-sm">
            {subscriptionData.map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[i] }}
                ></span>
                <span>{item.value}% {item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow p-4">
          <h2 className="font-semibold mb-3">Recent Activity</h2>
          <ul>
            {recentActivity.map((item, index) => (
              <li key={index} className="flex justify-between py-2 border-b border-gray-100">
                <div className='flex gap-2'>
                  <div className='flex items-center justify-center bg-[#DBEAFE] w-8 h-8 rounded-full text-[#155DFC]'>
                    <p>{item.name.charAt(0)}</p>
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-[#4A5565]">{item.action}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{item.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard