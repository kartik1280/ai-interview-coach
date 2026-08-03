import React from 'react'
import { motion } from 'framer-motion'
import { Star, Quote, CheckCircle2 } from 'lucide-react'

export default function ReviewsSection() {
  const reviews = [
    {
      name: 'Sarah Chen',
      role: 'Senior Product Manager @ Stripe',
      quote: 'Before InterviewOS, I froze on behavioral questions. Practice mode gave me the exact confidence boost I needed to land my dream offer!',
      rating: 5
    },
    {
      name: 'Marcus Vance',
      role: 'Full Stack Engineer @ Vercel',
      quote: 'The AI asked follow-ups that felt shockingly real. It pushed me to explain my system architecture choices much more clearly.',
      rating: 5
    },
    {
      name: 'Elena Rostova',
      role: 'UX Research Lead @ Figma',
      quote: 'The STAR framework breakdown after each mock session changed how I structure my answers. Worth every second of practice.',
      rating: 5
    }
  ]

  return (
    <section id="reviews" className="py-24 px-6 max-w-6xl mx-auto border-t border-black/10">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-block px-3 py-1 bg-parker-purple text-white font-fragment text-xs font-bold rounded-md mb-3 shadow-sm uppercase tracking-wider">
          CANDIDATE REVIEWS
        </div>
        <h2 className="font-radio text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
          Loved by Job Seekers Worldwide
        </h2>
        <p className="font-radio text-base text-stone-600 mt-3">
          See how candidates turned interview anxiety into top-tier job offers.
        </p>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.map((rev, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -6 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-white border-2 border-black rounded-2xl p-7 shadow-[5px_5px_0px_0px_#000000] flex flex-col justify-between relative"
          >
            <div>
              {/* Rating Stars */}
              <div className="flex items-center gap-1 mb-4 text-amber-400">
                {[...Array(rev.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>

              {/* Quote text */}
              <p className="font-radio text-sm text-black leading-relaxed italic mb-6">
                "{rev.quote}"
              </p>
            </div>

            {/* Author */}
            <div className="pt-4 border-t border-stone-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-parker-red text-white font-bold text-sm flex items-center justify-center border border-black shadow-xs">
                {rev.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-radio font-bold text-sm text-black flex items-center gap-1">
                  {rev.name}
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
                </h4>
                <p className="font-radio text-xs text-stone-500">
                  {rev.role}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
