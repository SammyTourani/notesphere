// src/context/FontContext.jsx
import React from "react";
import { createContext, useContext, useEffect, useState } from 'react';

const FontContext = createContext();

export const FontProvider = ({ children }) => {
  // Font Family options: 'inter', 'roboto', 'merriweather', 'mono'
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('fontFamily') || 'inter';
  });
  
  // Font Size options: 'small', 'medium', 'large', 'xlarge'
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  
  // Line Height options: 'compact', 'normal', 'relaxed'
  const [lineHeight, setLineHeight] = useState(() => {
    return localStorage.getItem('lineHeight') || 'normal';
  });
  
  // Apply font settings to document
  useEffect(() => {
    // Save preferences to localStorage
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('fontSize', fontSize);
    localStorage.setItem('lineHeight', lineHeight);
    
    // Apply font family
    const fontFamilyMap = {
      'inter': 'var(--font-inter)',
      'roboto': 'var(--font-roboto)',
      'merriweather': 'var(--font-merriweather)',
      'mono': 'var(--font-mono)'
    };
    
    document.documentElement.style.setProperty(
      '--font-family-current', 
      fontFamilyMap[fontFamily] || fontFamilyMap['inter']
    );
    
    // Apply font size
    const fontSizeMap = {
      'small': 'var(--font-size-small)',
      'medium': 'var(--font-size-medium)',
      'large': 'var(--font-size-large)',
      'xlarge': 'var(--font-size-xlarge)'
    };
    
    document.documentElement.style.setProperty(
      '--font-size-current', 
      fontSizeMap[fontSize] || fontSizeMap['medium']
    );
    
    // Apply line height
    const lineHeightMap = {
      'compact': 'var(--line-height-compact)',
      'normal': 'var(--line-height-normal)',
      'relaxed': 'var(--line-height-relaxed)'
    };
    
    document.documentElement.style.setProperty(
      '--line-height-current', 
      lineHeightMap[lineHeight] || lineHeightMap['normal']
    );
    
  }, [fontFamily, fontSize, lineHeight]);
  
  return (
    <FontContext.Provider value={{ 
      fontFamily, 
      fontSize, 
      lineHeight,
      setFontFamily,
      setFontSize,
      setLineHeight
    }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => useContext(FontContext);