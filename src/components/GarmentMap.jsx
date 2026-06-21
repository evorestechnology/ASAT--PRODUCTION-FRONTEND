import React, { useState } from 'react';

// Color theme matching the group colors
const COLORS = {
  front: { primary: '#1a73e8', bg: 'rgba(26, 115, 232, 0.05)', selected: 'rgba(26, 115, 232, 0.25)', stroke: '#1a73e8' },
  back: { primary: '#e65100', bg: 'rgba(230, 81, 0, 0.05)', selected: 'rgba(230, 81, 0, 0.25)', stroke: '#e65100' },
  pant: { primary: '#7b1fa2', bg: 'rgba(123, 31, 162, 0.05)', selected: 'rgba(123, 31, 162, 0.25)', stroke: '#7b1fa2' }
};

export default function GarmentMap({ groupId, placements = [], onToggle, hoveredId, setHoveredId }) {
  const [tooltip, setTooltip] = useState(null);
  const theme = COLORS[groupId] || COLORS.front;

  const handleMouseEnter = (id, label, e) => {
    setHoveredId(id);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    setTooltip(null);
  };

  // Helper to render zone overlays
  const renderZone = (id, label, props) => {
    const isSelected = placements.includes(id);
    const isHovered = hoveredId === id;

    const commonProps = {
      ...props,
      style: {
        cursor: 'pointer',
        transition: 'all 0.15s ease-in-out',
        fill: isSelected ? theme.selected : isHovered ? 'rgba(0,0,0,0.05)' : 'transparent',
        stroke: isSelected ? theme.stroke : isHovered ? theme.stroke : '#94a3b8',
        strokeWidth: isSelected ? 2 : isHovered ? 1.5 : 1,
        strokeDasharray: isSelected ? 'none' : '3,3'
      },
      onClick: () => onToggle(id),
      onMouseEnter: (e) => handleMouseEnter(id, label, e),
      onMouseLeave: handleMouseLeave
    };

    if (props.d) {
      return <path key={id} {...commonProps} />;
    }
    return <rect key={id} {...commonProps} />;
  };

  // 1. T-SHIRT FRONT MAP
  const renderFrontMap = () => {
    return (
      <svg viewBox="0 0 200 240" className="garment-svg" style={svgStyle}>
        {/* T-Shirt Base Body */}
        <path 
          d="M 70 20 C 85 32, 115 32, 130 20 L 165 35 L 190 70 L 170 85 L 155 75 L 155 220 L 45 220 L 45 75 L 30 85 L 10 70 L 35 35 Z" 
          fill="#f1f5f9" 
          stroke="#cbd5e1" 
          strokeWidth="2" 
        />
        {/* Collar Line */}
        <path d="M 70 20 C 85 30, 115 30, 130 20" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
        
        {/* Overlapping placement zones ordered from largest to smallest for clickability */}
        {renderZone('front_16x20', 'Front 16×20 (Max)', { x: 55, y: 55, width: 90, height: 135, rx: 4 })}
        {renderZone('front_14x16', 'Front 14×16', { x: 60, y: 65, width: 80, height: 110, rx: 4 })}
        {renderZone('front_a3', 'Front A3', { x: 65, y: 70, width: 70, height: 95, rx: 3 })}
        {renderZone('front_a4', 'Front A4', { x: 75, y: 80, width: 50, height: 70, rx: 3 })}
        {renderZone('front_a6', 'Front A6', { x: 88, y: 60, width: 24, height: 32, rx: 2 })}
        {renderZone('front_pocket_logo', 'Front Pocket Logo', { x: 60, y: 60, width: 22, height: 22, rx: 2 })}
      </svg>
    );
  };

  // 2. T-SHIRT BACK MAP
  const renderBackMap = () => {
    return (
      <svg viewBox="0 0 200 240" className="garment-svg" style={svgStyle}>
        {/* T-Shirt Base Body */}
        <path 
          d="M 70 20 C 85 24, 115 24, 130 20 L 165 35 L 190 70 L 170 85 L 155 75 L 155 220 L 45 220 L 45 75 L 30 85 L 10 70 L 35 35 Z" 
          fill="#f1f5f9" 
          stroke="#cbd5e1" 
          strokeWidth="2" 
        />
        {/* Shoulder Overlays (Left / Right from viewer's perspective) */}
        {renderZone('left_front_shoulder', 'Left Front Shoulder', { d: 'M 35 35 L 55 42 L 45 57 L 25 50 Z' })}
        {renderZone('left_back_shoulder', 'Left Back Shoulder', { d: 'M 25 50 L 45 57 L 35 72 L 15 65 Z' })}
        {renderZone('right_front_shoulder', 'Right Front Shoulder', { d: 'M 165 35 L 145 42 L 155 57 L 175 50 Z' })}
        {renderZone('right_back_shoulder', 'Right Back Shoulder', { d: 'M 175 50 L 155 57 L 165 72 L 185 65 Z' })}

        {/* Back print overlays from largest to smallest */}
        {renderZone('back_16x20', 'Back 16×20 (Max)', { x: 55, y: 70, width: 90, height: 135, rx: 4 })}
        {renderZone('back_14x16', 'Back 14×16', { x: 60, y: 78, width: 80, height: 110, rx: 4 })}
        {renderZone('back_a3', 'Back A3', { x: 65, y: 82, width: 70, height: 95, rx: 3 })}
        {renderZone('back_a4', 'Back A4', { x: 75, y: 90, width: 50, height: 70, rx: 3 })}
        {renderZone('back_a6', 'Back A6', { x: 88, y: 72, width: 24, height: 32, rx: 2 })}
        {renderZone('back_neck', 'Back Neck', { x: 85, y: 30, width: 30, height: 18, rx: 2 })}
        {renderZone('neck_logo', 'Neck Logo', { x: 90, y: 52, width: 20, height: 14, rx: 2 })}
      </svg>
    );
  };

  // 3. PANTS MAP
  const renderPantMap = () => {
    return (
      <svg viewBox="0 0 200 240" className="garment-svg" style={svgStyle}>
        {/* Pants Base Outline */}
        <path 
          d="M 60 20 L 140 20 L 145 60 L 135 220 L 105 220 L 100 100 L 95 220 L 65 220 L 55 60 Z" 
          fill="#f1f5f9" 
          stroke="#cbd5e1" 
          strokeWidth="2" 
        />
        {/* Waistband line */}
        <line x1="60" y1="28" x2="140" y2="28" stroke="#cbd5e1" strokeWidth="1.5" />

        {/* Left leg zones (viewer's left) */}
        {renderZone('left_front_full', 'Left Leg Full Print', { x: 60, y: 35, width: 32, height: 180, rx: 4 })}
        {renderZone('left_front_upper', 'Left Front Upper', { x: 62, y: 38, width: 28, height: 50, rx: 3 })}
        {renderZone('left_back_upper', 'Left Back Upper', { x: 62, y: 38, width: 28, height: 50, rx: 3 })}
        {renderZone('left_front_bottom', 'Left Front Bottom', { x: 67, y: 95, width: 24, height: 60, rx: 3 })}
        {renderZone('left_back_bottom', 'Left Back Bottom', { x: 67, y: 95, width: 24, height: 60, rx: 3 })}
        {renderZone('left_front_lower', 'Left Front Lower', { x: 68, y: 160, width: 22, height: 50, rx: 2 })}
        {renderZone('left_back_lower', 'Left Back Lower', { x: 68, y: 160, width: 22, height: 50, rx: 2 })}

        {/* Right leg zones (viewer's right) */}
        {renderZone('right_front_full', 'Right Leg Full Print', { x: 108, y: 35, width: 32, height: 180, rx: 4 })}
        {renderZone('right_front_upper', 'Right Front Upper', { x: 110, y: 38, width: 28, height: 50, rx: 3 })}
        {renderZone('right_back_upper', 'Right Back Upper', { x: 110, y: 38, width: 28, height: 50, rx: 3 })}
        {renderZone('right_front_bottom', 'Right Front Bottom', { x: 109, y: 95, width: 24, height: 60, rx: 3 })}
        {renderZone('right_back_bottom', 'Right Back Bottom', { x: 109, y: 95, width: 24, height: 60, rx: 3 })}
        {renderZone('left_back_lower', 'Right Back Lower', { x: 110, y: 160, width: 22, height: 50, rx: 2 })}
      </svg>
    );
  };

  return (
    <div style={containerStyle}>
      {groupId === 'front' && renderFrontMap()}
      {groupId === 'back' && renderBackMap()}
      {groupId === 'pant' && renderPantMap()}

      {/* Floating map tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y,
          left: tooltip.x,
          transform: 'translate(-50%, -100%)',
          background: 'var(--admin-dark, #1e1e24)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.62rem',
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 600,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          whiteSpace: 'nowrap',
          zIndex: 10000
        }}>
          {tooltip.label}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translate(-50%, 100%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--admin-dark, #1e1e24)'
          }} />
        </div>
      )}
    </div>
  );
}

// Styling definitions
const containerStyle = {
  position: 'relative',
  background: '#fafafa',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  maxWidth: '240px',
  height: '240px',
  boxSizing: 'border-box'
};

const svgStyle = {
  width: '100%',
  height: '100%',
  maxHeight: '220px'
};
