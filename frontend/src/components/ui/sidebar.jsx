"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

/* ===================== CONTEXT ===================== */

// Simple Context
const SidebarContext = createContext({
  open: false,
  setOpen: () => {},
  isMobile: false
});

export const useSidebar = () => useContext(SidebarContext);

export const Sidebar = ({ children, open, setOpen, animate }) => {
  // We can ignore 'animate' prop and just use CSS transitions
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

/* ===================== BODY ===================== */

export const SidebarBody = ({ className, children, ...props }) => {
  return (
    <>
      <DesktopSidebar className={className} {...props}>{children}</DesktopSidebar>
      <MobileSidebar className={className} {...props}>{children}</MobileSidebar>
    </>
  );
};

/* ===================== DESKTOP ===================== */

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();
  
  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-full bg-slate-900/80 backdrop-blur-xl border-r border-white/10 transition-all duration-300 ease-in-out shrink-0",
        open ? "w-[300px]" : "w-[70px]",
        className
      )}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      <div className="flex flex-col h-full p-4 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

/* ===================== MOBILE ===================== */

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  return (
    <div className="md:hidden flex flex-col w-full">
      {/* Mobile Header */}
      <div className="h-14 px-4 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="text-white font-bold text-lg">ProPDF</div>
        <button onClick={() => setOpen(true)} className="text-white p-1">
          <IconMenu2 className="h-7 w-7" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="absolute top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out animate-in slide-in-from-left">
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button 
                onClick={() => setOpen(false)}
                className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"
              >
                <IconX className="h-6 w-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 text-white">
               {/* Force open state for children in mobile drawer */}
               <SidebarContext.Provider value={{ open: true, setOpen }}>
                 {children}
               </SidebarContext.Provider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ===================== LINKS ===================== */

export const SidebarLink = ({ link, className, onClick, ...props }) => {
  const { open } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200 group w-full",
        "hover:bg-white/5 text-slate-300 hover:text-white",
        open ? "justify-start" : "justify-center",
        className
      )}
      title={!open ? link.label : undefined}
      {...props}
    >
      <span className="shrink-0">
        {link.icon}
      </span>

      <span
        className={cn(
          "text-sm whitespace-pre overflow-hidden transition-all duration-300 ease-in-out text-left",
          open ? "w-auto opacity-100 ml-0 inline-block" : "w-0 opacity-0 ml-0 hidden md:inline-block md:w-0 md:opacity-0"
        )}
      >
        {link.label}
      </span>
    </button>
  );
};

export const SidebarLinkActive = ({ link, className, onClick, ...props }) => {
  const { open } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200 w-full",
        "bg-indigo-500/20 text-white border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]",
        open ? "justify-start" : "justify-center",
        className
      )}
      {...props}
    >
      <span className="shrink-0">
        {link.icon}
      </span>

      <span
        className={cn(
          "text-sm font-medium whitespace-pre overflow-hidden transition-all duration-300 ease-in-out text-left",
          open ? "w-auto opacity-100 ml-0 inline-block" : "w-0 opacity-0 ml-0 hidden md:inline-block md:w-0 md:opacity-0"
        )}
      >
        {link.label}
      </span>
    </button>
  );
};
