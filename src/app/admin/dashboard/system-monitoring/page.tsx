"use client"
import Dropdown from '@/components/common/CustomDropdown'
import { Activity, Calendar, ChartLine, Cpu, Database, RefreshCw } from 'lucide-react'
import React, { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { HiOutlineLightBulb } from "react-icons/hi2";
import TimeTabs from '../../_components/TimeTabs';
import { BsCpuFill, BsFire } from "react-icons/bs";
import { GiCpu } from "react-icons/gi";
import { MdOutlineCalendarMonth } from "react-icons/md";

const apiData = [
    { time: "00:00", value: 480 },
    { time: "01:00", value: 560 },
    { time: "03:00", value: 600 },
    { time: "05:00", value: 680 },
    { time: "06:00", value: 620 },
    { time: "08:00", value: 610 },
    { time: "09:00", value: 950 },
    { time: "10:00", value: 900 },
    { time: "12:00", value: 820 },
    { time: "14:00", value: 750 },
];

const cpuData = [
    { time: "00:00", cpu: 50 },
    { time: "03:00", cpu: 62 },
    { time: "06:00", cpu: 66 },
    { time: "09:00", cpu: 72 },
    { time: "12:00", cpu: 75 },
    { time: "15:00", cpu: 78 },
    { time: "18:00", cpu: 70 },
    { time: "21:00", cpu: 48 },
];

const memoryData = [
    { time: "00:00", memory: 48 },
    { time: "03:00", memory: 52 },
    { time: "06:00", memory: 55 },
    { time: "09:00", memory: 58 },
    { time: "12:00", memory: 56 },
    { time: "15:00", memory: 54 },
    { time: "18:00", memory: 50 },
    { time: "21:00", memory: 45 },
];

const systemLogs = [
    { message: "High memory usage detected", level: "warning", source: "system", timestamp: "2025-02-12, 09:25" },
    { message: "Database connection timeout", level: "error", source: "database", timestamp: "2025-08-18, 12:25" },
    { message: "Cache cleared successfully", level: "info", source: "system", timestamp: "2025-04-28, 10:40" },
    { message: "API rate limit exceeded", level: "error", source: "API", timestamp: "2025-12-17, 15:18" },
]

const SystemMonitoring = () => {
    const [activeTab, setActiveTab] = useState("Today");
    const [showComparison, setShowComparison] = useState(false);
    const handleSelection = (value: string) => console.log("Selected:", value);

    return (
        <div>
            <div className='flex justify-between items-center'>
                <div>
                    <h1 className='font-semibold text-xl'>System Monitoring</h1>
                    <p className="text-[#4A5565] text-xs">
                        Monitor system health and performance metrics.
                    </p>
                </div>
                <div className='flex gap-4 '>
                    <Dropdown
                        options={["Auto-refresh", "Off", "On"]}
                        defaultValue="Auto-refresh"
                        bgColor="bg-gray-100"
                        bgOptions="bg-white"
                        onChange={handleSelection}
                        className="w-34"
                    />
                    <button className='bg-white flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm cursor-pointer'>
                        <RefreshCw className='w-4 h-4 ' />
                        Refresh
                    </button>
                </div>
            </div>
            <p className='text-[#62627D] text-xs my-4'>last refreshed: 11:30am</p>
            <div className='grid grid-cols-3 gap-4 my-8'>
                {/* API Health */}
                <div className='bg-white rounded-lg p-4'>
                    <div className='flex justify-between items-center'>
                        <div className='bg-[#DBEAFE] rounded-lg w-10 h-10 flex items-center justify-center'>
                            <Activity className='w-5 h-5 text-[#3B82F6]' />
                        </div>
                        <div className='text-sm py-1 px-4 text-[#3B82F6] bg-[#DBEAFE] rounded-lg'>Healthy</div>
                    </div>
                    <div className='my-4'>
                        <h1 className='text-[#64748B] text-sm'>API Health</h1>
                        <h1 className=''>All systems operational</h1>
                        <p className='text-[#64748B] text-sm mt-2'>Response Time: 40ms</p>
                    </div>
                </div>
                {/* Database Health */}
                <div className='bg-white rounded-lg p-4'>
                    <div className='flex justify-between items-center'>
                        <div className='bg-[#DBEAFE] rounded-lg w-10 h-10 flex items-center justify-center'>
                            <Database className='w-5 h-5 text-[#3B82F6]' />
                        </div>
                        <div className='text-sm py-1 px-4 text-[#3B82F6] bg-[#DBEAFE] rounded-lg'>Healthy</div>
                    </div>
                    <div className='my-4'>
                        <h1 className='text-[#64748B] text-sm'>Database Health</h1>
                        <h1 className=''>Connected & Optimized</h1>
                        <p className='text-[#64748B] text-sm mt-2'>Query Time: 12ms avg</p>
                    </div>
                </div>
                {/* Server Load */}
                <div className='bg-white rounded-lg p-4'>
                    <div className='flex justify-between items-center'>
                        <div className='bg-[#F3E8FF] rounded-lg w-10 h-10 flex items-center justify-center'>
                            <Cpu className='w-5 h-5 text-[#9810FA]' />
                        </div>
                        <div className='text-sm py-1 px-4 text-[#1447E6] bg-[#DBEAFE] rounded-lg'>Healthy</div>
                    </div>
                    <div className='my-4'>
                        <h1 className='text-[#64748B] text-sm'>Server Load</h1>
                        <h1 className=''>Moderate Usage</h1>
                        <p className='text-[#64748B] text-sm mt-2'>CPU: 36%</p>
                    </div>
                </div>
            </div>
            <div className='bg-white rounded-lg p-6'>
                <div className='flex justify-between my-4'>
                    <h1 className='font-semibold '>API Requests per Minute</h1>
                    {/* Tabs */}
                    <TimeTabs active={activeTab} onChange={setActiveTab} />
                </div>
                <div className='flex justify-end my-4'>
                    <div className='flex gap-2'>
                        <input type="radio" id='api-requests' />
                        <label htmlFor="api-requests" className='text-sm'>Compare to previous period</label>
                    </div>
                </div>

                <div className="flex justify-between">
                    <div className="grid grid-cols-4 gap-4 w-full">
                        <div className='bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                            <div>
                                <p className="text-xs text-gray-500">Today</p>
                                <h2 className="mt-1">12.4K</h2>
                            </div>
                            <Calendar className='w-5 h-5' />
                        </div>
                        <div className='bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                            <div>
                                <p className="text-xs text-gray-500">Yesterday</p>
                                <h2 className="mt-1">11.9K <span className="text-green-500 text-xs">+4.1%</span></h2>
                            </div>
                            <ChartLine className='w-5 h-5' />
                        </div>
                        <div className='bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                            <div>
                                <p className="text-xs text-gray-500">Last 7 days</p>
                                <h2 className="mt-1">82K</h2>
                            </div>
                            <MdOutlineCalendarMonth className='w-5 h-5' />
                        </div>
                        <div className='bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                            <div>
                                <p className="text-xs text-gray-500">Peak Load</p>
                                <h2 className="mt-1">1560 req/min</h2>
                            </div>
                            <BsFire className='w-5 h-5' />
                        </div>
                    </div>
                </div>
                {/* Chart */}
                <div className="h-64 max-w-2xl mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={apiData}>
                            <defs>
                                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="time"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    padding: '12px'
                                }}
                                formatter={(value: number) => [`${value} requests`, 'API Calls']}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#4A8CFF"
                                fill="url(#colorRequests)"
                                strokeWidth={3}
                                dot={false}
                                name="Current Period"
                            />
                            {/* Previous Period Line (if comparison enabled) */}
                            {showComparison && (
                                <Line
                                    type="monotone"
                                    dataKey="previous"
                                    stroke="#9ca3af"
                                    strokeDasharray="5 5"
                                    strokeWidth={2}
                                    name="Previous Period"
                                    dot={false}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="p-4 border border-[#E2E8F0] rounded-lg text-[#45556C] bg-[#F8FAFC] text-sm flex items-center gap-2">
                    <HiOutlineLightBulb className='w-5 h-5' />
                    <p> Traffic is higher than the 7-day average. Peak load occurred at 11:45 AM and remains stable.</p>
                </div>
            </div>

            {/* cpu data */}
            <div className="bg-white rounded-lg p-6 mt-10">
                <div className='flex justify-between my-4'>
                    <h1 className='font-semibold '>CPU Usage</h1>
                    {/* Tabs */}
                    <TimeTabs active={activeTab} onChange={setActiveTab} />
                </div>
                <div className='flex justify-end my-4'>
                    <div className='flex gap-2'>
                        <input type="radio" id='api-requests' />
                        <label htmlFor="api-requests" className='text-sm'>Compare to previous period</label>
                    </div>
                </div>
                <div className="flex justify-self-end gap-4">
                    <div className='min-w-52 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                        <div>
                            <p className="text-xs text-gray-500">CPU Avg (7D)</p>
                            <h2 className="mt-1">65%</h2>
                        </div>
                        <BsCpuFill className='w-5 h-5' />
                    </div>
                    <div className='min-w-52 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                        <div>
                            <p className="text-xs text-gray-500">Peak CPU</p>
                            <h2 className="mt-1">78%</h2>
                        </div>
                        <BsFire className='w-5 h-5' />
                    </div>
                </div>
                <div className="h-64 max-w-3xl mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={cpuData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="time"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                dataKey="cpu"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: number) => [`${value}%`, 'CPU']}
                            />
                            <Line
                                type="monotone"
                                dataKey="cpu"
                                stroke="#FF9D3A"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="p-4 border border-[#E2E8F0] rounded-lg text-[#45556C] bg-[#F8FAFC] text-sm flex items-center gap-2">
                    <HiOutlineLightBulb className='w-5 h-5' />
                    <p>CPU usage peaked at 78% today.</p>
                </div>
            </div>

            {/* memory data */}
            <div className="bg-white rounded-lg p-6 mt-10">
                <div className='flex justify-between my-4'>
                    <h1 className='font-semibold '>Memory Usage</h1>
                    {/* Tabs */}
                    <TimeTabs active={activeTab} onChange={setActiveTab} />
                </div>
                <div className='flex justify-end my-4'>
                    <div className='flex gap-2'>
                        <input type="radio" id='api-requests' />
                        <label htmlFor="api-requests" className='text-sm'>Compare to previous period</label>
                    </div>
                </div>
                <div className="flex justify-self-end gap-4">
                    <div className='min-w-52 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                        <div>
                            <p className="text-xs text-gray-500">Memory Avg (7D)</p>
                            <h2 className="mt-1">52%</h2>
                        </div>
                        <GiCpu className='w-5 h-5' />
                    </div>
                    <div className='min-w-52 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex justify-between items-center'>
                        <div>
                            <p className="text-xs text-gray-500">Peak Memory</p>
                            <h2 className="mt-1">61%</h2>
                        </div>
                        <BsFire className='w-5 h-5' />
                    </div>
                </div>
                <div className="h-64 max-w-3xl mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={memoryData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                domain={[0, 100]}
                                stroke="#6b7280"
                                style={{ fontSize: '12px' }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                                formatter={(value: number) => [`${value}%`, 'Memory']}
                            />
                            <Line
                                type="monotone"
                                dataKey="memory"
                                stroke="#40B37C"
                                strokeWidth={3}
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="p-4 border border-[#E2E8F0] rounded-lg text-[#45556C] bg-[#F8FAFC] text-sm flex items-center gap-2">
                    <HiOutlineLightBulb className='w-5 h-5' />
                    <p>Memory usage is stable and aligned with the weekly baseline.</p>
                </div>
            </div>
            <div className="bg-white rounded-lg p-6 my-10">
                <h1 className='font-semibold pb-4 '>System Logs</h1>
                <table className="w-full border-collapse border-2 border-[#E5E7EB] text-sm">
                    <thead className='border-b border-2 border-[#E5E7EB]'>
                        <tr className=" text-left text-gray-700">
                            <th className="p-3 font-semibold">Message</th>
                            <th className="p-3 font-semibold">Level</th>
                            <th className="p-3 font-semibold">Source</th>
                            <th className="p-3 font-semibold">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="border-t-0 border-2 border-[#E5E7EB]">
                        {systemLogs.map((logs, idx) => (
                            <tr key={idx} className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
                                <td className="p-3">{logs.message}</td>
                                <td className="p-3">
                                    <span
                                        className={`px-2 uppercase py-1 text-xs rounded-full font-medium
                        ${logs.level === "warning"
                                                ? "text-white bg-[#AB8800]"
                                                : logs.level === "error"
                                                    ? "text-white bg-[#FF0000]"
                                                    : "text-white bg-[#437DFF]"
                                            }`}
                                    >
                                        {logs.level}
                                    </span>
                                </td>
                                <td className="p-3">{logs.source}</td>
                                <td className="p-3 text-gray-600">{logs.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className='grid grid-cols-3 gap-4'>
                <div className='bg-white rounded-lg p-4'>
                    <h1 className='font-semibold text-sm py-4'>Cache Performance</h1>
                    <div className='flex flex-col gap-2'>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Hit Rate</p>
                            <span>95%</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Miss Rate</p>
                            <span>5%</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Evictions</p>
                            <span>198</span>
                        </div>
                    </div>
                </div>
                <div className='bg-white rounded-lg p-4'>
                    <h1 className='font-semibold text-sm py-4'>Database Stats</h1>
                    <div className='flex flex-col gap-2'>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Active Connections</p>
                            <span>49</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Queries/sec</p>
                            <span>357</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Slow Queries</p>
                            <span>3</span>
                        </div>
                    </div>
                </div>
                <div className='bg-white rounded-lg p-4'>
                    <h1 className='font-semibold text-sm py-4'>Storage</h1>
                    <div className='flex flex-col gap-2'>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Total Size</p>
                            <span>53 GB</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Used</p>
                            <span>40 GB</span>
                        </div>
                        <div className='flex justify-between text-sm'>
                            <p className='#717182'>Evictions</p>
                            <span>13 GB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SystemMonitoring