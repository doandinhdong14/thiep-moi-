"use client";

import { useState } from "react";
import { Plus, Minus, HelpCircle } from "lucide-react";
import { faqList } from "@/data/landingData";

export default function FaqAccordion() {
  const [openId, setOpenId] = useState<string | null>("faq-1"); // Open first item by default

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-14 lg:py-20 bg-white">
      <div className="max-w-[820px] mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#fa416a] text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Giải đáp thắc mắc</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent">
            Câu hỏi thường gặp
          </h2>
        </div>

        {/* Accordion Rows */}
        <div className="space-y-2.5">
          {faqList.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="bg-[#fafafa] border border-[#e6e8eb] rounded-[11px] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  id={`faq-btn-${item.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-content-${item.id}`}
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between gap-4 p-4 sm:p-5 text-left min-h-[58px] cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <span className="text-[14px] sm:text-[15px] font-semibold text-[#19191f] leading-snug">
                    {item.question}
                  </span>
                  <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[#fa416a]">
                    {isOpen ? (
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-content-${item.id}`}
                    role="region"
                    aria-labelledby={`faq-btn-${item.id}`}
                    className="px-4 pb-5 sm:px-5 sm:pb-5 text-[13px] sm:text-[14px] text-[#73737d] leading-relaxed border-t border-slate-100/80 pt-3 animate-fadeIn"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

