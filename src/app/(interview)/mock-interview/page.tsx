"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, CheckCircle2, ChevronDown, FileText, History, Mic, ShieldCheck, Sparkles, Video } from "lucide-react";
import LandingNavbar from "@/app/(landing)/_components/LandingNavbar";
import SignUpModal from "@/components/SignUpModal";
import { useAuth } from "@/hooks/useAuth";

const faqs = [
  { question: "Do I need to practice before the live mock interview?", answer: "No. Start your live mock interview directly. Notes, English Essentials, HR practice, and technical practice are optional preparation tools you can use whenever you need them." },
  { question: "How does the AI voice interview work?", answer: "The AI interviewer asks questions aloud. Speak naturally into your microphone while your answers are transcribed. After the session, review your scores, transcripts, and personalised feedback in your report." },
  { question: "How many questions are in the live interview?", answer: "The interviewer guides the session based on your interview type and answers, and may ask follow-up questions. Your final report includes the questions covered in your session." },
  { question: "Can I practice multiple times?", answer: "Yes. Return for another mock interview and compare completed sessions in History & Reports. Optional preparation tools are also available between attempts." },
  { question: "Is a microphone and camera required?", answer: "The room check tests your microphone, camera, speakers, and connection before you start. Use a laptop or desktop in a quiet environment for the best experience." },
];

function InterviewPreview() {
  const [phase, setPhase] = useState(0);
  useEffect(() => { const timer = setInterval(() => setPhase(value => (value + 1) % 3), 2800); return () => clearInterval(timer); }, []);
  return <div className="mi-demo" aria-label="Mock interview preview">
    <div className="mi-demo-top"><span><span className="mi-status-dot" /> Interview preview</span><Video size={18} /></div>
    <div className="mi-demo-portrait"><Image src="/images/avatar/ananya-fallback.jpg" alt="Ananya, AI interviewer" fill sizes="(min-width: 1024px) 480px, 90vw" priority /><div><strong>Ananya</strong><span>Your AI interviewer</span></div></div>
    <div className="mi-demo-prompt"><p className="mi-eyebrow">{["A focused question", "Space to find your voice", "Feedback you can act on"][phase]}</p><h3>{["Tell me about a challenge you helped your team overcome.", "Take your time. Make your experience the story.", "Reflect. Refine. Return with more confidence."][phase]}</h3><div className="mi-demo-wave" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ height: `${10 + (index * 13 % 28)}px`, animationDelay: `${index * .06}s` }} />)}</div></div>
    <div className="mi-demo-footer">{["Question", "Your answer", "Report"].map((label, index) => <span className={phase === index ? "is-active" : ""} key={label}>{index + 1}<strong>{label}</strong></span>)}</div>
    <div className="mi-demo-float"><ShieldCheck size={21} /><div><strong>A safe place to practise</strong><small>Real experience. Room to improve.</small></div></div>
  </div>;
}

export default function MockInterviewPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const handleStartMockInterview = () => { if (authLoading) return; if (isAuthenticated) { router.push("/mock-interview/live"); return; } setShowAuthModal(true); };
  const startLabel = authLoading ? "Checking Sign In..." : "Start Mock Interview";

  return <>
    <LandingNavbar />
    <main className="mi-public">
      <section className="mi-public-hero mi-page">
        <div className="mi-public-copy"><span className="mi-pill"><Sparkles size={15} /> AI-POWERED MOCK INTERVIEW</span><h1>Your next interview.<br /><em>Your best version.</em></h1><p>Turn interview nerves into a clear, confident conversation. Practise with an AI interviewer and leave with a plan for your next attempt.</p><div className="mi-actions"><button onClick={handleStartMockInterview} disabled={authLoading} className="mi-button">{startLabel}<ArrowRight size={18} /></button><button onClick={() => router.push("/mock-interview/history")} className="mi-button mi-button-secondary"><History size={18} />View History</button></div><div className="mi-hero-assurances"><span><CheckCircle2 size={16} /> Role-focused conversations</span><span><CheckCircle2 size={16} /> Personalised feedback</span></div></div>
        <InterviewPreview />
      </section>
      <section className="mi-page mi-public-workflow" aria-labelledby="mi-how-heading"><div className="mi-section-heading"><div><p className="mi-eyebrow">A CLEAR PATH TO CONFIDENCE</p><h2 id="mi-how-heading">One session. A stronger next step.</h2></div><p>From a quick room check to a detailed report, every step helps you practise with purpose.</p></div><div className="mi-workflow-grid">{[
        { Icon: Mic, title: "Get your room ready", copy: "Check your microphone, camera, speakers, and connection in one guided setup." },
        { Icon: Video, title: "Have the conversation", copy: "Choose your role and interview format. Listen, respond naturally, and let the interviewer guide you." },
        { Icon: BarChart3, title: "Make progress visible", copy: "Review your transcript, scores, and feedback. Track completed sessions and work on your next step." },
      ].map(({ Icon, title, copy }, index) => <article className="mi-workflow-card" key={title}><div><span className="mi-icon-tile"><Icon size={25} /></span><span className="mi-step-number">0{index + 1}</span></div><h3>{title}</h3><p>{copy}</p>{index < 2 && <ArrowRight className="mi-workflow-arrow" size={22} aria-hidden="true" />}</article>)}</div><div className="mi-next-action"><div><strong>Ready for a conversation that moves you forward?</strong><p>Start with the room check. Optional preparation is always available.</p></div><button className="mi-button" onClick={handleStartMockInterview} disabled={authLoading}>{startLabel}<ArrowRight size={18} /></button></div></section>
      <section className="mi-page mi-public-features"><div className="mi-section-heading"><div><p className="mi-eyebrow">MORE THAN A PRACTICE RUN</p><h2>Know what worked.<br />Know what to work on.</h2></div><p>Bring your experience. We�ll help you practise how to communicate it.</p></div><div className="mi-feature-grid">{[
        { Icon: Video, title: "A conversation, not a script", copy: "Build confidence answering spoken questions with an AI interviewer, one response at a time." },
        { Icon: FileText, title: "Your answers, in perspective", copy: "Revisit question-by-question transcripts and feedback in a report built around your session." },
        { Icon: History, title: "Every attempt has a place", copy: "Keep completed sessions together, compare your scores, and return to the feedback that matters." },
      ].map(({ Icon, title, copy }) => <article className="mi-panel" key={title}><Icon size={28} /><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
      <section className="mi-page mi-faq"><div><p className="mi-eyebrow">BEFORE YOU BEGIN</p><h2>A little clarity.<br />A better start.</h2><p>Have another question?<br /><a href="mailto:support@careerbot.ai">Talk to our support team <ArrowRight size={15} /></a></p></div><div className="mi-faq-list">{faqs.map((faq, index) => <article key={faq.question}><button aria-expanded={openFaq === index} aria-controls={`mi-faq-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{faq.question}<ChevronDown size={18} /></button>{openFaq === index && <p id={`mi-faq-${index}`}>{faq.answer}</p>}</article>)}</div></section>
      <section className="mi-page"><div className="mi-public-cta"><span className="mi-icon-tile"><Sparkles size={26} /></span><h2>Confidence comes from showing up.</h2><p>Make this your next step toward a stronger interview.</p><button className="mi-button" onClick={handleStartMockInterview} disabled={authLoading}>{startLabel}<ArrowRight size={18} /></button></div></section>
    </main>
    <SignUpModal open={showAuthModal} initialFormType="signin" onClose={() => setShowAuthModal(false)} redirectTo="/mock-interview/live" />
  </>;
}
