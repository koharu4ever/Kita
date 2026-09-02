import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import styles from "./reviews-top-nav.module.css";

const navItems: Array<{
  href: Route;
  icon: string;
  label: string;
}> = [
  { href: "/", icon: "home.webp", label: "Home" },
  { href: "/games", icon: "games.webp", label: "Games" },
  { href: "/about", icon: "about.webp", label: "About" },
  { href: "/tools", icon: "tools.webp", label: "Tools" },
];

export function ReviewsTopNav() {
  return (
    <header className={styles.header}>
      <nav aria-label="Reviews section navigation" className={styles.nav}>
        <Link href="/reviews" className={styles.brand}>
          <Image
            alt=""
            aria-hidden="true"
            className={styles.characterIcon}
            height={34}
            src="/reviews/navigation/reviews.webp"
            width={34}
          />
          <span>Reviews</span>
        </Link>

        <div className={styles.links}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={styles.link}>
              <Image
                alt=""
                aria-hidden="true"
                className={styles.characterIcon}
                height={32}
                src={`/reviews/navigation/${item.icon}`}
                width={32}
              />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
