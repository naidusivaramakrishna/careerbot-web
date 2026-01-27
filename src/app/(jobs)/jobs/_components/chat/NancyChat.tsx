// "use client";

// import { X, Send } from "lucide-react";
// import {  Bot } from "lucide-react";
// export default function NancyChat({
//   onClose,
//   job,
// }: {
//   onClose: () => void;
//   job: any;
// }) {
//   return (
//     <div className="h-screen bg-white border rounded-xl flex flex-col shadow-sm">
//       {/* HEADER */}
//       <div className="flex items-center justify-between px-4 py-3 border-b bg-purple-100 rounded-t-xl">
//         <div className="flex items-center gap-2">
//           <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold">
//             <Bot
//           className="w-5 h-5 text-white cursor-pointer"
//         />
//           </div>
//           <div>
//             <p className="font-semibold text-sm">Nancy</p>
//             <p className="text-xs text-gray-500">Always here to help</p>
//           </div>
//         </div>
//         <X
//           className="cursor-pointer text-gray-500 hover:text-gray-700"
//           onClick={onClose}
//         />
//       </div>

//       {/* CHAT BODY */}
//       <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
//         {/* BOT MESSAGE */}
//         <div className="flex gap-2">
//           <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
//             <Bot
//           className="w-5 h-5 text-white cursor-pointer"
//         />
//           </div>
//           <div className="bg-gray-100 p-3 rounded-xl max-w-[85%]">
//             Hi! I’m Nancy, your personal job assistant. How can I help you today?
//           </div>
//         </div>

//         {/* USER ACTION */}
//         <div className="flex justify-end">
//           <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
//             Summarize this job
//           </button>
//         </div>

//         {/* BOT RESPONSE */}
//         {job && (
//           <div className="flex gap-2">
//             <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
//               <Bot
//           className="w-5 h-5 text-white cursor-pointer"
//         />
//             </div>
//           </div>
//         )}

//         {/* QUICK ACTIONS */}
//         <div className="pt-2">
//           <p className="text-xs text-gray-500 mb-2">Quick actions:</p>

//           <div className="space-y-2">
//             <button className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
//               Give me a quick summary of this job role
//             </button>

//             <button className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
//               Find similar jobs that match my skills and preferences
//             </button>

//             <button className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
//               Generate interview questions I should prepare for this role
//             </button>

//             <button className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
//               Compare this job with my resume and highlight missing skills
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* INPUT */}
//       <div className="p-3 border-t flex items-center gap-2">
//         <input
//           placeholder="Ask me anything..."
//           className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
//         />
//         <button className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center">
//           <Send size={16} />
//         </button>
//       </div>
//     </div>
//   );
// }









"use client";

import { X, Send, Bot } from "lucide-react";
import { useState } from "react";

export default function NancyChat({
  onClose,
  job,
}: {
  onClose: () => void;
  job: any;
}) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I’m Nancy, your personal job assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const addMessage = (type: 'user' | 'bot', text: string) => {
    setMessages(prev => [...prev, { type, text }]);
  };

  const handleQuickAction = (action: string) => {
    addMessage('user', action);
    // Mock response
    let response = '';
    if (action.includes('summary')) {
      response = job ? `Here's a summary of the ${job.title} role at ${job.company}: ${job.description?.substring(0, 200)}...` : 'Please select a job first.';
    } else if (action.includes('similar')) {
      response = 'I can help find similar jobs. Please provide more details about your skills.';
    } else if (action.includes('interview')) {
      response = 'Common interview questions for this role include: Tell me about yourself, Why this company?, What are your strengths?';
    } else if (action.includes('compare')) {
      response = 'To compare with your resume, please upload or link your resume.';
    } else {
      response = 'I\'m here to help with job-related questions!';
    }
    setTimeout(() => addMessage('bot', response), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage('user', input);
    setInput('');
    // Mock response
    setTimeout(() => addMessage('bot', 'Thanks for your question. I\'m processing it...'), 500);
  };

  return (
    <div className="h-[550px] bg-white border rounded-xl flex flex-col shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-transparent rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-semibold">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm">Nancy</p>
            <p className="text-xs text-gray-500">Always here to help</p>
          </div>
        </div>
        <X
          className="cursor-pointer text-gray-500 hover:text-gray-700"
          onClick={onClose}
        />
      </div>

      {/* CHAT BODY */}
      <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : ''}`}>
            {msg.type === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-semibold">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            <div className={`p-3 rounded-xl max-w-[85%] ${msg.type === 'user' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* QUICK ACTIONS */}
        <div className="pt-2">
          <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
          <div className="space-y-2">
            <button onClick={() => handleQuickAction('Give me a quick summary of this job role')} className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
              Give me a quick summary of this job role
            </button>
            <button onClick={() => handleQuickAction('Find similar jobs that match my skills and preferences')} className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
              Find similar jobs that match my skills and preferences
            </button>
            <button onClick={() => handleQuickAction('Generate interview questions I should prepare for this role')} className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
              Generate interview questions I should prepare for this role
            </button>
            <button onClick={() => handleQuickAction('Compare this job with my resume and highlight missing skills')} className="w-full text-left px-3 py-2 border rounded-lg text-xs hover:bg-gray-50">
              Compare this job with my resume and highlight missing skills
            </button>
          </div>
        </div>
      </div>

      {/* INPUT */}
      <div className="p-3 border-t flex items-center gap-2 bg-transparent">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none"
          />
          <button type="submit" className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
