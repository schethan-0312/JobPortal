"use client";

import { useState, useEffect, useRef } from "react";
import { searchIndianCities, IndianCity } from "@/lib/indianCities";

interface CityLocationInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultValue?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  indianOnly?: boolean;
  openDirection?: "up" | "down" | "auto";
}

export default function CityLocationInput({
  value,
  onChange,
  defaultValue = "",
  name = "location",
  placeholder = "e.g. Bangalore, Mumbai, Remote",
  className = "form-control rounded-3 py-2",
  indianOnly = true,
  openDirection = "auto",
}: CityLocationInputProps) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(defaultValue);
  const currentQuery = isControlled ? (value ?? "") : internalQuery;

  const [suggestions, setSuggestions] = useState<IndianCity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dropUp, setDropUp] = useState(openDirection === "up");

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isControlled) {
      setInternalQuery(defaultValue);
    }
  }, [defaultValue, isControlled]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (openDirection === "up") {
        setDropUp(true);
      } else if (openDirection === "down") {
        setDropUp(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropUp(spaceBelow < 290 && rect.top > 200);
      }
    }
  }, [isOpen, openDirection]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search Indian cities with exact alphabetical ordering
  const fetchCitySuggestions = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();

    // Instant local prefix search sorted alphabetically (A-Z)
    const localMatches = searchIndianCities(trimmed);
    setSuggestions(localMatches);

    // If query is short (< 2 chars), local database provides full A-Z alphabetical list
    if (trimmed.length < 2) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const countryFilter = indianOnly ? "&countrycodes=in" : "";
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}${countryFilter}&featuretype=city&limit=10&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const apiResults: IndianCity[] = data
          .filter((item: any) => !indianOnly || item.address?.country_code === "in" || item.address?.country === "India")
          .map((item: any) => {
            const addr = item.address || {};
            const cityName =
              addr.city || addr.town || addr.municipality || addr.village || addr.suburb || item.name;
            const stateName = addr.state || addr.region || "";
            const countryName = addr.country || "India";

            return {
              city: cityName,
              state: stateName,
              country: countryName,
              displayName: stateName ? `${cityName}, ${stateName}` : cityName,
            };
          });

        // Combine local Indian database + API results, remove duplicates
        const combined = [...localMatches, ...apiResults];
        const unique = combined.filter(
          (v, i, a) => a.findIndex((t) => t.city.toLowerCase() === v.city.toLowerCase()) === i
        );

        // Sort in strict alphabetical order with prefix matches first
        const prefixTerm = trimmed.toLowerCase();
        const prefixList = unique
          .filter((c) => c.city.toLowerCase().startsWith(prefixTerm) || c.displayName.toLowerCase().startsWith(prefixTerm))
          .sort((a, b) => a.city.localeCompare(b.city));

        const nonPrefixList = unique
          .filter((c) => !c.city.toLowerCase().startsWith(prefixTerm) && !c.displayName.toLowerCase().startsWith(prefixTerm))
          .sort((a, b) => a.city.localeCompare(b.city));

        setSuggestions([...prefixList, ...nonPrefixList].slice(0, 30));
      }
    } catch {
      // Fallback stays with localMatches which are already alphabetically sorted
      setSuggestions(localMatches);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isControlled) {
      onChange?.(val);
    } else {
      setInternalQuery(val);
    }
    setIsOpen(true);
    setActiveIndex(-1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCitySuggestions(val);
    }, 300);
  };

  const handleSelectCity = (item: IndianCity) => {
    const selectedVal = item.displayName || item.city;
    if (isControlled) {
      onChange?.(selectedVal);
    } else {
      setInternalQuery(selectedVal);
    }
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    setIsOpen(true);
    if (suggestions.length === 0) {
      fetchCitySuggestions(currentQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
      e.preventDefault();
      handleSelectCity(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const clearInput = () => {
    if (isControlled) {
      onChange?.("");
    } else {
      setInternalQuery("");
    }
    setSuggestions(searchIndianCities(""));
  };

  return (
    <div
      className="position-relative"
      ref={containerRef}
      style={{ zIndex: isOpen ? 9999 : 1 }}
    >
      <div className="position-relative">
        <input
          type="text"
          name={name}
          className={className}
          placeholder={placeholder}
          value={currentQuery}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        {currentQuery && (
          <button
            type="button"
            className="btn btn-sm position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-0 border-0 bg-transparent"
            onClick={clearInput}
            title="Clear location"
            style={{ zIndex: 5, width: "20px", height: "20px" }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* City Autocomplete Dropdown */}
      {isOpen && (
        <div
          className={`position-absolute start-0 end-0 bg-white border rounded-3 shadow-lg p-2 ${
            dropUp ? "mb-1" : "mt-1"
          }`}
          style={{
            zIndex: 99999,
            maxHeight: "260px",
            overflowY: "auto",
            ...(dropUp
              ? {
                  bottom: "calc(100% + 4px)",
                  top: "auto",
                  boxShadow: "0 -12px 30px -5px rgba(0, 0, 0, 0.22), 0 -6px 12px -6px rgba(0, 0, 0, 0.15)",
                }
              : {
                  top: "calc(100% + 4px)",
                  bottom: "auto",
                  boxShadow: "0 14px 35px -5px rgba(0, 0, 0, 0.22), 0 8px 15px -6px rgba(0, 0, 0, 0.15)",
                }),
          }}
        >
          <div className="d-flex align-items-center justify-content-between px-2 py-1 mb-1 border-bottom">
            <span className="text-muted small fw-semibold" style={{ fontSize: "11px" }}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" style={{ width: "10px", height: "10px" }} role="status"></span>
                  Searching cities API...
                </>
              ) : currentQuery.trim().length > 0 ? (
                `Indian Cities for "${currentQuery.trim()}" (A-Z)`
              ) : (
                "Popular Indian Cities (A-Z)"
              )}
            </span>
            <span className="badge bg-light-main text-main border small" style={{ fontSize: "10px" }}>
              Indian Cities A-Z
            </span>
          </div>

          {suggestions.length === 0 && !isLoading ? (
            <div className="p-3 text-center text-muted small">
              <i className="fa-solid fa-location-dot mb-1 d-block text-secondary opacity-50 fs-5"></i>
              No Indian cities matching &quot;{currentQuery}&quot;. You can still type custom location.
            </div>
          ) : (
            <ul className="list-unstyled mb-0">
              {suggestions.map((item, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className={`dropdown-item d-flex align-items-center gap-2.5 px-2.5 py-2 rounded-2 text-start w-100 border-0 ${
                      activeIndex === idx ? "bg-light text-main fw-semibold" : "bg-white text-dark"
                    }`}
                    style={{ cursor: "pointer", transition: "background-color 0.15s ease" }}
                    onClick={() => handleSelectCity(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div
                      className="rounded-circle bg-light-main text-main d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: "28px", height: "28px" }}
                    >
                      <i className="fa-solid fa-location-dot fs-8"></i>
                    </div>
                    <div className="text-truncate flex-grow-1">
                      <div className="fw-medium text-dark small text-truncate">{item.city}</div>
                      {item.state && (
                        <div className="text-muted text-truncate" style={{ fontSize: "11px" }}>
                          {item.state}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
