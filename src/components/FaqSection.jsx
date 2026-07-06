import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: 'What is Artisite?',
    answer: 'Artisite is a premium digital publication dedicated to long-form editorial essays at the intersection of design, technology, culture, and science. Our mission is to provide an immersive, distraction-free reading experience that celebrates depth, nuance, and premium visual design.'
  },
  {
    question: 'Who are the writers and contributors?',
    answer: 'Our contributors are design historians, technology architects, cognitive scientists, and cultural critics. Every essay published is thoroughly researched and reviewed to maintain the highest editorial standards. We believe in quality over quantity, publishing only works that offer lasting value.'
  },
  {
    question: 'Can I submit an article or pitch an essay?',
    answer: 'We are always looking for fresh perspectives. While we do not have an open article creation tool on the public website to maintain our curated editorial focus, you can submit pitches directly to our editorial board. Check back soon for our writer application system.'
  },
  {
    question: 'How often is new content published?',
    answer: 'We follow a weekly publishing schedule. A new featured essay is released every Monday, with secondary perspectives and follow-up discussions published on Thursdays. Subscribing to our newsletter is the best way to get notified of new pieces.'
  },
  {
    question: 'Is there a subscription model or paywall?',
    answer: 'Currently, Artisite is fully open and free to read. We believe high-quality writing and thought-provoking analysis should be accessible. In the future, we may introduce a premium membership offering exclusive newsletters, audio narrations, and physical print collections.'
  }
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full bg-editorial-paper border-t border-neutral-200/50 py-20 px-6 md:px-12 dark:bg-neutral-900/40 dark:border-neutral-800/80 transition-colors duration-300">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-editorial-gold/10 text-editorial-gold-dark mb-4 dark:bg-editorial-gold/20 dark:text-editorial-gold-light">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-editorial-ink dark:text-neutral-100">
            Frequently Answered Questions
          </h2>
          <p className="text-neutral-500 mt-2 max-w-md mx-auto text-sm dark:text-neutral-400">
            Curious about our platform, submissions, or editorial guidelines? Find key answers here.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-neutral-200/60 bg-white transition-all duration-300 dark:border-neutral-800/60 dark:bg-editorial-card-dark"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left font-serif text-base md:text-lg font-bold text-editorial-ink dark:text-neutral-100 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-editorial-gold' : ''
                    }`}
                  />
                </button>
                <div className={`faq-content ${isOpen ? 'open border-t border-neutral-100 dark:border-neutral-800/50' : ''}`}>
                  <p className="px-6 py-5 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
