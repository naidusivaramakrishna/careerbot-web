// "use client";

// import React, { useEffect, useRef, useState } from "react";

// interface Props {
//   children: React.ReactNode;
// }

// const PAGE_HEIGHT = 1122; // Your A4 height

// const AutoPaginator: React.FC<Props> = ({ children }) => {
//   const measureRef = useRef<HTMLDivElement>(null);
//   const [pages, setPages] = useState<React.ReactNode[][]>([]);

//   useEffect(() => {
//     if (!measureRef.current) return;

//     const reactChildren = React.Children.toArray(children);

//     // Clear measurement container
//     const container = measureRef.current;
//     container.innerHTML = "";

//     const heights: number[] = [];

//     // Render each child separately for measuring
//     reactChildren.forEach((child, index) => {
//       const wrapper = document.createElement("div");
//       wrapper.style.width = "100%";
//       container.appendChild(wrapper);

//       wrapper.innerHTML = ""; // reset

//       // ⛔ We do NOT use createRoot or React here
//       // We simply clone the DOM using innerHTML for height measurement
//       const temp = document.createElement("div");
//       wrapper.appendChild(temp);

//       temp.innerHTML = containerFromReact(child);

//       heights[index] = temp.offsetHeight;

//       wrapper.remove();
//     });

//     // Group children into pages
//     const newPages: React.ReactNode[][] = [[]];
//     let currentHeight = 0;

//     reactChildren.forEach((child, i) => {
//       const h = heights[i];

//       if (currentHeight + h > PAGE_HEIGHT - 60) {
//         newPages.push([]);
//         currentHeight = 0;
//       }

//       newPages[newPages.length - 1].push(child);
//       currentHeight += h;
//     });

//     setPages(newPages);
//   }, [children]);

//   return (
//     <>
//       {/* Hidden measuring container */}
//       <div ref={measureRef} className="hidden-content"></div>

//       {/* Render real pages */}
//       <div className="resume-container">
//         {pages.map((page, idx) => (
//           <div key={idx} className="a4-page">
//             <div className="a4-page-content">
//               {page.map((child, i) => (
//                 <React.Fragment key={i}>{child}</React.Fragment>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </>
//   );
// };

// /**
//  * Convert React element to temporary HTML for measuring height.
//  * This is a safe string-only clone.
//  */
// function containerFromReact(child: React.ReactNode) {
//   const div = document.createElement("div");
//   const temp = document.createElement("div");
//   div.appendChild(temp);

//   // Serialize child into HTML for height measurement
//   temp.innerHTML = (child as any)?.props?.children
//     ? childToHtml(child)
//     : "";

//   return temp.innerHTML;
// }

// function childToHtml(child: any): string {
//   if (typeof child === "string" || typeof child === "number") return child.toString();
//   if (!child?.props) return "";

//   let html = "<div>";

//   if (child.props.children) {
//     React.Children.forEach(child.props.children, (inner: any) => {
//       html += childToHtml(inner);
//     });
//   }

//   html += "</div>";
//   return html;
// }

// export default AutoPaginator;  All good before pg no added



"use client";

import React, { useEffect, useRef, useState } from "react";

interface AutoPaginatorProps {
  children: React.ReactNode;
  onPageCountChange?: (count: number) => void; // send page count to PreviewPanel
}

const PAGE_HEIGHT = 1122;

const AutoPaginator: React.FC<AutoPaginatorProps> = ({ children, onPageCountChange }) => {
  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<React.ReactNode[][]>([]);

  useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    const reactNodes = React.Children.toArray(children);
    container.innerHTML = "";

    const heights: number[] = [];

    reactNodes.forEach((child, idx) => {
      const wrapper = document.createElement("div");
      wrapper.style.width = "100%";
      container.appendChild(wrapper);

      wrapper.innerHTML = "<div></div>";
      const temp = wrapper.firstElementChild as HTMLElement;

      temp.innerHTML = serialize(child);
      heights[idx] = temp.offsetHeight;

      wrapper.remove();
    });

    // Group elements into A4 pages
    const newPages: React.ReactNode[][] = [[]];
    let curHeight = 0;

    reactNodes.forEach((child, idx) => {
      const h = heights[idx];

      if (curHeight + h > PAGE_HEIGHT - 60) {
        newPages.push([]);
        curHeight = 0;
      }

      newPages[newPages.length - 1].push(child);
      curHeight += h;
    });

    setPages(newPages);
    onPageCountChange?.(newPages.length); // IMPORTANT: Notify PreviewPanel
  }, [children]);

  return (
    <>
      {/* hidden measuring container */}
      <div ref={measureRef} className="hidden-content" />

      {/* rendered A4 pages */}
      <div className="resume-container">
        {pages.map((page, idx) => (
          <div key={idx} className="a4-page">
            <div className="a4-page-content">
              {page.map((node, i) => (
                <React.Fragment key={i}>{node}</React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

/* Convert React node to HTML string for height measurement */
function serialize(child: any): string {
  if (typeof child === "string" || typeof child === "number") return `${child}`;
  if (!child?.props) return "";

  let html = "<div>";
  React.Children.forEach(child.props.children, (inner) => {
    html += serialize(inner);
  });
  html += "</div>";

  return html;
}

export default AutoPaginator;

