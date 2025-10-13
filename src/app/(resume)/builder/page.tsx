import React from "react";
import Header from "./_components/Header";
import ResumeSide from "./_components/resumeSidebar/ResumeSide";
import TemplatesSidebar from "./_components/templateSidebar/TemplatesSidebar";
import PreviewPanel from "./_components/PreviewPanel";


const Builder: React.FC = () => (
  <>
  {/* <div className="h-screen overflow-y-auto">  */}
    <Header />
    <div className="flex h-screen">
      <ResumeSide />
      <main className="flex-1 bg-gray-50 px-10 py-8">
        {/* Add your main resume content here */}
        <PreviewPanel />
      </main>
      <TemplatesSidebar />
    </div>
  {/* </div>  */}
  </>

);

export default Builder;
