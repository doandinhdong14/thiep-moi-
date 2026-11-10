"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  titleId: string;
  children: React.ReactNode;
  maxWidthClass?: string; // e.g. "max-w-[540px]" or "max-w-[800px]"
  className?: string;
  overlayClassName?: string;
  fullScreenMobile?: boolean;
}

export default function ModalShell({
  isOpen,
  onClose,
  titleId,
  children,
  maxWidthClass = "max-w-lg",
  className = "",
  overlayClassName,
  fullScreenMobile = false,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Handle ESC key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on first focusable element or modal container
    const timer = setTimeout(() => {
      if (modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus
      if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current.focus) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={
        overlayClassName ??
        (fullScreenMobile
          ? "fixed inset-0 z-[9999] flex md:items-center md:justify-center p-0 md:py-12 md:px-4 bg-white md:bg-black/60 md:backdrop-blur-sm overflow-hidden md:overflow-y-auto"
          : "fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto")
      }
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={
          fullScreenMobile
            ? `relative w-full ${maxWidthClass} h-[100dvh] md:h-[860px] max-h-[100dvh] md:max-h-[calc(100dvh-48px)] bg-white rounded-none md:rounded-[12px] shadow-none md:shadow-[0_12px_48px_rgba(0,0,0,0.14)] border-0 overflow-hidden outline-none flex flex-col md:my-auto transition-all ${className}`
            : `relative w-full ${maxWidthClass} bg-white rounded-[18px] shadow-2xl border border-rose-100 overflow-hidden outline-none my-auto transition-all ${className}`
        }
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

