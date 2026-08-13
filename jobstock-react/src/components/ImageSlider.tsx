"use client";

import { useState, useEffect } from "react";

export default function ImageSlider({ images, autoScroll = false, height = '450px' }: { images: string[], autoScroll?: boolean, height?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!autoScroll || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [autoScroll, images.length]);

  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="position-relative overflow-hidden rounded-4 shadow-sm" style={{ height, backgroundColor: '#f8f9fa' }}>
      <div 
        className="d-flex h-100" 
        style={{ 
          transition: 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)', 
          transform: `translateX(-${activeIndex * 100}%)` 
        }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="flex-shrink-0 w-100 h-100 position-relative">
            <img 
              src={img} 
              alt={`Gallery Image ${idx + 1}`} 
              className="w-100 h-100" 
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button 
            className="btn btn-light position-absolute top-50 start-0 translate-middle-y ms-3 rounded-circle shadow d-flex align-items-center justify-content-center" 
            style={{ width: '45px', height: '45px', opacity: 0.9, border: 'none', transition: 'all 0.2s' }}
            onClick={handlePrev}
            aria-label="Previous image"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          
          <button 
            className="btn btn-light position-absolute top-50 end-0 translate-middle-y me-3 rounded-circle shadow d-flex align-items-center justify-content-center" 
            style={{ width: '45px', height: '45px', opacity: 0.9, border: 'none', transition: 'all 0.2s' }}
            onClick={handleNext}
            aria-label="Next image"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>

          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4 d-flex gap-2 p-2 rounded-pill shadow-sm" style={{ background: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(10px)' }}>
            {images.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`btn p-0 rounded-circle ${activeIndex === idx ? 'bg-primary' : 'bg-white'}`}
                style={{ 
                  width: activeIndex === idx ? '24px' : '10px', 
                  height: '10px', 
                  opacity: activeIndex === idx ? 1 : 0.8, 
                  border: 'none',
                  borderRadius: '10px',
                  transition: 'all 0.3s ease'
                }}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
