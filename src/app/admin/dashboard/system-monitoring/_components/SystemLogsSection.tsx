import React, { memo } from 'react'
import { formatTimestamp, getLogLevelColor } from '@/api/adminMonitoringApi'
import type { SystemLog } from '@/api/adminMonitoringApi'

interface SystemLogsSectionProps {
    logs: SystemLog[]
}

const LogRow = memo(({ log }: { log: SystemLog }) => {
    return (
        <tr className="border-b border-[#00000033]/70 last:border-none hover:bg-gray-50">
            <td className="p-3">{log.message}</td>
            <td className="p-3">
                <span className={`px-2 uppercase py-1 text-xs rounded-full font-medium ${getLogLevelColor(log.level)}`}>
                    {log.level}
                </span>
            </td>
            <td className="p-3">{log.source}</td>
            <td className="p-3 text-gray-600">{formatTimestamp(log.timestamp)}</td>
        </tr>
    )
})

LogRow.displayName = 'LogRow'

export const SystemLogsSection = memo(({ logs }: SystemLogsSectionProps) => {
    return (
        <div className="bg-white rounded-lg p-6 my-10">
            <h1 className='font-semibold pb-4'>System Logs</h1>
            <div className="overflow-x-auto overflow-y-auto max-h-96 border border-[#E5E7EB] rounded-lg">
                <table className="w-full border-collapse text-sm">
                    <thead className='border-b border-[#E5E7EB] sticky top-0 bg-white'>
                        <tr className="text-left text-gray-700">
                            <th className="p-3 font-semibold">Message</th>
                            <th className="p-3 font-semibold">Level</th>
                            <th className="p-3 font-semibold">Source</th>
                            <th className="p-3 font-semibold">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs && logs.length > 0 ? (
                            logs.map((log) => (
                                <LogRow key={log.id} log={log} />
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="p-6 text-center text-gray-500">
                                    No logs available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
})

SystemLogsSection.displayName = 'SystemLogsSection'
