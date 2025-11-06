"use client"
import AuthModal from "@/components/SignUpModal";
import { useState } from "react";

export default function Home() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="flex justify-self-end  gap-2 border border-neutral-200 cursor-pointer bg-black text-white font-semibold rounded-lg px-6 py-3 m-4">
        SignUp
      </button>
      <AuthModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
