import Image from "next/image";
import { ArrowRight } from "lucide-react";
import styles from "./TestimonialsSection.module.css";

const testimonials = [
  {
    name: "Rajesh Kumar",
    role: "Software Engineer | 3+ years",
    image: "/images/Person1.svg",
    quote: "CareerBOT helped me identify the missing skills and gave clear suggestions. I could tailor my resume quickly and ended up getting more interview calls.",
    before: "62%", after: "89%",
  },
  {
    name: "Rahul Mehta",
    role: "Frontend Developer | 2+ years",
    image: "/images/Person 2.svg",
    quote: <>The skill gap analysis was super helpful. I understand<br />{" "}what to improve and updated my resume<br />{" "}accordingly. It made my profile much stronger.</>,
    before: "58%", after: "84%",
  },
  {
    name: "Ananya Rao",
    role: "Product Designer | 5+ years",
    image: "/images/Person3.svg",
    quote: "CareerBOT suggestions helped me highlight my achievements better. My match score improved significantly and I felt more confident applying for jobs.",
    before: "71%", after: "92%",
  },
] as const;

export default function TestimonialsSection() {
  return (
    <section className={styles.section} aria-labelledby="jobmatch-testimonials-title">
      <div className={styles.content}>
        <h2 id="jobmatch-testimonials-title" className={styles.heading}>Resumes improved with <span>CareerBOT</span></h2>
        <p className={styles.subtitle}>See how CareerBOT users improved their resumes and strengthened their<br className={styles.copyBreak} />{" "}application readiness.</p>
        <div className={styles.cards}>
          {testimonials.map(testimonial => (
            <figure key={testimonial.name} className={styles.card}>
              <figcaption className={styles.author}>
                <Image src={testimonial.image} width={53} height={53} alt="" className={styles.avatar} unoptimized />
                <div>
                  <h3>{testimonial.name}</h3>
                  <p>{testimonial.role}</p>
                </div>
              </figcaption>
              <Image src="/images/jobmatch-reference/testimonials-icon.svg" width={25} height={16} alt="" className={styles.quoteIcon} unoptimized />
              <blockquote className={styles.quote}>{testimonial.quote}</blockquote>
              <div className={styles.scores} aria-label={`Match score: ${testimonial.before} before, ${testimonial.after} after`}>
                <div><strong>{testimonial.before}</strong><span>Before</span></div>
                <ArrowRight aria-hidden="true" />
                <div><strong>{testimonial.after}</strong><span>After</span></div>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
