"use client";

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TableOfContents({ selector = ".post-content" }: { selector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Wait a brief moment for the HTML content to render in the DOM
    const timer = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll(`${selector} h2, ${selector} h3`));
      
      const parsedHeadings: Heading[] = elements.map((elem, idx) => {
        let id = elem.id;
        if (!id) {
          id = `heading-${idx}-${elem.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          elem.id = id;
        }
        return {
          id,
          text: elem.textContent || "",
          level: Number(elem.tagName.substring(1))
        };
      });

      setHeadings(parsedHeadings);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: "-20% 0% -60% 0%" }
      );

      elements.forEach((elem) => observer.observe(elem));

      return () => observer.disconnect();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selector]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="sticky-top" style={{ top: '100px', zIndex: 10 }}>
      <div className="p-4 rounded-4" style={{ backgroundColor: '#F9F7F1', border: 'none' }}>
        <h5 className="mb-4 text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '1.5px', color: '#7a766c' }}>
          In This Article
        </h5>
        <ul className="list-unstyled mb-0">
          {headings.map((h) => (
            <li 
              key={h.id} 
              className="mb-2" 
              style={{ paddingLeft: h.level === 3 ? '15px' : '0' }}
            >
              <a
                href={`#${h.id}`}
                className={`text-decoration-none d-block py-1 ${activeId === h.id ? 'fw-bold' : 'fw-medium'}`}
                style={{ 
                  color: activeId === h.id ? '#2E4A3D' : '#5c5a53',
                  fontSize: h.level === 3 ? '0.85rem' : '0.95rem',
                  lineHeight: '1.4',
                  transition: 'color 0.2s'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                  setActiveId(h.id);
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
