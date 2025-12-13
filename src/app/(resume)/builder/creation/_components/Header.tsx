// "use client"
// import React from "react";
// // import { VscArrowCircleLeft } from 'react-icons/vsc';
// import { RiArrowLeftLine } from 'react-icons/ri';
// // import React, { useState } from "react";

// // const navLinks = [
// //   { name: "Home", active: false },
// //   { name: "Resume Builder", active: true },
// //   { name: "Resume Enhancer", active: false },
// //   { name: "ATS Scan", active: false },
// //   { name: "JD Match", active: false },
// // ];

// // // Example: This can come from props, context, or API call
// // const mockUser = {
// //   name: "Jane Smith",
// //   email: "jane.smith@example.com",
// // };

// const Header: React.FC = () => {
//   // const [openProfile, setOpenProfile] = useState(false);

//   // Replace this with real data (e.g., from props or context)
//   // const user = mockUser;

//   return (
//     <header className="border-b bg-white">
//       {/* Top navigation row */}
//       {/* <div className="flex items-center justify-between px-8 py-3 relative"> */}
//         {/* Left: Logo */}
//         {/* <div className="flex items-center">
//           <span className="font-extrabold text-2xl text-black tracking-tight">
//             CareerBot
//           </span>
//         </div> */}

//         {/* Center: Navigation */}
//         {/* <nav className="absolute left-1/2 transform -translate-x-1/2">
//           <ul className="flex items-center gap-7">
//             {navLinks.map(link => (
//               <li key={link.name} className="relative">
//                 <span
//                   className={`text-sm font-medium cursor-pointer transition-colors
//                     ${link.active
//                       ? "text-orange-500"
//                       : "text-black hover:text-orange-400"}`}
//                 >
//                   {link.name}
//                   {link.active && (
//                     <span className="absolute left-0 -bottom-[6px] w-full h-[3px] bg-orange-400 rounded-sm shadow-[0_2px_4px_rgba(255,152,0,0.12)]"></span>
//                   )}
//                 </span>
//               </li>
//             ))}
//           </ul>
//         </nav> */}

//         {/* Right: Notifications + Avatar */}
//         {/* <div className="flex items-center gap-6 relative"> */}
//           {/* Notification bell with badge */}
//           {/* <span className="relative">
//             <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
//               <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
//                 <path
//                   d="M10 2C7.243 2 5 4.243 5 7v5.072l-.66 1.347A1 1 0 005.238 15h9.524a1 1 0 00.898-1.581l-.66-1.347V7c0-2.757-2.243-5-5-5z"
//                   stroke="#545454"
//                   strokeWidth="1.5"
//                 />
//                 <circle cx="15.5" cy="6.8" r="1.2" fill="#FF9800" />
//               </svg>
//             </span>
//             <span className="absolute top-1 right-0 w-3 h-3 bg-orange-500 border-2 border-white rounded-full text-[10px] font-bold text-white flex items-center justify-center">
//               2
//             </span>
//           </span> */}

//           {/* Avatar icon */}
//           {/* <button
//             onClick={() => setOpenProfile(!openProfile)}
//             className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 transition"
//           >
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               width="20"
//               height="20"
//               fill="currentColor"
//               viewBox="0 0 24 24"
//               className="text-gray-700"
//             >
//               <path
//                 fillRule="evenodd"
//                 d="M12 2a5 5 0 0 0-5 5v1a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5zm-7 18a7 7 0 0 1 14 0H5z"
//                 clipRule="evenodd"
//               />
//             </svg>
//           </button>

//           {/* Dropdown menu */}
//           {/* {openProfile && user && (
//             <div className="absolute right-0 top-12 w-48 bg-white shadow-lg rounded-lg border border-gray-200 p-3 z-50">
//               <p className="font-semibold text-gray-800">{user.name}</p>
//               <p className="text-sm text-gray-500">{user.email}</p>
//               <hr className="my-2" />
//               <button className="w-full text-left px-3 py-1 rounded text-gray-800 hover:bg-gray-100 text-sm">
//                 Profile
//               </button>
//               <button className="w-full text-left px-3 py-1 rounded text-gray-800 hover:bg-gray-100 text-sm">
//                 Settings
//               </button>
//               <button className="w-full text-left px-3 py-1 rounded text-red-600 hover:bg-red-50 text-sm">
//                 Logout
//               </button>
//             </div>
//           )} */}
//         {/* </div> */}
//       {/* </div>  */}

//       {/* Floating bar below navigation */}
//       <div className="bg-white px-8 py-3 flex items-center gap-4">
//         {/* <VscArrowCircleLeft  className="text-gray-600" size={24}/> */}
//         <RiArrowLeftLine  className="text-gray-600" size={24}/>
//         <span className="font-bold text-lg text-[#2557a7]">
//           Resume Builder
//         </span>
//         {/* <div className="ml-auto flex items-center gap-3">
//           Save Button
//           <button className="flex items-center gap-1 bg-white border border-gray-200 px-3 py-1 rounded-lg font-semibold text-gray-700 text-xs shadow-sm hover:border-gray-300 transition">
//             <Save className='w-4 h-4' />
//             <svg width={14} height={14} fill="none" className="inline-block">
//               <rect x="3" y="3" width="8" height="8" rx="1.5" fill="#767676" />
//               <rect x="5" y="5" width="4" height="4" rx="1" fill="#f3f3f3" />
//             </svg> 
//             Save
//           </button>  */}
//           {/* Export PDF Button */}
//           {/* <button className="flex items-center gap-1 bg-orange-500 text-white font-semibold px-4 py-1 rounded-lg text-xs shadow-sm hover:bg-orange-400 transition">
//             <ArrowDownToLine className='w-4 h-4' />
//             <svg width={16} height={16} fill="none" className="inline-block">
//               <path
//                 d="M8 3v7m0 0l-3-3m3 3l3-3m-6 6h6"
//                 stroke="white"
//                 strokeWidth="2"
//                 strokeLinecap="round"
//               />
//             </svg>
//             Export
//           </button>
//         </div> */}
//       </div>
//     </header>
//   );
// };

// export default Header;





// "use client"
// import React from "react";

// import { RiArrowLeftLine } from 'react-icons/ri';

// const Header: React.FC = () => {

//   return (
//     <header className=" bg-gray-100">
//       {/* Floating bar below navigation with rounded top-left corner and increased padding */}
//       <div className="bg-white px-5 py-4 flex items-center gap-4 overflow-hidden">
//         {/* <VscArrowCircleLeft  className="text-gray-600" size={24}/> */}
//         <RiArrowLeftLine className="text-gray-600" size={24}/>
//         <span className="font-bold text-lg text-[#2557a7]">
//           Resume Builder
//         </span>
//       </div>
//     </header>
//   );
// };

// export default Header;



"use client"
import React from "react";
import { useRouter } from "next/navigation";
import { RiArrowLeftLine } from 'react-icons/ri';

const Header: React.FC = () => {
  const router = useRouter();

  const handleBackClick = () => {
    router.push('/builder/start');
  };

  return (
    <header className="bg-gray-100">
      {/* Floating bar below navigation with rounded top-left corner and increased padding */}
      <div className="bg-white px-5 py-2 flex items-center gap-4 overflow-hidden">
        <button
          onClick={handleBackClick}
          className="cursor-pointer hover:opacity-70 transition"
          aria-label="Go back to resume page"
        >
          <RiArrowLeftLine className="text-gray-600" size={24} />
        </button>
        <span className="font-bold text-lg text-[#2557a7]">
          Resume Builder
        </span>
      </div>
    </header>
  );
};

export default Header;

