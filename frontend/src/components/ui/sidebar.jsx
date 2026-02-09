"use client";
import { cn } from "../../lib/utils";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";

/* ===================== CONTEXT ===================== */

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

/* ===================== BODY ===================== */

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

/* ===================== DESKTOP ===================== */

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-slate-900/80 backdrop-blur-xl border-r border-white/10 shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "300px" : "70px") : "300px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/* ===================== MOBILE ===================== */

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  // lock background scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => (document.body.style.overflow = "");
  }, [open]);

  return (
    <>
      {/* Top Navbar */}
      <div
        className="h-14 px-4 flex md:hidden items-center justify-between bg-slate-900/90 backdrop-blur-xl w-full border-b border-white/10 sticky top-0 z-[60]"
        {...props}
      >
        <div className="text-white font-bold text-lg">ProPDF</div>

        <IconMenu2
          className="text-white cursor-pointer h-7 w-7 active:scale-90 transition"
          onClick={() => setOpen(true)}
        />
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-[998]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={cn(
                "fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-slate-900 z-[999] flex flex-col p-5 pt-16 shadow-2xl",
                className
              )}
            >
              <button
                className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 active:scale-90"
                onClick={() => setOpen(false)}
              >
                <IconX className="h-6 w-6" />
              </button>

              <div className="overflow-y-auto flex-1 text-white space-y-1">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ===================== LINKS ===================== */

export const SidebarLink = ({ link, className, onClick, ...props }) => {
  const { open } = useSidebar();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200",
        "hover:bg-white/5 text-slate-300 hover:text-white w-full",
        open ? "justify-start" : "justify-center md:justify-center",
        className
      )}
      {...props}
    >
      {link.icon}

      {/* Always visible on mobile, collapses only on desktop */}
      <span className={cn("text-sm whitespace-pre", !open && "hidden md:inline")}>
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
        "flex items-center gap-3 py-3 px-3 rounded-xl transition-all duration-200",
        "bg-indigo-500/20 text-white border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)] w-full",
        open ? "justify-start" : "justify-center md:justify-center",
        className
      )}
      {...props}
    >
      {link.icon}

      <span className={cn("text-sm font-medium whitespace-pre", !open && "hidden md:inline")}>
        {link.label}
      </span>
    </button>
  );
};
