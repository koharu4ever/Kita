"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ToolkitItem } from "@/features/tools/types/toolkit-item";
import {
  archiveFacets,
  archivePageSizes,
  archiveSorts,
  archiveTone,
  archiveViews,
  selectArchiveItems,
  type ArchiveFilter,
  type ArchivePageSize,
  type ArchiveSort,
  type ArchiveView,
} from "@/features/tools/utils/tools-archive";

import "./tools-archive.css";

type Preferences = {
  view: ArchiveView;
  sort: ArchiveSort;
  pageSize: ArchivePageSize;
};
const defaultPreferences: Preferences = {
  view: "minimal",
  sort: "recommended",
  pageSize: "25",
};
const storageKey = "kita-tools-archive";

function readPreferences(): Preferences {
  let stored: Partial<Preferences> = {};
  try {
    stored = JSON.parse(localStorage.getItem(storageKey) || "{}") ?? {};
  } catch {
    /* Storage is optional. */
  }
  const view =
    new URLSearchParams(window.location.search).get("view") || stored.view;
  return {
    view: archiveViews.includes(view as ArchiveView)
      ? (view as ArchiveView)
      : "minimal",
    sort: archiveSorts.includes(stored.sort as ArchiveSort)
      ? (stored.sort as ArchiveSort)
      : "recommended",
    pageSize: archivePageSizes.includes(stored.pageSize as ArchivePageSize)
      ? (stored.pageSize as ArchivePageSize)
      : "25",
  };
}

export function ToolsPage({
  items,
  preview = false,
}: {
  items: ToolkitItem[];
  preview?: boolean;
}) {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ArchiveFilter[]>([]);
  const [requestedPage, setRequestedPage] = useState(1);
  const searchRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    // Restore optional browser preferences after hydration, keeping SSR deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(readPreferences());
  }, []);

  function updatePreferences(update: Partial<Preferences>) {
    const next = { ...preferences, ...update };
    setPreferences(next);
    if (update.sort || update.pageSize) setRequestedPage(1);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* Keep controls usable without storage. */
    }
  }

  const categories = useMemo(() => archiveFacets(items, "category"), [items]);
  const sources = useMemo(() => archiveFacets(items, "source"), [items]);
  const quickFilters = [...categories, ...sources].slice(0, 10);
  const result = useMemo(
    () =>
      selectArchiveItems(
        items,
        query,
        filters,
        preferences.sort,
        preferences.pageSize,
        requestedPage,
      ),
    [items, query, filters, preferences, requestedPage],
  );

  function clearFilters() {
    setQuery("");
    setFilters([]);
    setRequestedPage(1);
    searchRef.current?.focus();
  }
  function toggleFilter(filter: ArchiveFilter) {
    setFilters((current) =>
      current.some(
        (selected) =>
          selected.kind === filter.kind && selected.value === filter.value,
      )
        ? current.filter(
            (selected) =>
              selected.kind !== filter.kind || selected.value !== filter.value,
          )
        : [...current, filter],
    );
    setRequestedPage(1);
  }
  function changePage(page: number) {
    setRequestedPage(page);
    countRef.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function renderFilter(
    filter: ArchiveFilter & { count: number },
    tag = false,
  ) {
    return (
      <button
        key={filter.kind + ":" + filter.value}
        type="button"
        className={`kral-notes-filter-button kral-notes-tone-${archiveTone(filter.value)} ${tag ? "kral-notes-filter-button--tag" : ""}`}
        aria-pressed={filters.some(
          (selected) =>
            selected.kind === filter.kind && selected.value === filter.value,
        )}
        onClick={() => toggleFilter(filter)}
      >
        <span>{filter.value}</span>
        <small>{filter.count}</small>
      </button>
    );
  }
  function renderPagination(bottom = false) {
    return (
      <nav
        className={`kral-notes-pagination ${bottom ? "kral-notes-pagination--bottom" : ""}`}
        aria-label={bottom ? "Tools bottom pagination" : "Tools pagination"}
      >
        <button
          type="button"
          disabled={result.page === 1}
          onClick={() => changePage(1)}
        >
          {"<< First"}
        </button>
        <button
          type="button"
          disabled={result.page === 1}
          onClick={() => changePage(result.page - 1)}
        >
          {"< Prev"}
        </button>
        <span title={`Page ${result.page} / ${result.totalPages}`}>
          Jump/Seek
          <span className="sr-only">
            {" "}
            · Page {result.page} of {result.totalPages}
          </span>
        </span>
        <button
          type="button"
          disabled={result.page === result.totalPages}
          onClick={() => changePage(result.page + 1)}
        >
          {"Next >"}
        </button>
        <button
          type="button"
          disabled={result.page === result.totalPages}
          onClick={() => changePage(result.totalPages)}
        >
          {"Last >>"}
        </button>
      </nav>
    );
  }
  const activeDot = Math.round(
    ((result.page - 1) / Math.max(1, result.totalPages - 1)) * 47,
  );

  return (
    <div className="tools-archive">
      {preview && (
        <aside className="tools-archive__preview">
          Local UI preview · 30 sample resources · no database writes.{" "}
          <Link href="/tools">Open real Tools →</Link>
        </aside>
      )}
      <div className="tools-archive__panel">
        <main className="kral-notes-gallery" data-notes-view={preferences.view}>
          <nav className="kral-notes-subnav" aria-label="Tools navigation">
            <Link href="/">Front Page</Link>
            <Link href="/games">Games</Link>
            <Link href="/reviews">Reviews</Link>
            <Link href="/tools" aria-current="page">
              Tools
            </Link>
            <Link href="/about">About</Link>
            <a
              href="https://koharu4ever.github.io/notes/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Notes
            </a>
            <a
              href="https://github.com/koharu4ever"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
          <header className="kral-notes-header">
            <h1 className="kral-notes-brand">
              Kita Tools ·{" "}
              <Link href={preview ? "/tools/preview" : "/tools"}>
                Resource Archive
              </Link>{" "}
              <span title="Search resource titles, descriptions, categories and source sites">
                [?]
              </span>
            </h1>
            <form
              className="kral-notes-search-panel"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setRequestedPage(1);
              }}
            >
              <div
                className="kral-notes-quick-filters"
                aria-label="Categories and common sources"
              >
                {quickFilters.map((filter) => renderFilter(filter))}
              </div>
              <div className="kral-notes-search-row">
                <label className="sr-only" htmlFor="kita-tools-search">
                  Search tools
                </label>
                <input
                  id="kita-tools-search"
                  name="tools-search"
                  type="search"
                  placeholder="Search Keywords"
                  autoComplete="off"
                  value={query}
                  ref={searchRef}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setRequestedPage(1);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") clearFilters();
                  }}
                />
                <button type="submit">Search</button>
                <button type="button" onClick={clearFilters}>
                  Clear
                </button>
              </div>
              <div className="kral-notes-advanced-links">
                <details className="kral-notes-advanced">
                  <summary>
                    <span className="kral-notes-advanced-summary--show">
                      [Show Advanced Options]
                    </span>
                    <span className="kral-notes-advanced-summary--hide">
                      [Hide Advanced Options]
                    </span>
                  </summary>
                  <div className="kral-notes-advanced-panel">
                    <label className="kral-notes-advanced-control">
                      Sort
                      <select
                        name="tools-sort"
                        value={preferences.sort}
                        onChange={(event) =>
                          updatePreferences({
                            sort: event.target.value as ArchiveSort,
                          })
                        }
                      >
                        <option value="recommended">Curated order</option>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="title">Title A–Z</option>
                      </select>
                    </label>
                    <label className="kral-notes-advanced-control">
                      Per Page
                      <select
                        name="tools-page-size"
                        value={preferences.pageSize}
                        onChange={(event) =>
                          updatePreferences({
                            pageSize: event.target.value as ArchivePageSize,
                          })
                        }
                      >
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="all">All</option>
                      </select>
                    </label>
                  </div>
                </details>
                <details className="kral-notes-all-tags">
                  <summary>[Show Source Search]</summary>
                  <div>
                    {sources.map((filter) => renderFilter(filter, true))}
                  </div>
                </details>
              </div>
              <div
                className="kral-notes-active-filters"
                hidden={!query.trim() && !filters.length}
              >
                <span className="kral-notes-active-filters__label">
                  Active Filters
                </span>
                <div className="kral-notes-active-filters__list">
                  {query.trim() && (
                    <button
                      type="button"
                      aria-label="Remove search filter"
                      onClick={() => {
                        setQuery("");
                        setRequestedPage(1);
                      }}
                    >
                      Search: “{query.trim()}” ×
                    </button>
                  )}
                  {filters.map((filter) => (
                    <button
                      key={filter.kind + ":" + filter.value}
                      type="button"
                      aria-label={`Remove ${filter.value} filter`}
                      onClick={() => toggleFilter(filter)}
                    >
                      {filter.kind === "category" ? "Category" : "Source"}:{" "}
                      {filter.value} ×
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  data-notes-clear-active
                  onClick={clearFilters}
                >
                  Clear all
                </button>
              </div>
            </form>
            <div className="kral-notes-seekbar" aria-hidden="true">
              {Array.from({ length: 48 }, (_, index) => (
                <span
                  key={index}
                  className={index === activeDot ? "is-active" : undefined}
                />
              ))}
            </div>
            <p ref={countRef} className="kral-notes-result-count" role="status">
              Found {result.total.toLocaleString("en-US")} results.
            </p>
            <div className="kral-notes-toolbar">
              {renderPagination()}
              <label className="kral-notes-view-picker">
                <span className="sr-only">View</span>
                <select
                  name="tools-view"
                  value={preferences.view}
                  onChange={(event) =>
                    updatePreferences({
                      view: event.target.value as ArchiveView,
                    })
                  }
                >
                  <option value="minimal">Minimal</option>
                  <option value="minimal-plus">Minimal+</option>
                  <option value="compact">Compact</option>
                  <option value="extended">Extended</option>
                  <option value="thumbnail">Thumbnail</option>
                </select>
              </label>
            </div>
          </header>
          <section
            className="kral-notes-list-shell"
            aria-label="Tools resources"
          >
            <div className="kral-notes-list-head" aria-hidden="true">
              <span />
              <span>Added</span>
              <span />
              <span>Title</span>
              <span>Resource</span>
              <span>Source</span>
            </div>
            <div className="kral-notes-results">
              {result.items.map((item) => (
                <article className="kral-notes-entry" key={item.id}>
                  <a
                    className="kral-notes-entry__link"
                    href={item.links[0]?.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${item.title} — ${item.summary}`}
                  >
                    <span
                      className={`kral-notes-entry__category kral-notes-tone-${archiveTone(item.category)}`}
                    >
                      {item.category}
                    </span>
                    <time dateTime={item.createdAt || undefined}>
                      {item.addedOn}
                    </time>
                    <span
                      className="kral-notes-entry__status-dot"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                    <div className="kral-notes-entry__title-cell">
                      <span className="kral-notes-entry__media">
                        <Image
                          src={item.cover}
                          alt=""
                          width={1440}
                          height={810}
                          unoptimized
                        />
                      </span>
                      <div className="kral-notes-entry__content">
                        <h2>{item.title}</h2>
                        <span className="kral-notes-entry__tags">
                          <span className="kral-notes-entry__tag">
                            {item.category}
                          </span>
                          <span className="kral-notes-entry__tag">
                            {item.source}
                          </span>
                        </span>
                        <span className="kral-notes-entry__summary">
                          {item.summary}
                        </span>
                      </div>
                    </div>
                    <span className="kral-notes-entry__reading">
                      External link
                    </span>
                    <span className="kral-notes-entry__uploader">
                      {item.source}
                    </span>
                  </a>
                </article>
              ))}
            </div>
          </section>
          {renderPagination(true)}
          {!result.total && (
            <p className="kral-notes-empty">
              {items.length
                ? "No matching resources were found."
                : "No tools have been added yet."}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
