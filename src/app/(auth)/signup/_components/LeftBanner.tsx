import React from "react"
import { AlarmClock, Briefcase, MessagesSquare, Sparkles } from "lucide-react"

const LeftBanner = () => {
  return (
    <div className="bg-cyan-100 flex flex-col justify-between rounded-tl-4xl rounded-bl-4xl p-12">
      <div className="flex gap-4 items-center">
        <div className="w-10 h-10 flex items-center justify-center cursor-pointer rounded-2xl bg-black text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <h1 className="text-3xl font-bold cursor-pointer">CareerBot</h1>
      </div>

      <div className="w-[90%]">
        <p className="text-4xl">
          <span className="font-bold">
            Ensure a Fast and <br /> Successful Journey
          </span>{" "}
          to Your Next Career Move
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex w-fit gap-2 px-4 py-1 rounded-full bg-cyan-50 items-center">
          <Briefcase className="w-4 h-4" />
          <span className="font-bold">2X</span> Qualified Job Matches
        </div>
        <div className="flex w-fit gap-2 px-4 py-1 rounded-full bg-cyan-50 items-center">
          <AlarmClock className="w-4 h-4" />
          <span className="font-bold">60%</span> Time Savings in Job Searches
        </div>
        <div className="flex w-fit gap-2 px-4 py-1 rounded-full bg-cyan-50 items-center">
          <MessagesSquare className="w-4 h-4" />
          <span className="font-bold">50%</span> More Interview Invites
        </div>
      </div>
    </div>
  )
}

export default LeftBanner
