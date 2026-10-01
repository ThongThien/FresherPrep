"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui";
import type { ContentStatus, KnowledgeNode, KnowledgeNodeType } from "@/lib/admin/types";
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
  const expandedIds = useMemo(() => new Set(nodes
    .filter((node) => {
      const expandedByDefault = node.type === "TECHNOLOGY" || node.type === "CATEGORY";
      return childCounts.has(node.id) && (toggledIds.has(node.id) ? !expandedByDefault : expandedByDefault);
    })
    .map((node) => node.id)), [childCounts, nodes, toggledIds]);
  const flattened = useMemo(
    () => flattenKnowledgeTree(nodes, normalizedQuery ? undefined : expandedIds),
    [expandedIds, nodes, normalizedQuery],
  );
  const visible = flattened.filter(({ node }) =>
    `${node.name} ${node.slug} ${node.type}`.toLowerCase().includes(normalizedQuery),
  );

  return (
    <div>
      {onRefresh ? <div className="mb-2 flex justify-end">
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
      {!visible.length ? <p className="py-8 text-center text-sm text-text-muted">{t("No matching knowledge nodes.")}</p> : <ul className="max-h-[50vh] space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[32rem]" aria-label={t("Knowledge hierarchy")}>
      {visible.map(({ node, depth }) => {
        const nextType = childType[node.type];
        const canAdd = mode === "manage" ? Boolean(nextType) : node.type === "SUBTOPIC";
        const actionLabel = mode === "manage" && nextType
          ? t("Add {{type}} under {{name}}", { type: t(nextType).toLowerCase(), name: node.name })
          : t("Add lesson to {{name}}", { name: node.name });
        const selected = selectedId === node.id || creatingUnderId === node.id;
        const hasChildren = childCounts.has(node.id);
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
                  <FolderIcon open={expanded} leaf={!hasChildren} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text">{node.name}</span>
                    <span className="block truncate text-xs text-text-muted">{t(node.type)} · {node.slug} · {t("order {{order}}", { order: node.displayOrder })}</span>
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

function FolderIcon({ open, leaf }: { open: boolean; leaf: boolean }) {
  if (leaf) {
    return <span className="size-3 shrink-0 rounded-sm border border-text-muted/60 bg-surface-muted" aria-hidden="true" />;
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.6">
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
