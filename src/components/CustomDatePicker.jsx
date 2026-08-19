import React, { useState, useRef, useEffect } from 'react';

export default function CustomDatePicker({ value, onChange, placeholder = 'Select Date of Birth' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
      }
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const years = [];
  const currentYear = new Date().getFullYear();
  // Provide selection from 100 years ago to current year
  for (let y = currentYear - 100; y <= currentYear; y++) {
    years.push(y);
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const handleYearChange = (e) => {
    const y = parseInt(e.target.value);
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setFullYear(y);
      return d;
    });
  };

  const handleMonthChange = (e) => {
    const m = parseInt(e.target.value);
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(m);
      return d;
    });
  };

  const handleDateSelect = (day) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const offset = selected.getTimezoneOffset();
    const localDate = new Date(selected.getTime() - (offset * 60 * 1000));
    const formatted = localDate.toISOString().split('T')[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const formatDateDisplay = (val) => {
    if (!val) return placeholder;
    const parts = val.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY
    }
    return val;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const startDay = startDayOfMonth(year, month);

  const daysGrid = [];
  for (let i = 0; i < startDay; i++) {
    daysGrid.push(null);
  }
  for (let i = 1; i <= numDays; i++) {
    daysGrid.push(i);
  }

  // Determine if a cell date is the selected date
  const isSelectedDate = (day) => {
    if (!value) return false;
    const valDate = new Date(value);
    return valDate.getDate() === day && valDate.getMonth() === month && valDate.getFullYear() === year;
  };

  return (
    <div ref={containerRef} className="custom-datepicker" style={{ position: 'relative', width: '100%' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 18px',
          border: '1px solid #E5E5E5',
          borderRadius: '12px',
          background: '#FAFAF8',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          fontSize: '0.9rem',
          color: value ? '#000000' : '#999999',
          boxSizing: 'border-box',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span>{formatDateDisplay(value)}</span>
        <i className="far fa-calendar-alt" style={{ color: '#888', fontSize: '1.1rem' }}></i>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 9999,
          marginTop: '6px',
          width: '320px',
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          padding: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button 
              type="button" 
              onClick={handlePrevMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#111', padding: '4px 8px' }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select 
                value={month} 
                onChange={handleMonthChange}
                style={{
                  border: '1px solid #E5E5E5',
                  outline: 'none',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px 24px 4px 8px',
                  borderRadius: '6px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '8px 10px'
                }}
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>
              <select 
                value={year} 
                onChange={handleYearChange}
                style={{
                  border: '1px solid #E5E5E5',
                  outline: 'none',
                  fontWeight: '600',
                  fontSize: '0.82rem',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px 24px 4px 8px',
                  borderRadius: '6px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 5'%3E%3Cpath fill='%23666' d='M2 0L0 2h4zm0 5L0 3h4z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '8px 10px'
                }}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#111', padding: '4px 8px' }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {/* Weekday header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(w => (
              <span key={w} style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#888' }}>{w}</span>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {daysGrid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const selected = isSelectedDate(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  style={{
                    padding: '8px 0',
                    border: 'none',
                    borderRadius: '8px',
                    background: selected ? '#000000' : 'transparent',
                    color: selected ? '#FFFFFF' : '#111111',
                    fontSize: '0.8rem',
                    fontWeight: selected ? 'bold' : 'normal',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
