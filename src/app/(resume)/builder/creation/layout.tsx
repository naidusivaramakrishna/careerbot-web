// import "../../globals.css";
// import { ResumeProvider } from "./_context/ResumeContext";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="__variable_188709 __variable_9a8899 antialiased">
//         <ResumeProvider>{children}</ResumeProvider>
//       </body>
//     </html>
//   );
// }


// import "../../globals.css";
// import { ResumeProvider } from "./_context/ResumeContext";
// import Sidebar from "../../../components/layout/Sidebar"; // ✅ new sidebar import

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className="__variable_188709 __variable_9a8899 antialiased">
//         <ResumeProvider>
//           <div className="flex h-screen">
//             {/* ✅ Sidebar added */}
//             <Sidebar/>
//             {/* Existing children (Builder or other pages) */}
//             <div className="flex-1">{children}</div>
//           </div>
//         </ResumeProvider>
//       </body>
//     </html>
//   );
// }

// import "../../globals.css";
// import { ResumeProvider } from "./_context/ResumeContext";
// import Sidebar from "../../../components/layout/Sidebar";
// // import { Inter } from "next/font/google";

// // const inter = Inter({
// //   subsets: ["latin"],
// //   weight: ["400", "500", "600", "700"],
// //   variable: "--font-inter",
// //   display: "swap",
// //   adjustFontFallback: false
// // });

// import { Montserrat } from "next/font/google";

// const montserrat = Montserrat({
//   variable: "--font-montserrat",
//   subsets: ["latin"],
//   weight: ["400", "500", "700","900"],
// });


// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className={`${montserrat.variable} antialiased font-montserrat`}>
//         <ResumeProvider>
//           <div className="flex h-screen">
//             {/* ✅ Fixed Sidebar */}
//             <Sidebar />

//             {/* ✅ Main content shifted right so it doesn’t overlap sidebar */}
//             <div className="flex-1 ml-22 overflow-auto">{children}</div>
//           </div>
//         </ResumeProvider>
//       </body>
//     </html>
//   );
// }



// import "../../../globals.css";
// import { ResumeProvider } from "./_context/ResumeContext";
// import Sidebar from "../../../../components/layout/Sidebar";
// import Header from "../../../../components/layout/Header";
// import { Montserrat } from "next/font/google";

// const montserrat = Montserrat({
//   variable: "--font-montserrat",
//   subsets: ["latin"],
//   weight: ["400", "500", "700", "900"],
// });

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className={`${montserrat.variable} antialiased font-montserrat`}>
//         <ResumeProvider>
//           <Header />
//           <div className="flex pt-20 bg-blue-100 ">
//             <Sidebar />
//             <div className="flex-1 ml-22 overflow-auto">{children}</div>
//           </div>
//         </ResumeProvider>
//       </body>
//     </html>
//   );
// }



import "../../../globals.css";
import { ResumeProvider } from "./_context/ResumeContext";
import { ScoreProvider } from "./_context/ScoreContext";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased font-montserrat`}>
        <ResumeProvider>
          <ScoreProvider>
            <Header />
            <div className="flex pt-13 bg-blue-100 ">
              <Sidebar />
              <div className="flex-1 ml-20 overflow-auto">{children}</div>
            </div>
          </ScoreProvider>
        </ResumeProvider>
      </body>
    </html>
  );
}
