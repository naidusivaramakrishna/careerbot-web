'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote: 'My ATS score improved from 45 to 89. CareerBot helped me fix keywords and format instantly.',
    name: 'Priya S.',
    city: 'Chennai',
    initial: 'P',
    tone: 'bg-violet-100 text-violet-700',
  },
  {
    quote: 'Spent 30 minutes building a new resume from scratch. The AI enhancement made it much clearer.',
    name: 'Rahul M.',
    city: 'Hyderabad',
    initial: 'R',
    tone: 'bg-emerald-100 text-emerald-700',
  },
  {
    quote: 'Before I was applying blindly. Now I can match score and focus on roles where I have a real chance.',
    name: 'Sneha K.',
    city: 'Bangalore',
    initial: 'S',
    tone: 'bg-amber-100 text-amber-700',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-10">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.42 }}
        >
          <span className="inline-flex rounded-full bg-[#eef5ff] px-3 py-1.5 text-[10px] font-black uppercase text-[#2557a7]">
            Testimonials
          </span>
          <h2 className="mt-4 text-[28px] font-black leading-tight text-[#08143f] md:text-[34px]">
            Loved by Job Seekers Across India
          </h2>
          <p className="mt-3 text-sm font-bold text-[#08143f]">
            12,400+ job seekers improving their resumes with CareerBot every month
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              className="rounded-lg border border-[#dce8fb] bg-white p-5 shadow-[0_10px_26px_rgba(37,87,167,0.06)]"
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.38, delay: index * 0.05 }}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={15} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 min-h-[82px] text-xs font-semibold leading-6 text-[#33446c]">{testimonial.quote}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${testimonial.tone}`}>
                  {testimonial.initial}
                </div>
                <div>
                  <p className="text-sm font-black text-[#08143f]">{testimonial.name}</p>
                  <p className="text-xs font-medium text-[#66779d]">{testimonial.city}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
