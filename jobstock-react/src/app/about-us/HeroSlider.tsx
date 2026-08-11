"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AboutUs.module.css';

const slides = [
  {
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2850&q=80",
    title: "Empowering Careers, Elevating Businesses",
    subtitle: "JobStock bridges the gap between top talent and industry-leading companies through a secure, intelligent, and transparent platform."
  },
  {
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80",
    title: "Find Your Perfect Fit With AI",
    subtitle: "Our smart matching technology ensures that candidates find the roles they love, and employers find the talent they need."
  },
  {
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    title: "Verified Companies & Opportunities",
    subtitle: "Browse listings from 15k+ verified employers. No scams, just real, high-quality opportunities."
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.carouselContainer}>
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`${styles.carouselSlide} ${currentSlide === index ? styles.active : ''}`}
          >
            <img src={slide.image} alt={slide.title} className={styles.carouselImage} />
            <div className={styles.carouselOverlay}>
              <div className="container">
                <div className="row">
                  <div className="col-lg-8">
                    <div className={styles.heroContent}>
                      <h1 className={styles.heroTitle}>
                        {slide.title.split(', ').map((text, i, arr) => (
                          <React.Fragment key={i}>
                            {i === arr.length - 1 && arr.length > 1 ? <span>{text}</span> : text}
                            {i < arr.length - 1 && ', '}
                            {i === 0 && arr.length > 1 && <br />}
                          </React.Fragment>
                        ))}
                      </h1>
                      <p className={styles.heroSubtitle}>{slide.subtitle}</p>
                      <div className="d-flex gap-3">
                        <Link href="/jobs" className="btn btn-main px-4 py-3 fw-bold rounded shadow-sm">
                          Explore Jobs
                        </Link>
                        <Link href="/contact" className="btn btn-light px-4 py-3 fw-bold rounded text-dark">
                          Contact Us
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Navigation Dots */}
        <div className={styles.carouselDots}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${currentSlide === index ? styles.active : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
