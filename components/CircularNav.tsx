"use client";

import React, { useState, useRef, useEffect } from "react";
import { Menu, MessageSquare, History, Wallet } from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  angle: number;
}

const CircularNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [angle, setAngle] = useState(0);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const navItems: NavItem[] = [
    { icon: Wallet, label: "Assets", angle: 0 },
    { icon: MessageSquare, label: "AI Chat", angle: 45 },
    { icon: History, label: "History", angle: 90 },
  ];

  const getCoordinates = (angle: number, radius: number) => {
    const radian = angle * (Math.PI / 180);
    return {
      x: radius * Math.cos(radian),
      y: radius * Math.sin(radian),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      setIsDragging(true);
    }, 500);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If we were in long-press mode (isDragging), handle the selection and close
    if (isDragging) {
      if (selectedItem !== null) {
        console.log(`Selected via drag: ${navItems[selectedItem].label}`);
      }
      setIsDragging(false);
      setIsOpen(false);
      setSelectedItem(null);
      return;
    }

    // Handle regular click (non-drag mode)
    if (selectedItem !== null) {
      console.log(`Navigating to: ${navItems[selectedItem].label}`);
      setIsOpen(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    setAngle(angle);

    if (angle >= 0 && angle < 22.5) {
      setSelectedItem(0);
    } else if (angle >= 22.5 && angle < 67.5) {
      setSelectedItem(1);
    } else if (angle >= 67.5 && angle <= 90) {
      setSelectedItem(2);
    } else {
      setSelectedItem(null);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If we're in drag mode and mouse leaves, close the menu
    if (isDragging) {
      setIsDragging(false);
      setIsOpen(false);
      setSelectedItem(null);
    } else {
      setSelectedItem(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setIsOpen(false);
        setSelectedItem(null);
        if (selectedItem !== null) {
          console.log(`Selected via drag: ${navItems[selectedItem].label}`);
        }
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDragging, selectedItem]);
  const waveGroups = [
    {
      count: 1,
      size: "120",
      duration: "4",
      borderWidth: "1",
      className: "border-gray-50/50",
      baseDelay: 0.1,
      baseScale: 0.2,
    },
    {
      count: 1,
      size: "60",
      duration: "9",
      borderWidth: "2",
      className: "border-gray-50/50",
      baseDelay: 0.1,
      baseScale: 0.2,
    },
  ];

  return (
    <div className="absolute top-0 left-0 z-50 -mx-8 -my-11">
      {/* Background container - keeps background contained */}
      {/* <div className="relative z-10"> */}
      <div className="absolute inset-0">
        {/* Base gradient background */}
        <div className="absolute inset-0 opacity-90" />
      </div>
      {/* Separate container for waves - no overflow hidden */}
      {!isOpen && (
        <div className="absolute inset-0">
          {/* Subtle base glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100/10 blur-lg" />
          </div>

          {/* Waves */}
          <div className="absolute inset-0 flex items-center justify-center">
            {waveGroups.map((group, groupIndex) => (
              <React.Fragment key={`wave-group-${groupIndex}`}>
                {[...Array(group.count)].map((_, i) => (
                  <div
                    key={`wave-${groupIndex}-${i}`}
                    className={`absolute rounded-full ${group.className}`}
                    style={{
                      width: `${group.size}px`,
                      height: `${group.size}px`,
                      animation: `ping ${group.duration}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                      animationDelay: `${i * group.baseDelay}s`,
                      transform: `scale(${1 + i * group.baseScale})`,
                      borderWidth: `${group.borderWidth}px`,
                    }}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        className="relative w-40 h-40 flex items-center justify-center touch-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Enhanced Central Button */}
        <button
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 p-4 rounded-full 
          bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg 
          transition-all duration-300 group ${
            isOpen ? "scale-110" : "hover:scale-105"
          }
          border-2 border-blue-300/50 backdrop-blur-sm`}
        >
          <Menu
            size={24}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-pulse" />
        </button>

        {/* Navigation Items with enhanced effects */}
        {isOpen && (
          <div className="absolute inset-0 z-0">
            {navItems.map((item, index) => {
              const { x, y } = getCoordinates(item.angle, 100);
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`absolute left-1/2 top-1/2 transition-all duration-300 ${
                    selectedItem === index ? "scale-125" : "scale-100"
                  }`}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div
                    className={`p-4 rounded-full shadow-lg transition-all duration-300
                    ${
                      selectedItem === index
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white scale-110"
                        : "bg-white/10 text-blue-400 hover:bg-white/20"
                    }
                    backdrop-blur-md border-2 border-blue-300/50 group relative`}
                  >
                    <Icon
                      size={20}
                      className={`transition-transform duration-300 ${
                        selectedItem === index
                          ? "scale-110"
                          : "group-hover:scale-110"
                      }`}
                    />
                    {selectedItem === index && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-pulse" />
                        <div className="absolute -inset-2 rounded-full border-2 border-blue-400/30 animate-ping" />
                      </>
                    )}
                  </div>
                  <div className="relative">
                    <span
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 text-sm font-medium 
                      transition-all duration-300 whitespace-nowrap px-3 py-1 rounded-full
                      ${
                        selectedItem === index
                          ? "text-blue-300 bg-blue-900/70 backdrop-blur-sm border-blue-400/30"
                          : "text-blue-300/70"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularNav;
