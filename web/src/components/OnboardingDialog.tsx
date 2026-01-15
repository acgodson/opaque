"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "opaque_onboarding_completed";

export function OnboardingDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const currentSlideRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !slidesContainerRef.current) return;

    const container = slidesContainerRef.current;
    
    const slidesHTML = ``
    container.innerHTML = slidesHTML;

    const slides = container.querySelectorAll('.onboarding-slide');
    const prevBtn = container.querySelector('#onboardingPrevBtn') as HTMLButtonElement;
    const nextBtn = container.querySelector('#onboardingNextBtn') as HTMLButtonElement;

    const showSlide = (n: number) => {
      slides.forEach((slide, index) => {
        if (index === n) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      if (prevBtn) prevBtn.disabled = n === 0;
      if (nextBtn) nextBtn.disabled = n === slides.length - 1;

      currentSlideRef.current = n;
      
      if (n === 7) {
        setShowClose(true);
      } else {
        setShowClose(false);
      }
    };

    const changeSlide = (direction: number) => {
      let newSlide = currentSlideRef.current + direction;
      if (newSlide < 0) newSlide = 0;
      if (newSlide >= slides.length) newSlide = slides.length - 1;
      showSlide(newSlide);
    };

    if (prevBtn) {
      prevBtn.onclick = () => changeSlide(-1);
    }
    if (nextBtn) {
      nextBtn.onclick = () => changeSlide(1);
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') changeSlide(-1);
      if (e.key === 'ArrowRight') changeSlide(1);
    };

    document.addEventListener('keydown', handleKeydown);
    showSlide(0);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      <div 
        className="relative bg-[#0a0e1a] rounded-lg shadow-2xl overflow-hidden transition-all duration-300 w-full h-full md:w-[50vw] md:h-[80vh] md:max-w-[1200px] md:max-h-[800px]"
        style={{
          animation: 'fadeIn 0.3s ease-out, slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="absolute top-4 right-4 z-[10000] cursor-pointer hover:opacity-80 transition-opacity"
          style={{ display: showClose ? 'block' : 'none' }}
        >
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div 
          ref={slidesContainerRef}
          className="w-full h-full"
          style={{ fontFamily: "'Rajdhani', sans-serif" }}
        />
      </div>
    </div>
    </>
  );
}

