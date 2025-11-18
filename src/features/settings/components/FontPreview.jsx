// src/components/FontPreview.jsx
import React from 'react';

const FontPreview = ({ fontFamily, fontSize = 'medium', lineHeight = 'normal', className = '' }) => {
  // Map font options to CSS classes
  const fontFamilyClass = `font-${fontFamily}`;
  const fontSizeClass = `text-size-${fontSize}`;
  const lineHeightClass = `leading-${lineHeight}`;
  
  return (
    <div className={`p-3 rounded-lg bg-white dark:bg-gray-700 ${fontFamilyClass} ${fontSizeClass} ${lineHeightClass} ${className}`}>
      <p className="text-gray-800 dark:text-gray-200">
        The quick brown fox jumps over the lazy dog.
      </p>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </p>
    </div>
  );
};

export default FontPreview;