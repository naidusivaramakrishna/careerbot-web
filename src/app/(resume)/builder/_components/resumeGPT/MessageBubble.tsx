"use client";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  sender: "bot" | "user";
  text: string;
}

export default function MessageBubble({ sender, text }: MessageBubbleProps) {
  const isBot = sender === "bot";

  return (
    <div className={`flex items-center gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
      {isBot && <Bot className="w-6 h-6 px-1 py-1 bg-orange-500 text-white rounded-full flex-shrink-0" />}
      <div
        className={`max-w-xs p-3 shadow-md ${
          isBot
            ? "bg-white text-gray-800 rounded-2xl text-[14px] rounded-bl-none"
            : "bg-orange-500 text-white rounded-2xl text-[14px] rounded-br-none"
        }`}
      >
        {text}
      </div>
      {!isBot && <User className="w-6 h-6 px-1 py-1 text-white bg-orange-500 rounded-full flex-shrink-0" />}
    </div>
  );
}





















// "use client";
// import { Bot, User } from "lucide-react";

// interface MessageBubbleProps {
//   sender: "bot" | "user";
//   text: string;
// }

// export default function MessageBubble({ sender, text }: MessageBubbleProps) {
//   const isBot = sender === "bot";

//   return (
//     <div className={`flex items-start gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
//       {/* ✅ Unified Bot Avatar */}
//       {isBot && (
//         <div className="w-8 h-8 flex items-center justify-center bg-orange-500 rounded-full">
//           <Bot className="w-5 h-5 text-white" />
//         </div>
//       )}

//       {/* Message Bubble */}
//       <div
//         className={`max-w-xs p-1 rounded-lg shadow-md ${
//           isBot ? "bg-white text-gray-800" : "py-1 px-2 bg-orange-500 text-white"
//         }`}
//       >
//         {text}
//       </div>

//       {/* ✅ User Avatar (no changes) */}
//       {!isBot && (
//         <div className="w-8 h-8 flex items-center justify-center bg-orange-500 rounded-full">
//           <User className="w-5 h-5 text-white" />
//         </div>
//       )}
//     </div>
//   );
// }
