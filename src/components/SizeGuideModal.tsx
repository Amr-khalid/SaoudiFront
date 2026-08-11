'use client';

import React from 'react';
import { useApp } from '../context/AppContext';

export const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, setIsSizeGuideOpen } = useApp();

  if (!isSizeGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0B0B]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121414] border border-[#e8c177]/40 max-w-xl w-full p-8 rounded-xs space-y-6 shadow-2xl relative animate-fade-up">
        <button
          onClick={() => setIsSizeGuideOpen(false)}
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 text-[#e8c177] hover:text-[#c8a45d] cursor-pointer"
        >
          <span className="material-symbols-outlined text-2xl">close</span>
        </button>

        <div className="space-y-2">
          <span className="font-label-caps text-xs text-[#e8c177] uppercase tracking-widest">
            SAOUDI WEAR ATELIER
          </span>
          <h3 className="font-headline-lg text-2xl font-garamond text-[#e3e2e2]">
            Size & Fitting Guide
          </h3>
        </div>

        <div className="space-y-4 text-xs font-body-md text-[#d1c5b4]">
          <p className="leading-relaxed">
            All SAOUDI WEAR garments and horology straps are constructed according to traditional European tailored dimensions.
          </p>

          <table className="w-full text-left rtl:text-right border-collapse">
            <thead>
              <tr className="border-b border-[#e8c177]/40 text-[#e8c177] font-label-caps uppercase text-[10px]">
                <th className="py-2">Size</th>
                <th className="py-2">EU Suit Size</th>
                <th className="py-2">Chest (Inches)</th>
                <th className="py-2">Wrist Circumference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4d4639]/20 text-[#e3e2e2]">
              <tr>
                <td className="py-2.5 font-bold text-[#e8c177]">S / Standard</td>
                <td className="py-2.5">48 EU</td>
                <td className="py-2.5">38"</td>
                <td className="py-2.5">165mm - 180mm</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-[#e8c177]">M / Standard</td>
                <td className="py-2.5">50 EU</td>
                <td className="py-2.5">40"</td>
                <td className="py-2.5">175mm - 190mm</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-[#e8c177]">L / Extended</td>
                <td className="py-2.5">52 EU</td>
                <td className="py-2.5">42"</td>
                <td className="py-2.5">185mm - 205mm</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-[#e8c177]">XL / Extended</td>
                <td className="py-2.5">54 EU</td>
                <td className="py-2.5">44"</td>
                <td className="py-2.5">195mm - 215mm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          onClick={() => setIsSizeGuideOpen(false)}
          className="w-full py-3 bg-[#e8c177] text-[#402d00] font-button text-xs tracking-widest uppercase font-bold cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
