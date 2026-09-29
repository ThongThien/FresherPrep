"use client";

import { useMemo } from "react";

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
}: {
  nodes: KnowledgeNode[];
  query?: string;
  mode: "manage" | "lesson";
  selectedId?: string;
  creatingUnderId?: string;
  onSelect?: (node: KnowledgeNode) => void;
  onAddChild?: (parent: KnowledgeNode, type: KnowledgeNodeType) => void;
  onAddLesson?: (subtopic: KnowledgeNode) => void;
}) {
  const { t } = useI18n();
  const flattened = useMemo(() => flattenKnowledgeTree(nodes), [nodes]);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = flattened.filter(({ node }) =>
    `${node.name} ${node.slug} ${node.type}`.toLowerCase().includes(normalizedQuery),
  );

  if (!visible.length) {
    return <p className="py-8 text-center text-sm text-text-muted">{t("No matching knowledge nodes.")}</p>;
  }

  return (
    <ul className="max-h-[50vh] space-y-1 overflow-y-auto overscroll-contain pr-1 sm:max-h-[32rem]" aria-label={t("Knowledge hierarchy")}>
      {visible.map(({ node, depth }) => {
        const nextType = childType[node.type];
        const canAdd = mode === "manage" ? Boolean(nextType) : node.type === "SUBTOPIC";
        const actionLabel = mode === "manage" && nextType
          ? t("Add {{type}} under {{name}}", { type: t(nextType).toLowerCase(), name: node.name })
          : t("Add lesson to {{name}}", { name: node.name });
        const selected = selectedId === node.id || creatingUnderId === node.id;

        return (
          <li key={node.id}>
            <div
              className={`group flex min-h-12 items-center gap-1 rounded-md border pr-1 transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-within:border-primary/30 focus-within:bg-primary-subtle ${selected ? "border-primary/40 bg-primary-subtle" : "border-transparent"}`}
              style={{ paddingLeft: `${8 + depth * 18}px` }}
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-sm px-1 py-2 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
                onClick={() => onSelect?.(node)}
                aria-current={selectedId === node.id ? "true" : undefined}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text">{node.name}</span>
                  <span className="block truncate text-xs text-text-muted">{t(node.type)} · {node.slug} · {t("order {{order}}", { order: node.displayOrder })}</span>
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
    </ul>
  );
}

export function flattenKnowledgeTree(nodes: KnowledgeNode[]) {
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
      visit(node.id, depth + 1);
    }
  }
  visit(null, 0);
  nodes.filter((node) => !seen.has(node.id)).forEach((node) => result.push({ node, depth: 0 }));
  return result;
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
