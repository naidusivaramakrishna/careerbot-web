"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

const PDFPreviewError: React.FC<{ error: string }> = ({ error }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
    <AlertCircle className="w-16 h-16 text-red-400" />
    <div className="text-center">
      <h4 className="font-bold text-slate-800 mb-2">Unable to Load PDF</h4>
      <p className="text-sm text-slate-600">{error}</p>
    </div>
  </div>
);

export default PDFPreviewError;
