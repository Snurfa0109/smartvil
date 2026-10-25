"use client";

/**
 * [KOMPONEN / SHARED] Banner Hero Halaman Publik
 * Banner visual atas setiap halaman dengan judul dinamis dan gambar latar kelurahan.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Calendar 
} from "lucide-react";
import { 
  BannerPages, 
  PageBannerData, 
  DEFAULT_PAGE_BANNERS, 
  getAllBanners 
} from "@/lib/banners-config";

interface PageBannerProps {
  pageKey: BannerPages;
  overrideTitle?: string;
  overrideSubtitle?: string;
  overrideBadge?: string;
  sideContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageBanner({
  pageKey,
  overrideTitle,
  overrideSubtitle,
  overrideBadge,
  sideContent,
  children,
}: PageBannerProps) {
  const [banner, setBanner] = useState<PageBannerData>(DEFAULT_PAGE_BANNERS[pageKey]);

  useEffect(() => {
    let isMounted = true;
    getAllBanners()
      .then((configs) => {
        if (isMounted && configs[pageKey]) {
          setBanner(configs[pageKey]);
        }
      })
      .catch((err) => console.error("Banner fetch error:", err));

    return () => {
      isMounted = false;
    };
  }, [pageKey]);

  const activeTitle = overrideTitle || banner.title;
  const activeSubtitle = overrideSubtitle || banner.subtitle;
  const activeBadge = overrideBadge || banner.badge;
  const isCustomEvent = banner.enabledCustom;

  return (
    <div className="relative w-full min-h-[380px] md:min-h-[430px] bg-[#0B1B2B] text-white overflow-hidden flex items-center border-b border-slate-800">
      
      
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={banner.imageUrl}
          alt={activeTitle}
          className="w-full h-full object-cover object-center scale-105"
        />

        
        
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1B2B] via-[#0B1B2B]/90 sm:via-[#0B1B2B]/75 to-transparent" />
        
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B2B] via-transparent to-[#0B1B2B]/40" />
      </div>

      
      <div className="relative container mx-auto px-6 md:px-12 py-12 md:py-16 z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          <div className={`${sideContent ? "lg:col-span-7" : "lg:col-span-12 max-w-3xl"} space-y-5`}>
            
            
            <div className="flex flex-wrap items-center gap-2.5">
              {isCustomEvent ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-700 text-white border border-rose-500/40 shadow-xs">
                  <Calendar className="w-3.5 h-3.5 text-rose-200" />
                  <span>AGENDA RESMI</span>
                  {banner.eventDate && (
                    <>
                      <span className="opacity-50">•</span>
                      <span>{banner.eventDate}</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/20 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{activeBadge}</span>
                </div>
              )}
            </div>

            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
              {activeTitle}
            </h1>

            
            <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl font-normal drop-shadow-sm">
              {activeSubtitle}
            </p>

            
            {children ? (
              <div className="pt-2">
                {children}
              </div>
            ) : (
              (banner.actionText || banner.secondaryActionText) && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {banner.actionText && banner.actionUrl && (
                    <Link href={banner.actionUrl}>
                      <button className="bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold px-6 py-3 rounded-lg text-sm inline-flex items-center gap-2 shadow-md transition-all hover:translate-x-0.5 cursor-pointer">
                        <span>{banner.actionText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  )}

                  {banner.secondaryActionText && banner.secondaryActionUrl && (
                    <Link href={banner.secondaryActionUrl}>
                      <button className="border border-slate-700 hover:border-slate-500 bg-[#0F2236]/90 hover:bg-[#142d47] text-white font-medium px-6 py-3 rounded-lg text-sm transition-all cursor-pointer backdrop-blur-sm">
                        {banner.secondaryActionText}
                      </button>
                    </Link>
                  )}
                </div>
              )
            )}

          </div>

          
          {sideContent && (
            <div className="lg:col-span-5 w-full">
              {sideContent}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
