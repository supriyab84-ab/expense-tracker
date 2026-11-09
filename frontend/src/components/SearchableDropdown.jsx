import { useState, useRef, useEffect } from "react";
import "./SearchableDropdown.css";

function SearchableDropdown({
  options = [],
  value = "",
  onChange,
  placeholder = "Select or search...",
  disabled = false,
  ariaLabel = "Searchable dropdown"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Elevate parent stacking contexts when dropdown is opened so it floats above cards below
  useEffect(() => {
    if (!dropdownRef.current) return;
    const formGroup = dropdownRef.current.closest(".form-group");
    const card = dropdownRef.current.closest(".dashboard-card") || dropdownRef.current.closest("form");

    if (isOpen) {
      if (formGroup) {
        formGroup.style.zIndex = "1001";
        formGroup.style.position = "relative";
      }
      if (card) {
        card.style.zIndex = "1000";
        card.style.position = "relative";
      }
    } else {
      if (formGroup) {
        formGroup.style.zIndex = "";
        formGroup.style.position = "";
      }
      if (card) {
        card.style.zIndex = "";
        card.style.position = "";
      }
    }

    return () => {
      if (formGroup) {
        formGroup.style.zIndex = "";
        formGroup.style.position = "";
      }
      if (card) {
        card.style.zIndex = "";
        card.style.position = "";
      }
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape key
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option);
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  return (
    <div
      className={`searchable-dropdown ${isOpen ? "is-open" : ""} ${disabled ? "disabled" : ""}`}
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`searchable-dropdown-trigger ${isOpen ? "open" : ""}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
      >
        <span className={`searchable-dropdown-value ${!value ? "placeholder" : ""}`}>
          {value || placeholder}
        </span>
        <span className="searchable-dropdown-arrow">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {isOpen && (
        <div className="searchable-dropdown-menu">
          <div className="searchable-dropdown-search">
            <div className="searchable-input-wrapper">
              <span className="search-icon"></span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchTerm("");
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="searchable-dropdown-options" role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt === value;
                return (
                  <div
                    key={opt}
                    className={`searchable-dropdown-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span>{opt}</span>
                    {isSelected && <span className="check-icon">✓</span>}
                  </div>
                );
              })
            ) : (
              <div className="searchable-dropdown-empty">
                No matching titles found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableDropdown;
