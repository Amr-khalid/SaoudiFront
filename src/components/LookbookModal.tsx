'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export const LookbookModal: React.FC = () => {
  const router = useRouter();
  const { isLookbookOpen, setIsLookbookOpen } = useApp();
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      title: 'Autumn in Milano',
      subtitle: 'Charcoal Tailored Overcoat & Pure Cashmere Turtleneck',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBN95w58zxTxcr5DpTVD5hknLn1Xl3F38if7eQovvf-HuwQDzlsC0Vmp2rE2oW9EKA6xXRH7CB6_9DVraVUYS7MFGaWl65ADGuQbnDzQjVNkLfIWOB_r5_aORCa9u4LAw_jD1UfmDPos4As1FFZjyK57Zqf6poHNCQVPSUq3YdU9aap92q0XyVHhsX3_60s7-24SNExevxZGsax2Q-pSFsA4vKSfjhNNygm1x8w395KT5Fr-9hsU-o',
      productId: 'charcoal-tailored-overcoat',
    },
    {
      title: 'Monochrome Stealth',
      subtitle: 'The Obsidian Chronograph Rose Gold Edition',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBdfkqeHwK78EKhDX94IkeB6MMm3j5BALCT7tvYLF2I_BFzrKqY4hKwvEO55sXKgj0qbDENcQgFkOj-s0mVnT9cyIi_u5fCfH_90iz567aesfkp0G15bgn3n8q-p-tymErQNek0G029aXX8rHit69fkWdcGW1xPfGO_JUcJnxpXoLfzqHdOxmdEY3oVuoO0ENtOzYUFKjCc9HFIU52_2YJ5jg-ai7W2zWv_K3SQGjrzcLHa0A-PX1M',
      productId: 'obsidian-chronograph',
    },
    {
      title: 'Parisian Tailoring',
      subtitle: 'Heritage Camel Hair Trench Coat',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCorFP6Jzi5zYfw7wL74jaZVInGYR1C8JWSQX3s4TMMjahW3-tGKIAddxA56hXqwvoMzhU2oG_eLDKEPCCLcTiYXToqcOXYc7cFlFglQge9zCcapFyGuC7M6_zJj9qI1CGivyD3QQHOz4wKJ-KpK1xc64edh_zY7yZZfUshMdlh2cR67hyjCFxgKCoK5mbyBUHGDreVrSdLgaNeH0y7v4ryM3jzcb88p87LC5aCN0ow4EE7X-NSAMI',
      productId: 'heritage-camel-trench',
    },
  ];

  if (!isLookbookOpen) return null;

  const current = slides[slide];

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0B]/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="relative max-w-5xl w-full h-[85vh] bg-[#121414] border border-[#e8c177]/40 rounded-xs overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <button
          onClick={() => setIsLookbookOpen(false)}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-3 text-[#e8c177] bg-[#121414]/80 rounded-full hover:bg-[#e8c177] hover:text-[#402d00] cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        {/* Slide Image */}
        <div className="md:w-2/3 h-full relative bg-black">
          <Image src={current.image} alt={current.title} fill unoptimized className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
        </div>

        {/* Slide Narrative */}
        <div className="md:w-1/3 p-8 md:p-12 flex flex-col justify-between space-y-6 bg-[#121414] z-10">
          <div className="space-y-4">
            <span className="font-label-caps text-xs text-[#e8c177] tracking-[0.25em] uppercase">
              LOOKBOOK • {slide + 1} OF {slides.length}
            </span>
            <h3 className="font-headline-lg text-3xl font-garamond text-[#e3e2e2]">{current.title}</h3>
            <p className="font-body-md text-sm text-[#d1c5b4] font-light leading-relaxed">{current.subtitle}</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                const prodId = current.productId;
                setIsLookbookOpen(false);
                router.push(`/product/${prodId}`);
              }}
              className="w-full py-4 bg-[#e8c177] text-[#402d00] font-button text-xs tracking-widest uppercase font-bold cursor-pointer"
            >
              Shop Look Featured
            </button>

            {/* Navigation Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-[#4d4639]/30">
              <button
                onClick={() => setSlide((s) => (s === 0 ? slides.length - 1 : s - 1))}
                className="p-2 border border-[#4d4639] text-[#e8c177] hover:border-[#e8c177] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base rtl:rotate-180">arrow_back</span>
              </button>
              <span className="font-label-caps text-xs text-[#9a8f80]">
                {slide + 1} / {slides.length}
              </span>
              <button
                onClick={() => setSlide((s) => (s === slides.length - 1 ? 0 : s + 1))}
                className="p-2 border border-[#4d4639] text-[#e8c177] hover:border-[#e8c177] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base rtl:rotate-180">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
