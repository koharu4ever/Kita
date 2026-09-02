"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import styles from "./about-overlay-nav.module.css";

const navLinks: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/reviews", label: "Reviews" },
  { href: "/tools", label: "Tools" },
];

export function AboutOverlayNav() {
  const [isOpen, setIsOpen] = useState(false);
  const navigationId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function openNavigation() {
    dialogRef.current?.showModal();
    setIsOpen(true);
  }

  function closeNavigation() {
    dialogRef.current?.close();
  }

  return (
    <div className={styles.navigation}>
      <button
        ref={buttonRef}
        aria-controls={navigationId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Open navigation menu"
        className={styles.menuButton}
        onClick={openNavigation}
        type="button"
      >
        <span>Menu</span>
        <span aria-hidden="true" className={styles.menuIcon}>
          <span />
          <span />
        </span>
      </button>

      <dialog
        ref={dialogRef}
        id={navigationId}
        aria-label="Site navigation"
        className={styles.veil}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeNavigation();
        }}
        onClose={() => {
          setIsOpen(false);
          buttonRef.current?.focus({ preventScroll: true });
        }}
      >
        <button
          aria-label="Close navigation menu"
          className={styles.closeButton}
          onClick={closeNavigation}
          type="button"
        >
          <span>Close</span>
          <span aria-hidden="true" className={styles.closeIcon} />
        </button>

        <nav aria-label="About page navigation" className={styles.directory}>
          <p className={styles.caption}>Explore Kita</p>
          <ul className={styles.navList}>
            {navLinks.map((link, index) => (
              <li key={link.href}>
                <Link
                  className={styles.navLink}
                  href={link.href}
                  onClick={closeNavigation}
                >
                  <span aria-hidden="true" className={styles.index}>
                    0{index + 1}
                  </span>
                  <span className={styles.label}>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <span aria-hidden="true" className={styles.endMark} />
        </nav>
      </dialog>
    </div>
  );
}
