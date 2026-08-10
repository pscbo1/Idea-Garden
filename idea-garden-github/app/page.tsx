"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpen,
  Copy,
  Download,
  Flower2,
  ListFilter,
  Maximize2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Leaf,
  Pin,
  X,
} from "lucide-react";

type IdeaStatus = "seed" | "sprout" | "bloom" | "spark" | "archived";
type SortField = "updated" | "created" | "category" | "status";
type SortDirection = "asc" | "desc";

type Idea = {
  id: number;
  title: string;
  content: string;
  comment: string;
  category: string;
  status: IdeaStatus;
  pinned: boolean;
  evergreen: boolean;
  bloomedAt: string | null;
  sparkedAt: string | null;
  gardenSlot: number | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<IdeaStatus, string> = {
  seed: "Seed",
  sprout: "Growing",
  bloom: "Bloomed",
  spark: "Spark",
  archived: "Archived",
};

type GardenSnapshot = {
  version: 1;
  exportedAt: string;
  ideas: Idea[];
  trashedIdeas: Idea[];
};

const localGardenStorageKey = "idea-garden-fast-test:v1";

const progressStatuses: IdeaStatus[] = ["seed", "sprout"];
const completionStatuses: IdeaStatus[] = ["spark", "bloom"];
const filterStatusesInOrder: IdeaStatus[] = [
  "archived",
  "seed",
  "sprout",
  "spark",
  "bloom",
];
const statusSortOrder: Record<IdeaStatus, number> = {
  archived: 0,
  seed: 1,
  sprout: 2,
  spark: 3,
  bloom: 4,
};

const categoryColors = ["mint", "coral", "violet", "amber", "clay"];

function colorFor(text: string) {
  let hash = 0;
  for (const character of text || "Uncategorized") {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return categoryColors[Math.abs(hash) % categoryColors.length];
}

function GrowthMark({ status }: { status: IdeaStatus }) {
  if (status === "spark") {
    return <span className="spark-mark" aria-label="Spark · quick completed idea">✦</span>;
  }
  return (
    <span className={`growth-mark ${status}`} aria-hidden="true">
      <span className="soil" />
      <span className="stem" />
      <span className="leaf leaf-left" />
      <span className="leaf leaf-right" />
      <span className="flower">
        <i />
        <i />
        <i />
        <i />
        <b />
      </span>
    </span>
  );
}

function CategoryField({
  value,
  options,
  onChange,
  variant,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  variant: "card" | "detail";
}) {
  const [focused, setFocused] = useState(false);
  const normalized = value.trim().toLocaleLowerCase();
  const suggestion =
    focused && normalized
      ? options.find((option) => {
          const candidate = option.toLocaleLowerCase();
          return candidate !== normalized && candidate.startsWith(normalized);
        })
      : undefined;
  const completion = suggestion?.slice(value.length) ?? "";

  const acceptSuggestion = () => {
    if (suggestion) onChange(suggestion);
  };

  return (
    <span
      className={`category-combobox category-combobox-${variant}`}
      data-suggestion={Boolean(suggestion)}
    >
      {suggestion && (
        <span className="category-ghost" aria-hidden="true">
          <span>{value}</span>
          {completion}
        </span>
      )}
      <input
        className={variant === "card" ? "category-input" : undefined}
        value={value}
        size={
          variant === "card"
            ? Math.max(suggestion?.length ?? value.length, "Category".length)
            : undefined
        }
        placeholder="Category"
        aria-label="Category"
        aria-autocomplete="inline"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (!suggestion || (event.key !== "Tab" && event.key !== "Enter")) {
            return;
          }
          event.preventDefault();
          acceptSuggestion();
        }}
      />
    </span>
  );
}

function IdeaCard({
  idea,
  categoryOptions,
  onChange,
  onTrash,
  onOpen,
}: {
  idea: Idea;
  categoryOptions: string[];
  onChange: (id: number, patch: Partial<Idea>) => void;
  onTrash: (id: number) => void;
  onOpen: (id: number) => void;
}) {
  const [statusPulse, setStatusPulse] = useState(0);
  const categoryTone = colorFor(idea.category);

  return (
    <article
      className={`idea-card status-${idea.status} category-${categoryTone}`}
    >
      <div className="card-accent" />
      <div className="card-meta">
        <div className="card-properties">
          <CategoryField
            value={idea.category}
            options={categoryOptions}
            variant="card"
            onChange={(category) => onChange(idea.id, { category })}
          />
        </div>
        <div className="status-wrap">
          {idea.status !== "archived" && (
            <GrowthMark key={statusPulse} status={idea.status} />
          )}
          <select
            value={idea.status}
            aria-label="Status"
            onChange={(event) => {
              setStatusPulse((value) => value + 1);
              onChange(idea.id, { status: event.target.value as IdeaStatus });
            }}
          >
            <optgroup label="Progress">
              {progressStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Completed">
              {completionStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Inactive">
              <option value="archived">{statusLabels.archived}</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="title-input">
        {idea.pinned && (
          <Pin
            className="title-pin"
            size={14}
            strokeWidth={1.8}
            aria-label="Pinned"
          />
        )}
        {idea.status === "spark" && (
          <span
            className="card-spark"
            title="Spark · quick completed idea"
            aria-label="Spark · quick completed idea"
          >
            ✦
          </span>
        )}
        {idea.status === "bloom" && (
          <Flower2
            className="card-bloom"
            size={14}
            strokeWidth={2}
            aria-label="Bloomed · fully developed idea"
          />
        )}
        {idea.status === "spark" && (
          <Sparkles
            className="card-spark-icon"
            size={14}
            strokeWidth={2}
            aria-label="Spark · quick completed idea"
          />
        )}
        <input
          className="idea-title-field"
          value={idea.title}
          placeholder="What’s the idea?"
          aria-label="Idea title"
          onChange={(event) => onChange(idea.id, { title: event.target.value })}
        />
      </div>
      {idea.evergreen && (
        <div className="card-secondary-meta">
          <span className="evergreen-tag" aria-label="Evergreen">
            <Leaf size={11} aria-hidden="true" />
            Evergreen
          </span>
        </div>
      )}
      <textarea
        className={`content-input${idea.evergreen ? " has-secondary-meta" : ""}`}
        value={idea.content}
        placeholder="Capture questions, fragments, and thoughts as they come."
        aria-label="Idea notes"
        onChange={(event) => onChange(idea.id, { content: event.target.value })}
      />
      <button
        className="open-idea-button"
        type="button"
        aria-label="Open full idea"
        title="Open full idea"
        onClick={() => onOpen(idea.id)}
      >
        <Maximize2 size={14} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <button
        className="delete-button"
        type="button"
        aria-label="Move idea to trash"
        title="Move to trash"
        onClick={() => onTrash(idea.id)}
      >
        <Trash2 size={14} strokeWidth={1.7} aria-hidden="true" />
      </button>
    </article>
  );
}

function IdeaDetail({
  idea,
  categoryOptions,
  onClose,
  onChange,
}: {
  idea: Idea;
  categoryOptions: string[];
  onClose: () => void;
  onChange: (id: number, patch: Partial<Idea>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [noteMode, setNoteMode] = useState<"edit" | "preview">("edit");
  const hasMarkdown = /(^|\n)\s*(#{1,6}\s|```|~~~|[-*+]\s|\d+\.\s|>\s)|\[[^\]]+\]\([^)]+\)|\|.+\|/.test(
    idea.content,
  );
  const copyContent = async () => {
    const value = [idea.title.trim(), idea.content.trim()]
      .filter(Boolean)
      .join("\n\n");
    let didCopy = false;

    try {
      await navigator.clipboard.writeText(value);
      didCopy = true;
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.focus();
      field.select();
      didCopy = document.execCommand("copy");
      field.remove();
    }

    setCopied(didCopy);
    setCopyFailed(!didCopy);
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1800);
  };

  return (
    <aside className="idea-detail garden-detail" aria-label="Full idea">
      <header className="detail-header">
        <p className="trash-kicker">IDEA</p>
        <button
          className="detail-close"
          type="button"
          aria-label="Close full idea"
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </header>
      <div className="detail-scroll">
        <input
          className="detail-title-input"
          value={idea.title}
          placeholder="What’s the idea?"
          aria-label="Idea title"
          autoFocus
          onChange={(event) => onChange(idea.id, { title: event.target.value })}
        />
        <div className="detail-meta-fields">
        <label className="detail-field">
          <span>Category</span>
          <CategoryField
            value={idea.category}
            options={categoryOptions}
            variant="detail"
            onChange={(category) => onChange(idea.id, { category })}
          />
        </label>
        <label className="detail-field">
          <span>Status</span>
          <select
            value={idea.status}
            aria-label="Status"
            onChange={(event) =>
              onChange(idea.id, { status: event.target.value as IdeaStatus })
            }
          >
            <optgroup label="Progress">
              {progressStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Completed">
              {completionStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Inactive">
              <option value="archived">{statusLabels.archived}</option>
            </optgroup>
          </select>
        </label>
        </div>
        <div className="detail-markers">
          <button
            type="button"
            className={idea.pinned ? "active" : ""}
            aria-pressed={idea.pinned}
            onClick={() => onChange(idea.id, { pinned: !idea.pinned })}
          >
            <Pin size={14} /> {idea.pinned ? "Pinned" : "Pin to top"}
          </button>
          <button
            type="button"
            className={idea.evergreen ? "active evergreen" : "evergreen"}
            aria-pressed={idea.evergreen}
            onClick={() => onChange(idea.id, { evergreen: !idea.evergreen })}
          >
            <Leaf size={14} /> Evergreen
          </button>
          <button type="button" onClick={copyContent}>
            <Copy size={14} />{" "}
            {copied ? "Copied" : copyFailed ? "Select and copy" : "Copy content"}
          </button>
        </div>
        <section className="full-note" aria-label="Full note">
          <div className="full-note-heading">
            <span>Full Note</span>
            {hasMarkdown && (
              <div className="note-mode" aria-label="Note display mode">
                <button
                  type="button"
                  className={noteMode === "edit" ? "active" : ""}
                  aria-pressed={noteMode === "edit"}
                  onClick={() => setNoteMode("edit")}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={noteMode === "preview" ? "active" : ""}
                  aria-pressed={noteMode === "preview"}
                  onClick={() => setNoteMode("preview")}
                >
                  Preview
                </button>
              </div>
            )}
          </div>
          {noteMode === "preview" && hasMarkdown ? (
            <div className="markdown-preview">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                  img: ({ src, alt }) => (
                    <a
                      href={typeof src === "string" ? src : undefined}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {alt ? `Image: ${alt}` : "Image link"}
                    </a>
                  ),
                }}
              >
                {idea.content}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              value={idea.content}
              placeholder="Capture questions, fragments, and thoughts as they come."
              aria-label="Full note"
              onChange={(event) =>
                onChange(idea.id, { content: event.target.value })
              }
            />
          )}
        </section>
      </div>
    </aside>
  );
}

function GardenFlower({
  idea,
  onOpen,
}: {
  idea: Idea;
  onOpen: (id: number) => void;
}) {
  return (
    <button
      type="button"
      className="garden-flower"
      onClick={() => onOpen(idea.id)}
      aria-label={`View ${idea.title || "untitled idea"}`}
    >
      <span
        className={`species-art species-${idea.id % 10}`}
        aria-hidden="true"
      />
      <span className="flower-copy">
        <strong>{idea.title || "Untitled idea"}</strong>
      </span>
    </button>
  );
}

function GardenSpark({
  idea,
  onOpen,
  compact = false,
}: {
  idea: Idea;
  onOpen: (id: number) => void;
  compact?: boolean;
}) {
  const completedAt = idea.sparkedAt ?? idea.updatedAt;
  const completionLabel = new Date(completedAt).toLocaleDateString();
  const position = compact
    ? {
        left: `${12 + ((idea.id * 37) % 64)}%`,
        top: `${35 + ((idea.id * 53) % 30)}%`,
      }
    : {
        left: `${8 + ((idea.id * 37) % 78)}%`,
        top: `${8 + ((idea.id * 53) % 76)}%`,
      };
  return (
    <button
      type="button"
      className={`garden-spark${compact ? " collection-spark" : ""}`}
      onClick={() => onOpen(idea.id)}
      style={position}
      aria-label={`Spark · ${idea.title || "untitled idea"}, completed ${completionLabel}`}
      title={`Spark · ${idea.title || "Untitled idea"} · ${completionLabel}`}
    >
      <span aria-hidden="true">✦</span>
    </button>
  );
}

function CollectionCard({
  idea,
  displayed,
  gardenFull,
  customMode,
  onOpen,
  onToggleDisplay,
}: {
  idea: Idea;
  displayed: boolean;
  gardenFull: boolean;
  customMode: boolean;
  onOpen: (id: number) => void;
  onToggleDisplay: (idea: Idea) => void;
}) {
  const isSpark = idea.status === "spark";
  const appearedAt = isSpark
    ? idea.sparkedAt ?? idea.updatedAt
    : idea.bloomedAt ?? idea.updatedAt;
  return (
    <article className={`collection-card ${isSpark ? "is-spark" : ""}`}>
      <button
        type="button"
        className="collection-card-main"
        onClick={() => onOpen(idea.id)}
        aria-label={`Open ${idea.title || "untitled idea"}`}
      >
        <span className="collection-art" aria-hidden="true">
          {isSpark ? (
            <span className="collection-spark">✦</span>
          ) : (
            <span className={`species-art species-${idea.id % 10}`} />
          )}
        </span>
        <span className="collection-copy">
          <strong>{idea.title || "Untitled idea"}</strong>
          <span>First appeared {new Date(appearedAt).toLocaleDateString()}</span>
        </span>
      </button>
      <div className="collection-card-footer">
        <span className={`collection-status status-${idea.status}`}>{statusLabels[idea.status]}</span>
        {!isSpark && !idea.evergreen && customMode && (
          <button
            type="button"
            className={`collection-display-toggle ${displayed ? "is-displayed" : ""}`}
            onClick={() => onToggleDisplay(idea)}
            disabled={!displayed && gardenFull}
          >
            {displayed
              ? "Remove from garden"
              : gardenFull
                ? "Garden full"
                : "Add to garden"}
          </button>
        )}
      </div>
    </article>
  );
}

function GardenDetail({
  idea,
  onClose,
  onChange,
}: {
  idea: Idea;
  onClose: () => void;
  onChange: (id: number, patch: Partial<Idea>) => void;
}) {
  const isSpark = idea.status === "spark";
  const completionDate = isSpark
    ? idea.sparkedAt ?? idea.updatedAt
    : idea.bloomedAt ?? idea.updatedAt;
  const completionDateValue = (() => {
    const date = new Date(completionDate);
    if (Number.isNaN(date.getTime())) return "";
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 16);
  })();

  return (
    <aside className="garden-detail" aria-label="Idea details">
      <button
        className="detail-close"
        type="button"
        aria-label="Close details"
        onClick={onClose}
      >
        <X size={18} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <div
        className={`detail-species species-art species-${idea.id % 10}`}
        aria-hidden="true"
      />
      <p className="detail-category">{idea.category || "Uncategorized"}</p>
      <h2>{idea.title || "Untitled idea"}</h2>
      <label className="bloom-date">
        <span>{isSpark ? "Completed" : "Bloomed"}</span>
        <input
          type="datetime-local"
          value={completionDateValue}
          onChange={(event) => {
            const value = event.target.value;
            onChange(idea.id, {
              [isSpark ? "sparkedAt" : "bloomedAt"]: value
                ? new Date(value).toISOString()
                : null,
            });
          }}
        />
      </label>
      <div className="original-note">
        <span>Original Note</span>
        <p>{idea.content || "No notes yet."}</p>
      </div>
      <label className="garden-comment" htmlFor={`comment-${idea.id}`}>
        <span>Outcome Notes</span>
        <textarea
          id={`comment-${idea.id}`}
          value={idea.comment}
          placeholder="What did it become? Add its purpose, outcome, or current status."
          onChange={(event) => onChange(idea.id, { comment: event.target.value })}
        />
      </label>
    </aside>
  );
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [trashedIdeas, setTrashedIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const embedKey = "local";
  const accessDenied = false;
  const savingIds = new Set<number>();
  const saveFailedIds = new Set<number>();
  const [view, setView] = useState<"incubator" | "garden">("incubator");
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [gardenDisplayMode, setGardenDisplayMode] = useState<"latest" | "custom">(
    "latest",
  );
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updated");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [filterCategories, setFilterCategories] = useState<Set<string>>(
    new Set(),
  );
  const [filterStatuses, setFilterStatuses] = useState<Set<IdeaStatus>>(
    new Set(),
  );
  const [filterEvergreen, setFilterEvergreen] = useState(false);
  const [activeTool, setActiveTool] = useState<
    "search" | "filter" | "sort" | "trash" | null
  >(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [confirmingBatchDelete, setConfirmingBatchDelete] = useState(false);
  const [selectedTrashIds, setSelectedTrashIds] = useState<Set<number>>(
    new Set(),
  );
  const [trashError, setTrashError] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null);
  const [creatingIdea, setCreatingIdea] = useState(false);
  const creatingIdeaRef = useRef(false);
  const movingToTrashIds = useRef<Set<number>>(new Set());
  const toolsRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(localGardenStorageKey);
      if (raw) {
        const snapshot = JSON.parse(raw) as Partial<GardenSnapshot>;
        // This initializes browser-only persisted data after hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(snapshot.ideas)) setIdeas(snapshot.ideas);
        if (Array.isArray(snapshot.trashedIdeas)) setTrashedIdeas(snapshot.trashedIdeas);
      }
    } catch {
      window.localStorage.removeItem(localGardenStorageKey);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (collectionOpen) {
        setCollectionOpen(false);
        return;
      }
      if (activeTool && activeTool !== "trash") {
        setActiveTool(null);
        return;
      }
      if (selectedIdeaId !== null || activeTool === "trash") {
        setActiveTool(null);
        setSelectedIdeaId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete("idea");
        window.history.replaceState(null, "", url);
        return;
      }
      if (query) {
        setQuery("");
        return;
      }
      if (sortField !== "updated" || sortDirection !== "desc") {
        setSortField("updated");
        setSortDirection("desc");
        return;
      }
      setActiveTool(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeTool, collectionOpen, query, selectedIdeaId, sortDirection, sortField]);

  useEffect(() => {
    if (!activeTool || activeTool === "trash") return;
    const closeOutside = (event: PointerEvent) => {
      if (!toolsRef.current?.contains(event.target as Node)) {
        setActiveTool(null);
      }
    };
    window.addEventListener("pointerdown", closeOutside);
    return () => window.removeEventListener("pointerdown", closeOutside);
  }, [activeTool]);

  useEffect(() => {
    const breakpoint = window.matchMedia("(max-width: 760px)");
    const resetResponsiveScroll = () => {
      window.requestAnimationFrame(() => {
        if (streamRef.current) {
          streamRef.current.scrollTop = 0;
          streamRef.current.scrollLeft = 0;
        }
      });
    };
    breakpoint.addEventListener("change", resetResponsiveScroll);
    return () =>
      breakpoint.removeEventListener("change", resetResponsiveScroll);
  }, []);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const syncStreamLayout = () => {
      const isNarrow = stream.getBoundingClientRect().width <= 760;
      stream.classList.toggle("is-narrow", isNarrow);
      if (isNarrow) {
        stream.scrollLeft = 0;
      }
    };

    syncStreamLayout();
    const observer = new ResizeObserver(syncStreamLayout);
    observer.observe(stream);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const currentIds = new Set(trashedIdeas.map((idea) => idea.id));
    // Reconcile selection after restore/delete responses change the trash list.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedTrashIds((selected) => {
      const next = new Set(
        Array.from(selected).filter((id) => currentIds.has(id)),
      );
      if (next.size === selected.size) return selected;
      return next;
    });
  }, [trashedIdeas]);

  useEffect(() => {
    if (loading) return;
    const snapshot: GardenSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ideas,
      trashedIdeas,
    };
    window.localStorage.setItem(localGardenStorageKey, JSON.stringify(snapshot));
  }, [ideas, loading, trashedIdeas]);

  const openIdea = (id: number) => {
    setSelectedIdeaId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("idea", String(id));
    window.history.replaceState(null, "", url);
  };

  const closeIdea = () => {
    setSelectedIdeaId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("idea");
    window.history.replaceState(null, "", url);
  };

  const updateIdea = (id: number, patch: Partial<Idea>) => {
    const currentIdea = ideas.find((idea) => idea.id === id);
    const effectivePatch =
      patch.status === "bloom" && currentIdea && !currentIdea.bloomedAt
        ? { ...patch, bloomedAt: new Date().toISOString() }
        : patch.status === "spark" && currentIdea && !currentIdea.sparkedAt
          ? { ...patch, sparkedAt: new Date().toISOString() }
          : patch;
    setIdeas((current) =>
      current.map((idea) =>
        idea.id === id ? { ...idea, ...effectivePatch } : idea,
      ),
    );
  };

  const createIdea = async () => {
    if (creatingIdeaRef.current) return;
    creatingIdeaRef.current = true;
    setCreatingIdea(true);
    try {
      const now = new Date().toISOString();
      const idea: Idea = {
        id: Date.now(),
        title: "",
        content: "",
        comment: "",
        category: "",
        status: "seed",
        pinned: false,
        evergreen: false,
        bloomedAt: null,
        sparkedAt: null,
        gardenSlot: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      setIdeas((current) =>
        current.some((item) => item.id === idea.id)
          ? current
          : [idea, ...current],
      );
      openIdea(idea.id);
    } finally {
      creatingIdeaRef.current = false;
      setCreatingIdea(false);
    }
  };

  const moveToTrash = async (id: number) => {
    if (movingToTrashIds.current.has(id)) return;
    const currentIdea = ideas.find((idea) => idea.id === id);
    if (!currentIdea) return;
    movingToTrashIds.current.add(id);
    try {
      const idea = { ...currentIdea, deletedAt: new Date().toISOString() };
      setIdeas((current) => current.filter((item) => item.id !== id));
      setTrashedIdeas((current) => [idea, ...current.filter((item) => item.id !== id)]);
      setSelectedIdeaId((current) => (current === id ? null : current));
    } finally {
      movingToTrashIds.current.delete(id);
    }
  };

  const restoreIdea = async (id: number) => {
    if (deletingId !== null || batchDeleting) return;
    setTrashError(null);
    setDeletingId(id);
    try {
      const idea = trashedIdeas.find((item) => item.id === id);
      if (!idea) return;
      setTrashedIdeas((current) => current.filter((item) => item.id !== id));
      setIdeas((current) => [{ ...idea, deletedAt: null }, ...current]);
      setSelectedTrashIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setConfirmingDeleteId(null);
    } catch {
      setTrashError("Couldn’t restore this idea. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyDeleteIdea = async (id: number) => {
    if (deletingId !== null || batchDeleting) return;
    setTrashError(null);
    setDeletingId(id);
    try {
      setTrashedIdeas((current) => current.filter((idea) => idea.id !== id));
      setSelectedTrashIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      setConfirmingDeleteId(null);
    } catch {
      setTrashError("Couldn’t delete this idea. Try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const permanentlyDeleteSelected = async () => {
    const currentTrashIds = new Set(trashedIdeas.map((idea) => idea.id));
    const ids = Array.from(selectedTrashIds).filter((id) =>
      currentTrashIds.has(id),
    );
    if (ids.length === 0 || deletingId !== null || batchDeleting) return;
    setTrashError(null);
    setBatchDeleting(true);
    try {
      const deletedIds = new Set(ids);
      setTrashedIdeas((current) =>
        current.filter((idea) => !deletedIds.has(idea.id)),
      );
      setSelectedTrashIds((current) => {
        const next = new Set(current);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
      if (false) {
        setTrashError("Some ideas couldn’t be deleted. Try again.");
      } else {
        setConfirmingBatchDelete(false);
      }
    } catch {
      setTrashError("Couldn’t delete the selected ideas. Try again.");
    } finally {
      setBatchDeleting(false);
    }
  };

  const exportGarden = () => {
    const snapshot: GardenSnapshot = {
      version: 1,
      exportedAt: new Date().toISOString(),
      ideas,
      trashedIdeas,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `idea-garden-${snapshot.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importGarden = async (file: File) => {
    try {
      const snapshot = JSON.parse(await file.text()) as Partial<GardenSnapshot>;
      if (!Array.isArray(snapshot.ideas) || !Array.isArray(snapshot.trashedIdeas)) {
        throw new Error("invalid garden export");
      }
      if (!window.confirm("Replace this browser's current garden with the imported file?")) {
        return;
      }
      setIdeas(snapshot.ideas as Idea[]);
      setTrashedIdeas(snapshot.trashedIdeas as Idea[]);
      setSelectedIdeaId(null);
      setActiveTool(null);
    } catch {
      window.alert("That file is not a valid Idea Garden export.");
    }
  };

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const currentTrashIds = new Set(trashedIdeas.map((idea) => idea.id));
  const selectedTrashCount = Array.from(selectedTrashIds).filter((id) =>
    currentTrashIds.has(id),
  ).length;
  const allTrashSelected =
    trashedIdeas.length > 0 && selectedTrashCount === trashedIdeas.length;
  const categories = Array.from(
    new Set(
      ideas.map((idea) => idea.category.trim() || "Uncategorized"),
    ),
  ).sort((a, b) => a.localeCompare(b));
  const hasActiveFilters =
    filterCategories.size > 0 || filterStatuses.size > 0 || filterEvergreen;
  const hasCustomSort = sortField !== "updated" || sortDirection !== "desc";
  const hasModifiedView = Boolean(query) || hasActiveFilters || hasCustomSort;
  const sortLabel = {
    updated: "Updated",
    created: "Created",
    category: "Category",
    status: "Status",
  }[sortField];
  const appliedFilterCount =
    filterCategories.size + filterStatuses.size + (filterEvergreen ? 1 : 0);
  const clearFilters = () => {
    setFilterCategories(new Set());
    setFilterStatuses(new Set());
    setFilterEvergreen(false);
  };
  const resetView = () => {
    setQuery("");
    clearFilters();
    setSortField("updated");
    setSortDirection("desc");
    setActiveTool(null);
  };
  const resetSort = () => {
    setSortField("updated");
    setSortDirection("desc");
  };
  const workspaceIdeas = ideas
    .filter((idea) => {
      if (
        filterCategories.size > 0 &&
        !filterCategories.has(idea.category.trim() || "Uncategorized")
      ) {
        return false;
      }
      if (filterStatuses.size > 0 && !filterStatuses.has(idea.status)) {
        return false;
      }
      if (filterEvergreen && !idea.evergreen) {
        return false;
      }
      if (!normalizedQuery) return true;
      return [idea.title, idea.content, idea.category].some((value) =>
        value.toLocaleLowerCase().includes(normalizedQuery),
      );
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      let comparison: number;
      if (sortField === "category") {
        comparison = (a.category || "Uncategorized").localeCompare(
          b.category || "Uncategorized",
        );
      } else if (sortField === "status") {
        comparison = statusSortOrder[a.status] - statusSortOrder[b.status];
      } else {
        const field = sortField === "created" ? "createdAt" : "updatedAt";
        comparison = Date.parse(a[field]) - Date.parse(b[field]);
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  const byCompletionTime = (field: "bloomedAt" | "sparkedAt") =>
    (a: Idea, b: Idea) =>
      Date.parse(b[field] ?? b.updatedAt) - Date.parse(a[field] ?? a.updatedAt);
  const automaticGardenPlants = ideas
    .filter((idea) => idea.status === "bloom" && !idea.evergreen)
    .sort(byCompletionTime("bloomedAt"))
    .slice(0, 10);
  const manualGardenPlants = ideas
    .filter(
      (idea) =>
        idea.status === "bloom" &&
        !idea.evergreen &&
        idea.gardenSlot !== null &&
        idea.gardenSlot > 0,
    )
    .sort((a, b) => (a.gardenSlot ?? 0) - (b.gardenSlot ?? 0));
  const hasManualGarden = ideas.some(
    (idea) =>
      idea.status === "bloom" &&
      !idea.evergreen &&
      idea.gardenSlot !== null,
  );
  const gardenPlants =
    gardenDisplayMode === "custom" ? manualGardenPlants : automaticGardenPlants;

  useEffect(() => {
    if (loading || !embedKey) return;
    const storageKey = `idea-garden-display-mode:${embedKey}`;
    const storedMode = window.localStorage.getItem(storageKey);
    // Preserve an existing curated garden when this preference is first introduced.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGardenDisplayMode(
      storedMode === "latest" || storedMode === "custom"
        ? storedMode
        : hasManualGarden
          ? "custom"
          : "latest",
    );
  }, [embedKey, hasManualGarden, loading]);

  const changeGardenDisplayMode = (mode: "latest" | "custom") => {
    if (mode === gardenDisplayMode) return;
    if (mode === "custom" && !hasManualGarden) {
      automaticGardenPlants.forEach((idea, index) =>
        updateIdea(idea.id, { gardenSlot: index + 1 }),
      );
    }
    setGardenDisplayMode(mode);
    if (embedKey) {
      window.localStorage.setItem(`idea-garden-display-mode:${embedKey}`, mode);
    }
  };
  const gardenSparks = ideas
    .filter((idea) => idea.status === "spark")
    .sort(byCompletionTime("sparkedAt"))
    .slice(0, 8);
  const collectionIdeas = ideas
    .filter((idea) => idea.status === "bloom" || idea.status === "spark")
    .sort((a, b) => {
      const aCompleted = a.status === "spark" ? a.sparkedAt : a.bloomedAt;
      const bCompleted = b.status === "spark" ? b.sparkedAt : b.bloomedAt;
      return Date.parse(bCompleted ?? b.updatedAt) - Date.parse(aCompleted ?? a.updatedAt);
    });
  const visibleIdeas =
    view === "garden" ? [...gardenPlants, ...gardenSparks] : workspaceIdeas;
  const toggleGardenDisplay = (idea: Idea) => {
    if (
      gardenDisplayMode !== "custom" ||
      idea.status !== "bloom" ||
      idea.evergreen
    ) return;
    const assigned = new Map(
      manualGardenPlants.map((item) => [item.id, item.gardenSlot ?? 0]),
    );
    if (assigned.has(idea.id)) {
      updateIdea(idea.id, { gardenSlot: 0 });
      return;
    }
    const used = new Set(assigned.values());
    const slot = Array.from({ length: 10 }, (_, index) => index + 1).find(
      (candidate) => !used.has(candidate),
    );
    if (slot) updateIdea(idea.id, { gardenSlot: slot });
  };
  const openCollectionIdea = (id: number) => {
    setCollectionOpen(false);
    setView("garden");
    openIdea(id);
  };
  const selectedIdea =
    selectedIdeaId === null
      ? null
      : ideas.find((idea) => idea.id === selectedIdeaId) ?? null;

  return (
    <main className="idea-shell">
      <div className="flow-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <header className="topbar">
        <div className="brand">
          <h1>Idea Workspace</h1>
        </div>
        <nav className="view-tabs" aria-label="Views">
          <button
            type="button"
            className={view === "incubator" ? "active" : ""}
            aria-pressed={view === "incubator"}
            onClick={() => setView("incubator")}
          >
            All Ideas
          </button>
          <button
            type="button"
            className={view === "garden" ? "active" : ""}
            aria-pressed={view === "garden"}
            onClick={() => setView("garden")}
          >
            Garden
          </button>
        </nav>
        <div className="top-actions">
          <span className="save-announcer" role="status" aria-live="polite">
            {saveFailedIds.size > 0
              ? "Save paused. Your changes are kept and will retry when you edit again."
              : savingIds.size > 0
                ? "Saving…"
                : ""}
          </span>
          {saveFailedIds.size > 0 && (
            <span className="save-state save-error" aria-hidden="true">
              Save paused
            </span>
          )}
          {savingIds.size > 0 && saveFailedIds.size === 0 && (
            <span className="save-state" aria-hidden="true">Saving…</span>
          )}
          <span className="save-state local-state" aria-live="polite">
            Stored on this device
          </span>
          <button type="button" className="data-button" onClick={exportGarden} title="Export garden as JSON">
            <Download size={15} aria-hidden="true" /> <span>Export</span>
          </button>
          <button type="button" className="data-button" onClick={() => importInputRef.current?.click()} title="Import garden JSON">
            <Upload size={15} aria-hidden="true" /> <span>Import</span>
          </button>
          <input
            ref={importInputRef}
            className="import-input"
            type="file"
            accept="application/json,.json"
            aria-label="Import Idea Garden JSON"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importGarden(file);
              event.target.value = "";
            }}
          />
          {view === "incubator" && embedKey && !accessDenied && (
            <button
              type="button"
              className="new-button"
              onClick={createIdea}
              disabled={creatingIdea}
              aria-busy={creatingIdea}
            >
              <span>＋</span> New Idea
            </button>
          )}
        </div>
      </header>

      <section
        ref={streamRef}
        className={`card-stream ${view === "garden" ? "garden-stream" : ""}`}
        aria-live="polite"
      >
        {view === "incubator" && embedKey && !accessDenied && (
          <div
            ref={toolsRef}
            className={`idea-tools ${activeTool ? "is-open" : ""}`}
          >
            <div className="collection-heading">
              <strong>{query || hasActiveFilters ? "Filtered Ideas" : "All Ideas"}</strong>
            </div>
            {activeTool === "search" && (
              <div className="tool-panel">
                <label className="search-field">
                  <Search size={15} strokeWidth={1.8} aria-hidden="true" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={query}
                    placeholder="Search ideas"
                    aria-label="Search ideas"
                    autoFocus
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      className="search-clear"
                      aria-label="Clear search"
                      title="Clear search"
                      onClick={() => {
                        setQuery("");
                        window.requestAnimationFrame(() => searchInputRef.current?.focus());
                      }}
                    >
                      <X size={14} strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  )}
                </label>
              </div>
            )}
            {activeTool === "sort" && (
              <div className="tool-panel sort-panel">
                <label className="sort-field">
                  <span>Sort</span>
                  <select
                    value={sortField}
                    aria-label="Sort ideas"
                    autoFocus
                    onChange={(event) =>
                      setSortField(event.target.value as SortField)
                    }
                  >
                    <option value="updated">Updated</option>
                    <option value="created">Created</option>
                    <option value="category">Category</option>
                    <option value="status">Status</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="sort-direction"
                  aria-label={
                    sortDirection === "asc"
                      ? "Ascending; switch to descending"
                      : "Descending; switch to ascending"
                  }
                  title={sortDirection === "asc" ? "Ascending" : "Descending"}
                  onClick={() =>
                    setSortDirection((current) =>
                      current === "asc" ? "desc" : "asc",
                    )
                  }
                >
                  {sortDirection === "asc" ? (
                    <ArrowUp size={16} strokeWidth={1.8} aria-hidden="true" />
                  ) : (
                    <ArrowDown size={16} strokeWidth={1.8} aria-hidden="true" />
                  )}
                </button>
                {hasCustomSort && (
                  <button type="button" className="sort-clear" onClick={resetSort}>
                    Reset sort
                  </button>
                )}
              </div>
            )}
            {activeTool === "filter" && (
              <div className="tool-panel filter-panel">
                <div className="filter-groups">
                  <fieldset className="filter-group">
                    <legend>Category</legend>
                    <div className="filter-options">
                      {categories.map((category) => (
                        <label key={category}>
                          <input
                            type="checkbox"
                            checked={filterCategories.has(category)}
                            onChange={() =>
                              setFilterCategories((current) => {
                                const next = new Set(current);
                                if (next.has(category)) next.delete(category);
                                else next.add(category);
                                return next;
                              })
                            }
                          />
                          <span>{category}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="filter-group">
                    <legend>Status</legend>
                    <div className="filter-options">
                      {filterStatusesInOrder.map((status) => (
                        <label key={status}>
                          <input
                            type="checkbox"
                            checked={filterStatuses.has(status)}
                            onChange={() =>
                              setFilterStatuses((current) => {
                                const next = new Set(current);
                                if (next.has(status)) next.delete(status);
                                else next.add(status);
                                return next;
                              })
                            }
                          />
                          <span>{statusLabels[status]}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="filter-group">
                    <legend>Property</legend>
                    <div className="filter-options">
                      <label>
                        <input
                          type="checkbox"
                          checked={filterEvergreen}
                          onChange={(event) =>
                            setFilterEvergreen(event.target.checked)
                          }
                        />
                        <span>
                          <Leaf size={10} strokeWidth={1.8} aria-hidden="true" />
                          Evergreen
                        </span>
                      </label>
                    </div>
                  </fieldset>
                </div>
                <div className="filter-actions">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="filter-clear"
                      onClick={() => {
                        clearFilters();
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="tool-icons">
              <button
                type="button"
                className={`tool-icon ${activeTool === "search" ? "active" : ""}`}
                aria-label="Search ideas"
                aria-pressed={activeTool === "search"}
                aria-expanded={activeTool === "search"}
                title="Search"
                onClick={() =>
                  setActiveTool((current) =>
                    current === "search" ? null : "search",
                  )
                }
              >
                <Search size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`tool-icon ${
                  activeTool === "filter" || hasActiveFilters ? "active" : ""
                }`}
                aria-label="Filter ideas"
                aria-pressed={activeTool === "filter"}
                aria-expanded={activeTool === "filter"}
                title="Filter"
                onClick={() =>
                  setActiveTool((current) =>
                    current === "filter" ? null : "filter",
                  )
                }
              >
                <ListFilter size={16} strokeWidth={1.8} aria-hidden="true" />
                {appliedFilterCount > 0 && (
                  <span className="tool-badge" aria-label={`${appliedFilterCount} filters applied`}>
                    {appliedFilterCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`tool-icon ${
                  activeTool === "sort" ||
                  hasCustomSort
                    ? "active"
                    : ""
                }`}
                aria-label="Sort ideas"
                aria-pressed={activeTool === "sort"}
                aria-expanded={activeTool === "sort"}
                title="Sort"
                onClick={() =>
                  setActiveTool((current) =>
                    current === "sort" ? null : "sort",
                  )
                }
              >
                <ArrowUpDown size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`tool-icon trash-toggle ${
                  activeTool === "trash" ? "active" : ""
                }`}
                aria-label="Open trash"
                aria-pressed={activeTool === "trash"}
                title="Trash"
                onClick={() =>
                  setActiveTool((current) =>
                    current === "trash" ? null : "trash",
                  )
                }
              >
                <Trash2 size={15} strokeWidth={1.7} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {view === "incubator" && embedKey && !accessDenied && hasModifiedView && (
          <div className="applied-controls" aria-label="Applied view controls">
            <span className="applied-controls-label">Showing</span>
            {query && (
              <button
                type="button"
                className="applied-chip"
                onClick={() => setQuery("")}
                aria-label={`Clear search: ${query}`}
              >
                Search: {query} <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            {Array.from(filterCategories).map((category) => (
              <button
                key={`category-${category}`}
                type="button"
                className="applied-chip"
                onClick={() =>
                  setFilterCategories((current) => {
                    const next = new Set(current);
                    next.delete(category);
                    return next;
                  })
                }
                aria-label={`Remove category filter: ${category}`}
              >
                {category} <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ))}
            {Array.from(filterStatuses).map((status) => (
              <button
                key={`status-${status}`}
                type="button"
                className="applied-chip"
                onClick={() =>
                  setFilterStatuses((current) => {
                    const next = new Set(current);
                    next.delete(status);
                    return next;
                  })
                }
                aria-label={`Remove status filter: ${statusLabels[status]}`}
              >
                {statusLabels[status]} <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            ))}
            {filterEvergreen && (
              <button
                type="button"
                className="applied-chip"
                onClick={() => setFilterEvergreen(false)}
                aria-label="Remove Evergreen filter"
              >
                Evergreen <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            {hasCustomSort && (
              <button
                type="button"
                className="applied-chip"
                onClick={resetSort}
                aria-label={`Reset sort: ${sortLabel}, ${sortDirection === "asc" ? "ascending" : "descending"}`}
              >
                Sort: {sortLabel} {sortDirection === "asc" ? "↑" : "↓"}
                <X size={12} strokeWidth={1.8} aria-hidden="true" />
              </button>
            )}
            {hasActiveFilters && (
              <button type="button" className="clear-filters-button" onClick={clearFilters}>
                Clear filters
              </button>
            )}
            <button type="button" className="reset-view-button" onClick={resetView}>
              Reset view
            </button>
          </div>
        )}
        {accessDenied || (!loading && embedKey === null) ? (
          <div className="empty-state access-state">
            <GrowthMark status="seed" />
            <strong>Private Garden</strong>
            <span>Open this page with its private Notion link.</span>
          </div>
        ) : loading ? (
          <div className="empty-state">Loading…</div>
        ) : visibleIdeas.length === 0 &&
          view === "incubator" &&
          (query || hasActiveFilters) ? (
          <div className="empty-state search-empty">
            <strong>No Matching Ideas</strong>
            <span>Adjust your search or filters.</span>
            <button type="button" className="reset-view-button empty-reset" onClick={resetView}>
              Reset view
            </button>
          </div>
        ) : visibleIdeas.length === 0 && view === "incubator" ? (
          <button
            className="empty-state empty-action"
            onClick={createIdea}
            disabled={creatingIdea}
            aria-busy={creatingIdea}
          >
            <GrowthMark status="sprout" />
            <strong>No Ideas Yet</strong>
            <span>Add Your First Idea</span>
          </button>
        ) : visibleIdeas.length === 0 ? (
          <div className="empty-state garden-empty">
            <GrowthMark status="bloom" />
            <strong>Nothing Has Completed Yet</strong>
            <span>Bloomed ideas and Sparks will appear here.</span>
          </div>
        ) : view === "garden" ? (
          <div className="garden-plot">
            {gardenPlants.map((idea) => (
              <GardenFlower
                key={idea.id}
                idea={idea}
                onOpen={openIdea}
              />
            ))}
            {gardenSparks.length > 0 && (
              <div className="garden-sparks" aria-label="Recent quick completed ideas">
                {gardenSparks.map((idea) => (
                  <GardenSpark key={idea.id} idea={idea} onOpen={openIdea} />
                ))}
              </div>
            )}
            <button
              type="button"
              className="collection-book-button"
              onClick={() => setCollectionOpen(true)}
              aria-label="Open idea collection"
              title="Idea collection"
            >
              <BookOpen size={19} strokeWidth={1.7} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            {visibleIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                categoryOptions={categories}
                onChange={updateIdea}
                onTrash={moveToTrash}
                onOpen={openIdea}
              />
            ))}
            {!query && !hasActiveFilters && (
              <button
                type="button"
                className="quick-add-button"
                aria-label="Create a new idea"
                title="New idea"
                onClick={createIdea}
                disabled={creatingIdea}
                aria-busy={creatingIdea}
              >
                <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
                <span>Add idea</span>
              </button>
            )}
          </>
        )}
      </section>
      {collectionOpen && (
        <div
          className="collection-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCollectionOpen(false);
          }}
        >
          <aside className="collection-book" role="dialog" aria-modal="true" aria-label="Idea collection">
            <header className="collection-book-header">
              <div>
                <p className="eyebrow">IDEA COLLECTION</p>
                <h2>Completed Ideas</h2>
              </div>
              <button
                type="button"
                className="detail-close"
                onClick={() => setCollectionOpen(false)}
                aria-label="Close idea collection"
              >
                <X size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </header>
            <p className="collection-intro">
              The garden displays up to 10 plants and recent Sparks. Find all completed ideas here.
            </p>
            <div className="collection-mode-control">
              <span className="collection-mode-label">Garden Display</span>
              <div
                className="collection-mode-options"
                role="group"
                aria-label="Garden display mode"
              >
                <button
                  type="button"
                  className={gardenDisplayMode === "latest" ? "is-active" : ""}
                  aria-pressed={gardenDisplayMode === "latest"}
                  onClick={() => changeGardenDisplayMode("latest")}
                >
                  Latest blooms
                </button>
                <button
                  type="button"
                  className={gardenDisplayMode === "custom" ? "is-active" : ""}
                  aria-pressed={gardenDisplayMode === "custom"}
                  onClick={() => changeGardenDisplayMode("custom")}
                >
                  Custom selection
                </button>
              </div>
            </div>
            <div className="collection-book-scroll">
              <p className="collection-section-label">PLANTS</p>
              <div className="collection-grid">
                {collectionIdeas
                  .filter((idea) => idea.status === "bloom")
                  .map((idea) => (
                    <CollectionCard
                      key={idea.id}
                      idea={idea}
                      displayed={gardenPlants.some((item) => item.id === idea.id)}
                      gardenFull={gardenDisplayMode === "custom" && gardenPlants.length >= 10}
                      customMode={gardenDisplayMode === "custom"}
                      onOpen={openCollectionIdea}
                      onToggleDisplay={toggleGardenDisplay}
                    />
                  ))}
              </div>
              <section className="collection-spark-section" aria-label="Collected Sparks">
                <p className="collection-section-label">SPARKS</p>
                <div className="collection-spark-field">
                  {collectionIdeas
                    .filter((idea) => idea.status === "spark")
                    .map((idea) => (
                      <GardenSpark
                        key={idea.id}
                        idea={idea}
                        onOpen={openCollectionIdea}
                        compact
                      />
                    ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
      {view === "incubator" && activeTool === "trash" && (
        <aside className="trash-panel" aria-label="Trash">
          <button
            className="detail-close"
            type="button"
            aria-label="Close trash"
            onClick={() => setActiveTool(null)}
          >
            ×
          </button>
          <p className="trash-kicker">TRASH</p>
          <h2>Recently Deleted</h2>
          {trashedIdeas.length > 0 && (
            <div className="trash-batch-bar">
              <label>
                <input
                  type="checkbox"
                  checked={allTrashSelected}
                  onChange={(event) =>
                    setSelectedTrashIds(
                      event.target.checked
                        ? new Set(trashedIdeas.map((idea) => idea.id))
                        : new Set(),
                    )
                  }
                />
                Select all
              </label>
              {selectedTrashCount > 0 &&
                (confirmingBatchDelete ? (
                  <div className="batch-confirm">
                    <span>
                      Permanently delete {selectedTrashCount}{" "}
                      {selectedTrashCount === 1 ? "idea" : "ideas"}?
                    </span>
                    <button
                      type="button"
                      className="batch-delete-confirm"
                      disabled={batchDeleting}
                      onClick={permanentlyDeleteSelected}
                    >
                      {batchDeleting ? "Deleting…" : "Delete"}
                    </button>
                    <button
                      type="button"
                      disabled={batchDeleting}
                      onClick={() => setConfirmingBatchDelete(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="batch-delete"
                    disabled={deletingId !== null}
                    onClick={() => setConfirmingBatchDelete(true)}
                  >
                    Delete selected
                  </button>
                ))}
            </div>
          )}
          {trashError && (
            <p className="trash-error" role="alert">
              {trashError}
            </p>
          )}
          {trashedIdeas.length === 0 ? (
            <p className="trash-empty">Trash Is Empty.</p>
          ) : (
            <div className="trash-list">
              {trashedIdeas.map((idea) => (
                <article className="trash-item" key={idea.id}>
                  <label className="trash-select">
                    <input
                      type="checkbox"
                      checked={selectedTrashIds.has(idea.id)}
                      disabled={batchDeleting}
                      aria-label={`Select ${idea.title || "untitled idea"}`}
                      onChange={(event) =>
                        setSelectedTrashIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(idea.id);
                          else next.delete(idea.id);
                          return next;
                        })
                      }
                    />
                    <span>
                      <small>{idea.category || "Uncategorized"}</small>
                      <strong>{idea.title || "Untitled idea"}</strong>
                    </span>
                  </label>
                  <div className="trash-actions">
                    <button
                      type="button"
                      disabled={deletingId !== null || batchDeleting}
                      onClick={() => restoreIdea(idea.id)}
                    >
                      {deletingId === idea.id &&
                      confirmingDeleteId !== idea.id
                        ? "Restoring…"
                        : "Restore"}
                    </button>
                    {confirmingDeleteId === idea.id ? (
                      <>
                        <span className="delete-confirm-copy">
                          Permanently delete this idea?
                        </span>
                        <button
                          type="button"
                          className="delete-forever confirm-delete"
                          disabled={deletingId !== null || batchDeleting}
                          onClick={() => permanentlyDeleteIdea(idea.id)}
                        >
                          {deletingId === idea.id ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId !== null || batchDeleting}
                          onClick={() => {
                            setTrashError(null);
                            setConfirmingDeleteId(null);
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="delete-forever"
                        disabled={deletingId !== null || batchDeleting}
                        onClick={() => {
                          setTrashError(null);
                          setConfirmingDeleteId(idea.id);
                        }}
                      >
                        Delete forever
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      )}
      {view === "garden" && selectedIdea && (
        <GardenDetail
          idea={selectedIdea}
          onClose={closeIdea}
          onChange={updateIdea}
        />
      )}
      {view === "incubator" && selectedIdea && (
          <IdeaDetail
            idea={selectedIdea}
            categoryOptions={categories}
          onClose={closeIdea}
          onChange={updateIdea}
        />
      )}
    </main>
  );
}
