"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import type { ContentStatus, KnowledgeNode, KnowledgeNodeType, LessonSummary } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

const childType: Partial<Record<KnowledgeNodeType, KnowledgeNodeType>> = {
  TECHNOLOGY: "CATEGORY",
  CATEGORY: "TOPIC",
  TOPIC: "SUBTOPIC",
};

export function KnowledgeTree({
  nodes,
  query = "",
  mode,
  selectedId,
  creatingUnderId,
  onSelect,
  onAddChild,
  onAddLesson,
  onRefresh,
  refreshing = false,
  lessons = [],
  onSelectLesson,
}: {
  nodes: KnowledgeNode[];
  query?: string;
  mode: "manage" | "lesson";
  selectedId?: string;
  creatingUnderId?: string;
  onSelect?: (node: KnowledgeNode) => void;
  onAddChild?: (parent: KnowledgeNode, type: KnowledgeNodeType) => void;
  onAddLesson?: (subtopic: KnowledgeNode) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  lessons?: LessonSummary[];
  onSelectLesson?: (lesson: LessonSummary) => void;
}) {
  const { t } = useI18n();
  const [toggledIds, setToggledIds] = useState<Set<string>>(() => new Set());
  const normalizedQuery = query.trim().toLowerCase();
  const childCounts = useMemo(() => {
    const counts = new Map<string, number>();
    nodes.forEach((node) => {
      if (node.parentId) counts.set(node.parentId, (counts.get(node.parentId) ?? 0) + 1);
    });
    return counts;
  }, [nodes]);
  const lessonsBySubtopic = useMemo(() => {
    const grouped = new Map<string, LessonSummary[]>();
    lessons.forEach((lesson) => {
      const items = grouped.get(lesson.subtopicId) ?? [];
      items.push(lesson);
      grouped.set(lesson.subtopicId, items);
    });
    grouped.forEach((items) => items.sort((a, b) => a.displayOrder - b.displayOrder || a.title.localeCompare(b.title)));
    return grouped;
  }, [lessons]);
  const expandedIds = useMemo(
    () =>
      new Set(
        nodes
          .filter((node) => {
            const hasChildren =
              childCounts.has(node.id) ||
              (lessonsBySubtopic.get(node.id)?.length ?? 0) > 0;
            return hasChildren && toggledIds.has(node.id);
          })
          .map((node) => node.id),
      ),
    [childCounts, lessonsBySubtopic, nodes, toggledIds],
  );
  const flattened = useMemo(
    () => flattenKnowledgeTree(nodes, normalizedQuery ? undefined : expandedIds),
    [expandedIds, nodes, normalizedQuery],
  );
  const visible = flattened.filter(({ node }) =>
    `${node.name} ${node.slug} ${node.type}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label={t("Knowledge type colors")}>
          {(["TECHNOLOGY", "CATEGORY", "TOPIC", "SUBTOPIC"] as KnowledgeNodeType[]).map((type) => <span className="inline-flex items-center gap-1.5 text-xs text-text-muted" key={type}><span className={`size-2.5 rounded-full ${typeDotClass[type]}`} aria-hidden="true" />{t(type)}</span>)}
        </div>
      {onRefresh ? <div className="ml-auto">
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-primary-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 disabled:cursor-wait disabled:opacity-60"
          aria-label={t("Refresh knowledge tree")}
          title={t("Refresh knowledge tree")}
          disabled={refreshing}
          onClick={onRefresh}
        >
          <RefreshIcon spinning={refreshing} />
        </button>
      </div> : null}
      </div>
      {!visible.length ? <p className="py-8 text-center text-sm text-text-muted">{t("No matching knowledge nodes.")}</p> : <ul className="max-h-[70vh] space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[calc(100vh-14rem)]" aria-label={t("Knowledge hierarchy")}>
      {visible.map(({ node, depth }) => {
        const nextType = childType[node.type];
        const canAdd = mode === "manage" ? Boolean(nextType) : node.type === "SUBTOPIC";
        const actionLabel = mode === "manage" && nextType
          ? t("Add {{type}} under {{name}}", { type: t(nextType).toLowerCase(), name: node.name })
          : t("Add lesson to {{name}}", { name: node.name });
        const selected = selectedId === node.id || creatingUnderId === node.id;
        const nodeLessons = lessonsBySubtopic.get(node.id) ?? [];
        const hasChildren = childCounts.has(node.id) || nodeLessons.length > 0;
        const expanded = hasChildren && expandedIds.has(node.id);

        return (
          <li key={node.id}>
            <div
              className={`group flex min-h-12 items-center gap-1 rounded-md border pr-1 transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-within:border-primary/30 focus-within:bg-primary-subtle ${selected ? "border-primary/40 bg-primary-subtle" : "border-transparent"}`}
              style={{ paddingLeft: `${8 + depth * 18}px` }}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
                onClick={() => {
                  onSelect?.(node);
                  if (hasChildren && !normalizedQuery) {
                    setToggledIds((current) => {
                      const next = new Set(current);
                      if (next.has(node.id)) next.delete(node.id);
                      else next.add(node.id);
                      return next;
                    });
                  }
                }}
                aria-current={selectedId === node.id ? "true" : undefined}
                aria-expanded={hasChildren ? expanded : undefined}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {hasChildren ? <ChevronIcon expanded={expanded} /> : <span className="size-4 shrink-0" aria-hidden="true" />}
                  <FolderIcon open={expanded} leaf={!hasChildren} type={node.type} />
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-center gap-2"><span className="truncate text-sm font-semibold text-text">{node.name}</span>{node.type === "SUBTOPIC" && onSelectLesson ? <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-text-muted">{t("{{count}} lessons", { count: nodeLessons.length })}</span> : null}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-text-muted"><TypeBadge type={node.type} />{node.slug} · {t("order {{order}}", { order: node.displayOrder })}</span>
                  </span>
                </span>
                <StatusBadge status={node.status} />
              </button>
              {canAdd ? (
                <button
                  type="button"
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-text-muted opacity-100 transition-[color,background-color,opacity] hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  aria-label={actionLabel}
                  title={actionLabel}
                  onClick={() => {
                    if (mode === "manage" && nextType) onAddChild?.(node, nextType);
                    if (mode === "lesson" && node.type === "SUBTOPIC") onAddLesson?.(node);
                  }}
                >
                  <PlusIcon />
                </button>
              ) : null}
            </div>
            {expanded && nodeLessons.length ? <ul className="ml-8 mt-1 space-y-1 border-l border-border pl-3">{nodeLessons.map((lesson) => <li key={lesson.id}><button type="button" className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20" onClick={() => onSelectLesson?.(lesson)}><span className="min-w-0 truncate text-sm font-medium text-text">{lesson.title}</span><StatusBadge status={lesson.status} /></button></li>)}</ul> : null}
          </li>
        );
      })}
      </ul>}
    </div>
  );
}

export function flattenKnowledgeTree(nodes: KnowledgeNode[], expandedIds?: ReadonlySet<string>) {
  const byParent = new Map<string | null, KnowledgeNode[]>();
  nodes.forEach((node) => {
    const list = byParent.get(node.parentId) ?? [];
    list.push(node);
    byParent.set(node.parentId, list);
  });
  byParent.forEach((list) => list.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)));

  const result: { node: KnowledgeNode; depth: number }[] = [];
  const seen = new Set<string>();
  function visit(parentId: string | null, depth: number) {
    for (const node of byParent.get(parentId) ?? []) {
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      result.push({ node, depth });
      if (!expandedIds || expandedIds.has(node.id)) visit(node.id, depth + 1);
    }
  }
  visit(null, 0);
  const nodeIds = new Set(nodes.map((node) => node.id));
  nodes
    .filter((node) => !seen.has(node.id) && (!node.parentId || !nodeIds.has(node.parentId)))
    .forEach((node) => result.push({ node, depth: 0 }));
  return result;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${expanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m7 4 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const typeDotClass: Record<KnowledgeNodeType, string> = {
  TECHNOLOGY: "bg-blue-500",
  CATEGORY: "bg-violet-500",
  TOPIC: "bg-amber-500",
  SUBTOPIC: "bg-emerald-500",
};
const typeTextClass: Record<KnowledgeNodeType, string> = {
  TECHNOLOGY: "text-blue-500",
  CATEGORY: "text-violet-500",
  TOPIC: "text-amber-500",
  SUBTOPIC: "text-emerald-500",
};

function TypeBadge({ type }: { type: KnowledgeNodeType }) {
  const { t } = useI18n();
  return <span className="inline-flex shrink-0 items-center gap-1"><span className={`size-2 rounded-full ${typeDotClass[type]}`} aria-hidden="true" />{t(type)}</span>;
}

function FolderIcon({ open, leaf, type }: { open: boolean; leaf: boolean; type: KnowledgeNodeType }) {
  if (leaf) {
    return <span className="size-3 shrink-0 rounded-sm border border-text-muted/60 bg-surface-muted" aria-hidden="true" />;
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 shrink-0 ${typeTextClass[type]}`} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d={open ? "M2.5 6.5h15l-2 9h-13z" : "M2.5 5h5l1.5 2h8.5v8.5h-15z"} strokeLinejoin="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: ContentStatus }) {
  const { t } = useI18n();
  return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "ARCHIVED" ? "neutral" : "info"}>{t(status)}</Badge>;
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 4v12M4 10h12" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-4 ${spinning ? "animate-spin motion-reduce:animate-none" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M16 7a6.5 6.5 0 1 0 .2 5.3" strokeLinecap="round" />
      <path d="M16 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
