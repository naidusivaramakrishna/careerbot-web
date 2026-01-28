// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import Image from "next/image";
// import { FaLinkedinIn } from "react-icons/fa";

// const EmptyState = ({ selected, onSelect }: { 
//   selected: string | null; 
//   onSelect: (id: string) => void;
// }) => (
//   <div className="flex items-center justify-center p-6">
//     <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
//       <div
//         onClick={() => onSelect("builder")}
//         className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition
//           ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"}`}
//       >
//         <div className='p-6'>
//           <div className='flex flex-col items-center justify-center'>
//             <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
//               <Plus className="text-[#2500F9] w-8 h-8" />
//             </div>
//             <h2 className="text-xl font-semibold my-2">
//               Craft a Professional <br /> Resume in Minutes
//             </h2>
//             <p className="max-w-xs text-center text-sm my-4">
//               Step-by-step builder to craft a polished resume from scratch.
//             </p>
//           </div>
//           <ul className="text-lg space-y-2 mt-4 pl-8">
//             <li className="flex items-center gap-2 text-sm">
//               <CircleCheckBig className="h-4 w-4 text-green-500" />
//               ATS-friendly formatting
//             </li>
//             <li className="flex items-center gap-2 text-sm">
//               <CircleCheckBig className="h-4 w-4 text-green-500" />
//               Pre-designed templates
//             </li>
//           </ul>
//         </div>
//         <div>
//           <Image 
//             src="/assets/images/resume_dashboard_ai.svg" 
//             alt='resume_dashboard_ai' 
//             className='w-[200px] h-[150px] flex justify-self-end' 
//             width={80} 
//             height={80} 
//           />
//         </div>
//       </div>

//       <div className='flex flex-col gap-4'>
//         <div
//           onClick={() => onSelect("linkedin")}
//           className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition flex flex-col justify-center items-center text-center
//             ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
//         >
//           <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//             <FaLinkedinIn className="text-white w-8 h-8" />
//           </div>
//           <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
//           <p className="text-sm max-w-xs text-center">
//             Build your resume straight from your LinkedIn—fast and effortless.
//           </p>
//         </div>

//         <div
//           onClick={() => onSelect("upload")}
//           className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition flex flex-col justify-center items-center text-center
//             ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
//         >
//           <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//             <Upload className="w-8 h-8" />
//           </div>
//           <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
//           <p className="text-sm max-w-xs text-center">
//             Already have a resume? Let&apos;s upgrade it for your next opportunity.
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// );

// export default EmptyState



// "use client"
// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import Image from "next/image";
// import { FaLinkedinIn } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { useState } from "react";
// import { createResumeWithAuth } from "@/api/resumeApi";

// const EmptyState = ({ selected, onSelect }: { 
//   selected: string | null; 
//   onSelect: (id: string) => void;
// }) => {
//   const router = useRouter();
//   const [isCreating, setIsCreating] = useState(false);

//   const handleBuilderClick = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     console.log("🔵 Builder clicked - Starting process");
    
//     // Select the card visually
//     onSelect("builder");
    
//     // Check if user is authenticated
//     const token = localStorage.getItem("access_token");
//     const userEmail = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     console.log("🔍 Auth check:", { 
//       hasToken: !!token, 
//       email: userEmail, 
//       username: username 
//     });
    
//     if (!token) {
//       console.log("❌ No token found");
//       toast.error("Please sign in to create a resume");
//       return;
//     }

//     setIsCreating(true);
    
//     // Navigate immediately for better UX
//     console.log("🚀 Navigating to /builder/creation immediately");
//     router.push("/builder/creation");
    
//     // Create resume in background
//     console.log("📤 Creating resume in background...");
//     createResumeWithAuth()
//       .then((resume) => {
//         console.log("✅ Resume created with ID:", resume.id);
//         localStorage.setItem("current_resume_id", resume.id);
//         toast.success("Resume ready!");
//       })
//       .catch((error) => {
//         console.error("❌ Resume creation failed:", error);
//         toast.error(error instanceof Error ? error.message : "Failed to create resume");
//       })
//       .finally(() => {
//         setIsCreating(false);
//       });
//   };

//   return (
//     <div className="flex items-center justify-center p-6">
//       <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
//         <div
//           onClick={handleBuilderClick}
//           className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition hover:shadow-md
//             ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"} 
//             ${isCreating ? "opacity-75" : ""}`}
//         >
//           <div className='p-6'>
//             <div className='flex flex-col items-center justify-center'>
//               <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
//                 {isCreating ? (
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2500F9]"></div>
//                 ) : (
//                   <Plus className="text-[#2500F9] w-8 h-8" />
//                 )}
//               </div>
//               <h2 className="text-xl font-semibold my-2">
//                 Craft a Professional <br /> Resume in Minutes
//               </h2>
//               <p className="max-w-xs text-center text-sm my-4">
//                 {isCreating 
//                   ? "Creating your resume..." 
//                   : "Step-by-step builder to craft a polished resume from scratch."
//                 }
//               </p>
//             </div>
//             <ul className="text-lg space-y-2 mt-4 pl-8">
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 ATS-friendly formatting
//               </li>
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 Pre-designed templates
//               </li>
//             </ul>
//           </div>
//           <div>
//             <Image 
//               src="/assets/images/resume_dashboard_ai.svg" 
//               alt='resume_dashboard_ai' 
//               className='w-[200px] h-[150px] flex justify-self-end' 
//               width={80} 
//               height={80} 
//             />
//           </div>
//         </div>

//         <div className='flex flex-col gap-4'>
//           <div
//             onClick={() => {
//               console.log("LinkedIn option clicked");
//               onSelect("linkedin");
//             }}
//             className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <FaLinkedinIn className="text-white w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
//             <p className="text-sm max-w-xs text-center">
//               Build your resume straight from your LinkedIn—fast and effortless.
//             </p>
//           </div>

//           <div
//             onClick={() => {
//               console.log("Upload option clicked");
//               onSelect("upload");
//             }}
//             className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <Upload className="w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
//             <p className="text-sm max-w-xs text-center">
//               Already have a resume? Let&apos;s upgrade it for your next opportunity.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmptyState;





// "use client"
// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import Image from "next/image";
// import { FaLinkedinIn } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { useState } from "react";
// import { createResumeWithAuth } from "@/api/resumeApi";

// const EmptyState = ({ selected, onSelect }: { 
//   selected: string | null; 
//   onSelect: (id: string) => void;
// }) => {
//   const router = useRouter();
//   const [isCreating, setIsCreating] = useState(false);

//   const handleBuilderClick = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     console.log("🔵 Builder clicked - Starting process");
    
//     // Select the card visually
//     onSelect("builder");
    
//     // Check if user is authenticated
//     const token = localStorage.getItem("access_token");
//     const userEmail = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     console.log("🔍 Auth check:", { 
//       hasToken: !!token, 
//       email: userEmail, 
//       username: username 
//     });
    
//     if (!token) {
//       console.log("❌ No token found");
//       toast.error("Please sign in to create a resume");
//       return;
//     }

//     setIsCreating(true);
    
//     try {
//       // ✅ WAIT for resume creation FIRST
//       console.log("📤 Creating resume...");
//       const resume = await createResumeWithAuth();
      
//       console.log("✅ Resume created with ID:", resume.id);
      
//       // ✅ Store the resume ID
//       localStorage.setItem("current_resume_id", resume.id);
      
//       toast.success("Resume created successfully!");
      
//       // ✅ Navigate AFTER resume is created
//       console.log("🚀 Navigating to /builder/creation");
//       router.push("/builder/creation");
      
//     } catch (error) {
//       console.error("❌ Resume creation failed:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to create resume");
//       setIsCreating(false); // Re-enable button on error
//     }
//     // Don't setIsCreating(false) here - let the navigation happen
//   };

//   return (
//     <div className="flex items-center justify-center p-6">
//       <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
//         <div
//           onClick={handleBuilderClick}
//           className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition hover:shadow-md
//             ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"} 
//             ${isCreating ? "opacity-75 cursor-not-allowed" : ""}`}
//         >
//           <div className='p-6'>
//             <div className='flex flex-col items-center justify-center'>
//               <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
//                 {isCreating ? (
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2500F9]"></div>
//                 ) : (
//                   <Plus className="text-[#2500F9] w-8 h-8" />
//                 )}
//               </div>
//               <h2 className="text-xl font-semibold my-2">
//                 Craft a Professional <br /> Resume in Minutes
//               </h2>
//               <p className="max-w-xs text-center text-sm my-4">
//                 {isCreating 
//                   ? "Creating your resume..." 
//                   : "Step-by-step builder to craft a polished resume from scratch."
//                 }
//               </p>
//             </div>
//             <ul className="text-lg space-y-2 mt-4 pl-8">
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 ATS-friendly formatting
//               </li>
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 Pre-designed templates
//               </li>
//             </ul>
//           </div>
//           <div>
//             <Image 
//               src="/assets/images/resume_dashboard_ai.svg" 
//               alt='resume_dashboard_ai' 
//               className='w-[200px] h-[150px] flex justify-self-end' 
//               width={80} 
//               height={80} 
//             />
//           </div>
//         </div>

//         <div className='flex flex-col gap-4'>
//           <div
//             onClick={() => {
//               console.log("LinkedIn option clicked");
//               onSelect("linkedin");
//             }}
//             className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <FaLinkedinIn className="text-white w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
//             <p className="text-sm max-w-xs text-center">
//               Build your resume straight from your LinkedIn—fast and effortless.
//             </p>
//           </div>

//           <div
//             onClick={() => {
//               console.log("Upload option clicked");
//               onSelect("upload");
//             }}
//             className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <Upload className="w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
//             <p className="text-sm max-w-xs text-center">
//               Already have a resume? Let&apos;s upgrade it for your next opportunity.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmptyState;




// "use client"
// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import Image from "next/image";
// import { FaLinkedinIn } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { useState } from "react";
// import { createResumeWithAuth } from "@/api/resumeApi";

// const EmptyState = ({ selected, onSelect }: { 
//   selected: string | null; 
//   onSelect: (id: string) => void;
// }) => {
//   const router = useRouter();
//   const [isCreating, setIsCreating] = useState(false);

//   const handleBuilderClick = async (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     console.log("🔵 Builder clicked - Starting process");
    
//     // Select the card visually
//     onSelect("builder");
    
//     // Check if user is authenticated
//     const token = localStorage.getItem("access_token");
//     const userEmail = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     console.log("🔍 Auth check:", { 
//       hasToken: !!token, 
//       email: userEmail, 
//       username: username 
//     });
    
//     if (!token) {
//       console.log("❌ No token found");
//       toast.error("Please sign in to create a resume");
//       return;
//     }

//     setIsCreating(true);
    
//     try {
//       // ✅ WAIT for resume creation FIRST
//       console.log("📤 Creating resume...");
//       const resume = await createResumeWithAuth();
      
//       console.log("✅ Resume created with ID:", resume.id);
      
//       // ✅ Store the resume ID
//       localStorage.setItem("current_resume_id", resume.id);
      
//       toast.success("Resume created successfully!");
      
//       // ✅ Navigate AFTER resume is created
//       console.log("🚀 Navigating to /builder/creation");
//       router.push("/builder/creation");
      
//     } catch (error) {
//       console.error("❌ Resume creation failed:", error);
//       toast.error(error instanceof Error ? error.message : "Failed to create resume");
//       setIsCreating(false); // Re-enable button on error
//     }
//     // Don't setIsCreating(false) here - let the navigation happen
//   };

//   return (
//     <div className="flex items-center justify-center p-6">
//       <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
//         <div
//           onClick={handleBuilderClick}
//           className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition hover:shadow-md
//             ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"} 
//             ${isCreating ? "opacity-75 cursor-not-allowed" : ""}`}
//         >
//           <div className='p-6'>
//             <div className='flex flex-col items-center justify-center'>
//               <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
//                 {isCreating ? (
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2500F9]"></div>
//                 ) : (
//                   <Plus className="text-[#2500F9] w-8 h-8" />
//                 )}
//               </div>
//               <h2 className="text-xl font-semibold my-2">
//                 Craft a Professional <br /> Resume in Minutes
//               </h2>
//               <p className="max-w-xs text-center text-sm my-4">
//                 {isCreating 
//                   ? "Creating your resume..." 
//                   : "Step-by-step builder to craft a polished resume from scratch."
//                 }
//               </p>
//             </div>
//             <ul className="text-lg space-y-2 mt-4 pl-8">
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 ATS-friendly formatting
//               </li>
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 Pre-designed templates
//               </li>
//             </ul>
//           </div>
//           <div>
//             <Image 
//               src="/assets/images/resume_dashboard_ai.svg" 
//               alt='resume_dashboard_ai' 
//               className='w-[200px] h-[150px] flex justify-self-end' 
//               width={80} 
//               height={80} 
//             />
//           </div>
//         </div>

//         <div className='flex flex-col gap-4'>
//           <div
//             onClick={() => {
//               console.log("LinkedIn option clicked");
//               onSelect("linkedin");
//             }}
//             className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <FaLinkedinIn className="text-white w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
//             <p className="text-sm max-w-xs text-center">
//               Build your resume straight from your LinkedIn—fast and effortless.
//             </p>
//           </div>

//           <div
//             onClick={() => {
//               console.log("Upload option clicked");
//               onSelect("upload");
//             }}
//             className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <Upload className="w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
//             <p className="text-sm max-w-xs text-center">
//               Already have a resume? Let&apos;s upgrade it for your next opportunity.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmptyState; before save error issue


// "use client"
// import { CircleCheckBig, Plus, Upload } from "lucide-react";
// import Image from "next/image";
// import { FaLinkedinIn } from "react-icons/fa";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { useState } from "react";
// import { createResumeWithAuth, getAllResumes } from "@/api/resumeApi";

// const EmptyState = ({ selected, onSelect }: { 
//   selected: string | null; 
//   onSelect: (id: string) => void;
// }) => {
//   const router = useRouter();
//   const [isCreating, setIsCreating] = useState(false);

//   // const handleBuilderClick = async (e: React.MouseEvent) => {
//   //   e.preventDefault();
//   //   e.stopPropagation();
    
//   //   console.log("🔵 Builder clicked - Starting process");
    
//   //   onSelect("builder");
    
//   //   const token = localStorage.getItem("access_token");
//   //   const userEmail = localStorage.getItem("user_email");
//   //   const username = localStorage.getItem("username");
    
//   //   console.log("🔍 Auth check:", { 
//   //     hasToken: !!token, 
//   //     email: userEmail, 
//   //     username: username 
//   //   });
    
//   //   if (!token) {
//   //     console.log("❌ No token found");
//   //     toast.error("Please sign in to create a resume");
//   //     return;
//   //   }

//   //   if (!userEmail) {
//   //     console.log("❌ No user email found");
//   //     toast.error("User email not found. Please sign in again.");
//   //     return;
//   //   }

//   //   setIsCreating(true);
    
//   //   try {
//   //     console.log("📤 Step 1: Checking for existing resumes...");
      
//   //     // First, check if any resumes exist
//   //     const existingResumes = await getAllResumes();
//   //     console.log("📊 Existing resumes:", existingResumes);
      
//   //     if (existingResumes && existingResumes.length > 0) {
//   //       // Use the first existing resume
//   //       const existingResume = existingResumes[0];
//   //       console.log("✅ Found existing resume:", existingResume.id);
        
//   //       localStorage.setItem("current_resume_id", existingResume.id);
        
//   //       toast.success("Using your existing resume");
        
//   //       await new Promise(resolve => setTimeout(resolve, 100));
        
//   //       console.log("🚀 Navigating to /builder/creation");
//   //       router.push("/builder/creation");
//   //       return;
//   //     }
      
//   //     console.log("📤 Step 2: No existing resumes, creating new one...");
      
//   //     // Try to create new resume
//   //     const resume = await createResumeWithAuth();
      
//   //     console.log("✅ Resume created successfully:", resume);
//   //     console.log("✅ Resume ID:", resume.id);
      
//   //     localStorage.setItem("current_resume_id", resume.id);
//   //     console.log("💾 Stored resume ID:", resume.id);
      
//   //     toast.success("Resume created successfully!");
      
//   //     await new Promise(resolve => setTimeout(resolve, 100));
      
//   //     console.log("🚀 Navigating to /builder/creation");
//   //     router.push("/builder/creation");
      
//   //   } catch (error) {
//   //     console.error("❌ Resume creation error:", error);
      
//   //     if (error instanceof Error) {
//   //       if (error.message.includes("already exists") || error.message.includes("409")) {
//   //         console.log("⚠️ Got 409 error, but getAllResumes returned empty");
//   //         console.log("⚠️ This indicates backend data inconsistency");
          
//   //         toast.error("Backend error: Resume exists but not found. Please contact support or try logging out and back in.");
          
//   //         // Clear potentially corrupted data
//   //         localStorage.removeItem("current_resume_id");
          
//   //         setIsCreating(false);
//   //       } else {
//   //         console.error("❌ Unexpected error:", error.message);
//   //         toast.error(error.message);
//   //         setIsCreating(false);
//   //       }
//   //     } else {
//   //       toast.error("Failed to create resume. Please try again.");
//   //       setIsCreating(false);
//   //     }
//   //   }
//   // };
//   // In EmptyState.tsx handleBuilderClick function
// const handleBuilderClick = async (e: React.MouseEvent) => {
//   e.preventDefault();
//   e.stopPropagation();
  
//   console.log("🔵 Builder clicked");
//   onSelect("builder");
  
//   const token = localStorage.getItem("access_token");
//   const userEmail = localStorage.getItem("user_email");
  
//   if (!token || !userEmail) {
//     toast.error("Please sign in to create a resume");
//     return;
//   }

//   setIsCreating(true);
  
//   try {
//     // ✅ Step 1: Check for existing resumes
//     console.log("📥 Checking for existing resumes...");
//     const existingResumes = await getAllResumes();
    
//     if (existingResumes && existingResumes.length > 0) {
//       const resume = existingResumes[0];
//       console.log("✅ Using existing resume:", resume.id);
      
//       // ✅ Ensure ID is stored
//       localStorage.setItem("current_resume_id", resume.id);
      
//       toast.success("Loading your resume...");
      
//       await new Promise(resolve => setTimeout(resolve, 500));
//       router.push("/builder/creation");
//       return;
//     }
    
//     // ✅ Step 2: Create new resume only if none exist
//     console.log("📤 Creating new resume...");
//     const newResume = await createResumeWithAuth();
    
//     console.log("✅ Resume created:", newResume);
//     console.log("✅ Resume ID:", newResume.id);
    
//     // ✅ CRITICAL: Store the ID immediately
//     localStorage.setItem("current_resume_id", newResume.id);
    
//     // ✅ Verify it was stored
//     const storedId = localStorage.getItem("current_resume_id");
//     console.log("💾 Verified stored ID:", storedId);
    
//     if (storedId !== newResume.id) {
//       console.error("❌ ID storage failed!");
//       throw new Error("Failed to store resume ID");
//     }
    
//     toast.success("Resume created successfully!");
    
//     await new Promise(resolve => setTimeout(resolve, 500));
//     router.push("/builder/creation");
    
//   } catch (error) {
//     console.error("❌ Error:", error);
    
//     if (error instanceof Error) {
//       if (error.message === "RESUME_EXISTS") {
//         toast.error("Resume already exists. Please refresh the page.");
//         setTimeout(() => window.location.reload(), 2000);
//       } else {
//         toast.error(error.message);
//       }
//     }
    
//     setIsCreating(false);
//   }
// };



//   return (
//     <div className="flex items-center justify-center p-6">
//       <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
//         <div
//           onClick={handleBuilderClick}
//           className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition hover:shadow-md
//             ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"} 
//             ${isCreating ? "opacity-75 cursor-not-allowed" : ""}`}
//         >
//           <div className='p-6'>
//             <div className='flex flex-col items-center justify-center'>
//               <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
//                 {isCreating ? (
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2500F9]"></div>
//                 ) : (
//                   <Plus className="text-[#2500F9] w-8 h-8" />
//                 )}
//               </div>
//               <h2 className="text-xl font-semibold my-2">
//                 Craft a Professional <br /> Resume in Minutes
//               </h2>
//               <p className="max-w-xs text-center text-sm my-4">
//                 {isCreating 
//                   ? "Creating your resume..." 
//                   : "Step-by-step builder to craft a polished resume from scratch."
//                 }
//               </p>
//             </div>
//             <ul className="text-lg space-y-2 mt-4 pl-8">
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 ATS-friendly formatting
//               </li>
//               <li className="flex items-center gap-2 text-sm">
//                 <CircleCheckBig className="h-4 w-4 text-green-500" />
//                 Pre-designed templates
//               </li>
//             </ul>
//           </div>
//           <div>
//             <Image 
//               src="/assets/images/resume_dashboard_ai.svg" 
//               alt='resume_dashboard_ai' 
//               className='w-[200px] h-[150px] flex justify-self-end' 
//               width={80} 
//               height={80} 
//             />
//           </div>
//         </div>

//         <div className='flex flex-col gap-4'>
//           <div
//             onClick={() => {
//               console.log("LinkedIn option clicked");
//               onSelect("linkedin");
//             }}
//             className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <FaLinkedinIn className="text-white w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
//             <p className="text-sm max-w-xs text-center">
//               Build your resume straight from your LinkedIn—fast and effortless.
//             </p>
//           </div>

//           <div
//             onClick={() => {
//               console.log("Upload option clicked");
//               onSelect("upload");
//             }}
//             className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
//               ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
//           >
//             <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
//               <Upload className="w-8 h-8" />
//             </div>
//             <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
//             <p className="text-sm max-w-xs text-center">
//               Already have a resume? Let&apos;s upgrade it for your next opportunity.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmptyState; before linkedin added



"use client"
import { CircleCheckBig, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import { FaLinkedinIn } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { createResumeWithAuth, getAllResumes } from "@/api/resumeApi";
import { logger } from "@/lib/logger";


const EmptyState = ({ selected, onSelect }: { 
  selected: string | null; 
  onSelect: (id: string) => void;
}) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [linkedInUrl, setLinkedInUrl] = useState("");


  const handleBuilderClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🔵 Builder clicked");
    onSelect("builder");

    setIsCreating(true);

    try {
      // ✅ Step 1: Check for existing resumes
      console.log("📥 Checking for existing resumes...");
      const existingResumes = await getAllResumes();

      if (existingResumes && existingResumes.length > 0) {
        const resume = existingResumes[0];
        console.log("✅ Using existing resume:", resume.id);

        toast.success("Loading your resume...");

        await new Promise(resolve => setTimeout(resolve, 500));
        // ✅ Use URL parameter instead of localStorage
        router.push(`/builder/creation?resumeId=${resume.id}`);
        return;
      }

      // ✅ Step 2: Create new resume only if none exist
      console.log("📤 Creating new resume...");
      const newResume = await createResumeWithAuth();

      console.log("✅ Resume created:", newResume);
      console.log("✅ Resume ID:", newResume.id);

      toast.success("Resume created successfully!");

      await new Promise(resolve => setTimeout(resolve, 500));
      // ✅ Use URL parameter instead of localStorage
      router.push(`/builder/creation?resumeId=${newResume.id}`);
      
    } catch (error) {
      console.error("❌ Error:", error);
      
      if (error instanceof Error) {
        if (error.message === "RESUME_EXISTS") {
          toast.error("Resume already exists. Please refresh the page.");
          setTimeout(() => window.location.reload(), 2000);
        } else {
          toast.error(error.message);
        }
      }
      
      setIsCreating(false);
    }
  };

  const handleLinkedInClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("LinkedIn option clicked");
    onSelect("linkedin");
    setShowLinkedInModal(true);
  };

  const handleCloseModal = () => {
    setShowLinkedInModal(false);
    setLinkedInUrl("");
  };

  const handleLinkedInGo = () => {
    if (!linkedInUrl.trim()) {
      toast.error("Please enter a LinkedIn URL");
      return;
    }
    
    // Validate LinkedIn URL format
    if (!linkedInUrl.includes("linkedin.com")) {
      toast.error("Please enter a valid LinkedIn URL");
      return;
    }
    
    console.log("LinkedIn URL submitted:", linkedInUrl);
    toast.success("Processing LinkedIn URL...");
    
    // Add your LinkedIn import logic here
    // For example: call an API to import LinkedIn data
    
    handleCloseModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };


  return (
    <>
      <div className="flex items-center justify-center p-6">
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl w-full">
          <div
            onClick={handleBuilderClick}
            className={`cursor-pointer bg-white border-2 rounded-xl flex flex-col justify-between shadow-sm transition hover:shadow-md
              ${selected === "builder" ? "border-[#155DFC]" : "border-gray-300"} 
              ${isCreating ? "opacity-75 cursor-not-allowed" : ""}`}
          >
            <div className='p-6'>
              <div className='flex flex-col items-center justify-center'>
                <div className="w-12 h-12 flex items-center cursor-pointer justify-center border border-dashed border-gray-400 rounded-lg my-4">
                  {isCreating ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2500F9]"></div>
                  ) : (
                    <Plus className="text-[#2500F9] w-8 h-8" />
                  )}
                </div>
                <h2 className="text-xl font-semibold my-2">
                  Craft a Professional <br /> Resume in Minutes
                </h2>
                <p className="max-w-xs text-center text-sm my-4">
                  {isCreating 
                    ? "Creating your resume..." 
                    : "Step-by-step builder to craft a polished resume from scratch."
                  }
                </p>
              </div>
              <ul className="text-lg space-y-2 mt-4 pl-8">
                <li className="flex items-center gap-2 text-sm">
                  <CircleCheckBig className="h-4 w-4 text-green-500" />
                  ATS-friendly formatting
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CircleCheckBig className="h-4 w-4 text-green-500" />
                  Pre-designed templates
                </li>
              </ul>
            </div>
            <div>
              <Image 
                src="/assets/images/resume_dashboard_ai.svg" 
                alt='resume_dashboard_ai' 
                className='w-[200px] h-[150px] flex justify-self-end' 
                width={80} 
                height={80} 
              />
            </div>
          </div>

          <div className='flex flex-col gap-4'>
            <div
              onClick={handleLinkedInClick}
              className={`cursor-pointer bg-white border-2 h-full rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
                ${selected === "linkedin" ? "border-[#155DFC]" : "border-gray-300"}`}
            >
              <div className="bg-[#0A66C2] rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
                <FaLinkedinIn className="text-white w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl my-2">Import from LinkedIn</h3>
              <p className="text-sm max-w-xs text-center">
                Build your resume straight from your LinkedIn—fast and effortless.
              </p>
            </div>

            <div
              onClick={() => {
                console.log("Upload option clicked");
                onSelect("upload");
              }}
              className={`cursor-pointer bg-white h-full border-2 rounded-xl p-6 shadow-sm transition hover:shadow-md flex flex-col justify-center items-center text-center
                ${selected === "upload" ? "border-[#155DFC]" : "border-gray-300"}`}
            >
              <div className="bg-gray-200 rounded-lg p-3 mb-3 w-12 h-12 flex items-center justify-center">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-xl my-2">Upload existing resume</h3>
              <p className="text-sm max-w-xs text-center">
                Already have a resume? Let&apos;s upgrade it for your next opportunity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* LinkedIn URL Modal */}
      {showLinkedInModal && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-60 transition-opacity"
        >
          <div className="relative bg-white rounded-xl w-[930px] h-[50vh] shadow-lg  max-w-lg mx-4">
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Header */}
            <div className="bg-white rounded-t-xl p-4 flex items-center border-b border-gray-400 justify-center">
              <div className="bg-[#2557a7] rounded-lg p-2 mr-3">
                <FaLinkedinIn className="text-white w-6 h-6" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2557a7]">
                Import from LinkedIn
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="block mb-2 mt-6 text-sm font-medium text-gray-700">
                LinkedIn Profile URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className="flex-1 bg-transparent placeholder:text-gray-400 text-gray-700 text-sm border border-gray-300 rounded-lg px-4 py-3 transition duration-300 ease focus:outline-none focus:border-[#0A66C2] hover:border-gray-400 shadow-sm focus:shadow"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLinkedInGo();
                    }
                  }}
                />
                <button
                  onClick={handleLinkedInGo}
                  className="rounded-lg bg-[#0A66C2] py-3 px-8 text-center text-sm font-medium text-white transition-all hover:bg-[#004182] shadow-md hover:shadow-lg"
                >
                  Go
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Paste your LinkedIn profile URL to import your professional information
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default EmptyState;



