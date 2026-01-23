// import "../../../globals.css";
// import Sidebar from "../../../../components/layout/Sidebar";
// import Header from "../../../../components/layout/Header";
// import { Montserrat } from "next/font/google";

// const montserrat = Montserrat({
//   variable: "--font-montserrat",
//   subsets: ["latin"],
//   weight: ["400", "500", "700", "900"],
// });

// export default function ResumeLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className={`${montserrat.variable} antialiased font-montserrat`}>
//         <Header />
//         <div className="flex pt-14 bg-white min-h-screen">
//           <Sidebar />
//           <div className="flex-1 ml-25 overflow-auto">{children}</div>
//         </div>
//       </body>
//     </html>
//   );
// }


import "../../../globals.css";
import Sidebar from "../../../../components/layout/Sidebar";
import Header from "../../../../components/layout/Header";
import { Montserrat } from "next/font/google";
import { ResumeProvider } from "../creation/_context/ResumeContext";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export default function ResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} antialiased font-montserrat`}>
        <Header />
        <div className="flex pt-14 bg-white min-h-screen">
          <Sidebar />
          <div className="flex-1 ml-25 overflow-auto">
            <ResumeProvider>
              {children}
            </ResumeProvider>
          </div>
        </div>
      </body>
    </html>
  );
}

