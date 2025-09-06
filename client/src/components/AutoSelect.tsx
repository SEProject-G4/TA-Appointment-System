import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

export interface Option {
  id: number | string;
  label: number | string;
}

interface AutoSelectProps {
  options: Option[];
  placeholder?: string;
  className?: string;
  selectedOption: Option | null;
  onSelect: (value: Option | null) => void;
}

const AutoSelect: React.FC<AutoSelectProps> = ({
  options,
  placeholder = "Select or type",
  className,
  selectedOption,
  onSelect,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter options by query
  const filteredOptions =
    query === ""
      ? options
      : options.filter((option) =>
          option.label.toString().toLowerCase().includes(query.toLowerCase())
        );

  // Handle click outside to close dropdown
  // (blur event is unreliable for custom dropdowns)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveOptionIndex(0);
  }, [filteredOptions]);

  // Show query in input, or selected label if not typing
  const inputValue = isOpen
    ? query
    : selectedOption
    ? selectedOption.label.toString()
    : "";

  return (
    <div className={`w-52 ${className}`} ref={containerRef}>
      <div className="relative mt-1">
        <input
          ref={inputRef}
          type="text"
          className="w-full py-1 px-2 rounded-md outline outline-1 outline-text-secondary focus:outline-primary-light focus:outline-offset-1 focus:outline-2 bg-white"
          value={inputValue}
          onChange={() => {
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setActiveOptionIndex(0);
          }}
          onClick={() => {
            setIsOpen(true);
            setActiveOptionIndex(0);
          }}
          onBlur={(e) => {
            // Only close if focus moves outside the container
            if (!containerRef.current?.contains(e.relatedTarget)) {
              setIsOpen(false);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveOptionIndex((prev) =>
                Math.min(prev + 1, filteredOptions.length - 1)
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveOptionIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (isOpen) {
                if (filteredOptions[activeOptionIndex]) {
                  onSelect(filteredOptions[activeOptionIndex]);
                  setQuery("");
                  setIsOpen(false);
                }
              } else {
                setIsOpen(true);
                setActiveOptionIndex(0);
              }
            } else if (e.key.match(/^[a-zA-Z0-9]$/)) {
              setQuery((prev) => prev + e.key);
            } else if (e.key === "Backspace") {
              setQuery((prev) => prev.slice(0, -1));
            } else if (e.key === "Escape") {
              setIsOpen(false);
              setActiveOptionIndex(-1);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isOpen && (
          <div
            className="absolute mt-1 max-h-60 min-w-full w-fit overflow-auto rounded-md bg-bg-card py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50"
            id="autoselect-options-container"
            tabIndex={-1}
          >
            {filteredOptions.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-text-secondary">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`relative cursor-pointer select-none py-2 w-full px-5  
                    ${
                      activeOptionIndex === index
                        ? "bg-primary-dark/70 text-text-inverted"
                        : selectedOption?.id === option.id
                        ? "bg-primary-dark/20 text-text-primary"
                        : "bg-bg-card/80 text-text-primary"
                    } `}
                  onMouseOver={() => setActiveOptionIndex(index)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(option);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  ref={
                    activeOptionIndex === index
                      ? (el) => {
                          if (el) {
                            el.scrollIntoView({ block: "nearest" });
                          }
                        }
                      : undefined
                  }
                >
                  <span className="block truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoSelect;
