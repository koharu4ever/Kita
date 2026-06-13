"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import styles from "./about-overlay-nav.module.css";

const navLinks: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/reviews", label: "Reviews" },
  { href: "/tools", label: "Tools" },
];

export function AboutOverlayNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-label="Toggle navigation menu"
        className={`${styles.menuButton} ${isOpen ? styles.isOpen : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={styles.hamburger}>
          <span
            className={`${styles.hamburgerLine} ${styles.hamburgerLineTop}`}
          />
          <span
            className={`${styles.hamburgerLine} ${styles.hamburgerLineMiddle}`}
          />
          <span
            className={`${styles.hamburgerLine} ${styles.hamburgerLineBottom}`}
          />
        </span>
      </button>

      <div
        aria-hidden={!isOpen}
        className={`${styles.overlay} ${isOpen ? styles.overlayOpen : ""}`}
      >
        <nav aria-label="About page overlay navigation">
          <ul className={styles.navList}>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  className={styles.navLink}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
