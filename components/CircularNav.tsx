"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, History, Wallet } from "lucide-react";
import { useStore, NavItem } from "@/store/store";
import Image from "next/image";

interface NavItemAngs {
  icon: React.ElementType;
  label: string;
  angle: number;
}

const CircularNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tempSelectedItem, setTempSelectedItem] = useState<NavItem | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const { selectedNavItem, setSelectedNavItem, reset } = useStore();

  const navItems: NavItemAngs[] = [
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

  const handleMouseMove = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!isDragging) return;

    const viewportX = "clientX" in e ? e.clientX : (e as MouseEvent).clientX;
    const viewportY = "clientY" in e ? e.clientY : (e as MouseEvent).clientY;

    const menuRect = containerRef.current?.getBoundingClientRect();
    if (!menuRect) return;

    const centerX = menuRect.left + menuRect.width / 2;
    const centerY = menuRect.top + menuRect.height / 2;

    const deltaX = viewportX - centerX;
    const deltaY = viewportY - centerY;

    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (angle >= 0 && angle < 22.5) {
      setTempSelectedItem(NavItem.Assets);
    } else if (angle >= 22.5 && angle < 67.5) {
      setTempSelectedItem(NavItem.AIChat);
    } else if (angle >= 67.5 && angle <= 90) {
      setTempSelectedItem(NavItem.History);
    } else {
      setTempSelectedItem(null);
    }
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
      setIsDragging(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (isDragging) {
      setIsDragging(false);
      if (tempSelectedItem !== null) {
        setSelectedNavItem(tempSelectedItem); // Update actual selection on mouse up
        setIsOpen(false);
      }
    } else if (selectedNavItem !== null) {
      setIsOpen(false);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isDragging) {
      reset();
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (tempSelectedItem !== null) {
          setSelectedNavItem(tempSelectedItem); // Update actual selection on global mouse up
          setIsOpen(false);
        }
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isDragging, tempSelectedItem, setSelectedNavItem, handleMouseMove]);

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
        onMouseLeave={handleMouseLeave}
      >
        {/* Enhanced Central Button */}
        <button
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full 
          bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg w-14 h-14
          transition-all duration-300 group ${
            isOpen ? "scale-110" : "hover:scale-105"
          }
          border-2 border-blue-300/50 backdrop-blur-sm`}
        >
          <Image
            src="/echo.png"
            alt="Echo Logo"
            width={56}
            height={56}
            className={`${
              selectedNavItem === null || selectedNavItem === NavItem.AIChat
                ? "rotate-0"
                : "rotate-180"
            } group-hover:rotate-180 transition-transform duration-300 object-cover w-full h-full`}
          />
          <div className="absolute inset-0 rounded-full bg-blue-400/30 animate-pulse" />
        </button>

        {/* Navigation Items with enhanced effects */}
        {isOpen && (
          <div className="absolute inset-0 z-0">
            {navItems.map((item) => {
              const { x, y } = getCoordinates(item.angle, 100);
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className={`absolute left-1/2 top-1/2 transition-all duration-300 ${
                    tempSelectedItem === item.label ? "scale-125" : "scale-100"
                  }`}
                  style={{
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                >
                  <div
                    className={`p-4 rounded-full shadow-lg transition-all duration-300
                    ${
                      tempSelectedItem === item.label
                        ? "bg-gradient-to-r from-blue-600 to-blue-400 text-white scale-110"
                        : "bg-white/10 text-blue-400 hover:bg-white/20"
                    }
                    backdrop-blur-md border-2 border-blue-300/50 group relative`}
                  >
                    <Icon
                      size={14}
                      className={`transition-transform duration-300 ${
                        tempSelectedItem === item.label
                          ? "scale-110"
                          : "group-hover:scale-110"
                      }`}
                    />
                    {tempSelectedItem === item.label && (
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
                        tempSelectedItem === item.label
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
