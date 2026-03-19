import React from 'react';

// Common style variables (ensure these are set in your global CSS)
const strokeColor = 'var(--color-text-primary, currentColor)';
const bgColor = 'var(--color-background-primary, transparent)';
const strokeWidth = 1.8;

// Entities
export const StrongEntity = ({ x, y, width, height, name }: any) => (
  <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
    <rect width={width} height={height} rx="2" stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={width / 2} y={height / 2} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
  </g>
);

export const WeakEntity = ({ x, y, width, height, name }: any) => (
  <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
    <rect width={width} height={height} rx="2" stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <rect x={5} y={5} width={width - 10} height={height - 10} rx="2" stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={width / 2} y={height / 2} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
  </g>
);

// Relationships
export const Relationship = ({ x, y, width, height, name }: any) => {
  const points = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
  return (
    <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
      <polygon points={points} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
      <text x={width / 2} y={height / 2} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
    </g>
  );
};

export const IdentifyingRelationship = ({ x, y, width, height, name }: any) => {
  const pOuter = `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}`;
  
  // Calculate inset points using a basic ratio approximation
  const iX = 6; 
  const iY = 6;
  const inPts = `${width / 2},${iY} ${width - iX},${height / 2} ${width / 2},${height - iY} ${iX},${height / 2}`;
  
  return (
    <g transform={`translate(${x - width / 2}, ${y - height / 2})`}>
      <polygon points={pOuter} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
      <polygon points={inPts} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
      <text x={width / 2} y={height / 2} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
    </g>
  );
};

// Attributes
export const SimpleAttribute = ({ cx, cy, rx, ry, name }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
  </g>
);

export const KeyAttribute = ({ cx, cy, rx, ry, name }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" textDecoration="underline" fill={strokeColor}>{name}</text>
  </g>
);

export const PartialKeyAttribute = ({ cx, cy, rx, ry, name }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" style={{ textDecoration: 'underline dashed' }} fill={strokeColor}>{name}</text>
  </g>
);

export const DerivedAttribute = ({ cx, cy, rx, ry, name }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="6,3" fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
  </g>
);

export const MultivaluedAttribute = ({ cx, cy, rx, ry, name }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <ellipse cx={cx} cy={cy} rx={rx * 0.75} ry={ry * 0.75} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
  </g>
);

export const CompositeAttribute = ({ cx, cy, rx, ry, name, children }: any) => (
  <g>
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={strokeColor} strokeWidth={strokeWidth} fill={bgColor} />
    <text x={cx} y={cy} dominantBaseline="middle" textAnchor="middle" fill={strokeColor}>{name}</text>
    {/* Connections to children are handled globally in the main layout drawing phase, but child shapes themselves must be plotted at their coordinates. */}
  </g>
);

// Lines and labels
export const ConnectionLine = ({ x1, y1, x2, y2, isDouble }: any) => {
  if (isDouble) {
    // Vector math to create parallel lines
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    
    // Normal unit vector
    const nx = -dy / len;
    const ny = dx / len;
    
    const offset = 2; // half of 4px apart
    
    return (
      <g stroke={strokeColor} strokeWidth={strokeWidth}>
        <line x1={x1 + nx * offset} y1={y1 + ny * offset} x2={x2 + nx * offset} y2={y2 + ny * offset} />
        <line x1={x1 - nx * offset} y1={y1 - ny * offset} x2={x2 - nx * offset} y2={y2 - ny * offset} />
      </g>
    );
  }
  
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={strokeColor} strokeWidth={strokeWidth} />;
};

export const CardinalityLabel = ({ x1, y1, x2, y2, label }: any) => {
  // Find midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  
  // Normal vector
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny = dx / len;
  
  // Position text offset 12px perpendicularly
  const tx = mx + nx * -12;
  const ty = my + ny * -12;
  
  return (
    <text x={tx} y={ty} dominantBaseline="middle" textAnchor="middle" fill={strokeColor} fontSize="12" fontWeight="bold">
      {label}
    </text>
  );
};
