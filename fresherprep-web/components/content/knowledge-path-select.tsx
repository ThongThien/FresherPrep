"use client";

import { useMemo, useState } from "react";

import { Label, Select } from "@/components/ui";
import type { KnowledgeNode } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

type Level = "TECHNOLOGY" | "CATEGORY" | "TOPIC" | "SUBTOPIC";
const levels: Level[] = ["TECHNOLOGY", "CATEGORY", "TOPIC", "SUBTOPIC"];

export function KnowledgePathSelect({
  nodes,
  value,
  onChange,
  disabled,
  idPrefix = "knowledge",
}: {
  nodes: KnowledgeNode[];
  value: string;
  onChange: (subtopicId: string) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const { t } = useI18n();
  const byId = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const pathFromValue = useMemo(() => {
    const path: Partial<Record<Level, string>> = {};
    for (let node = byId.get(value); node; node = node.parentId ? byId.get(node.parentId) : undefined) {
      path[node.type as Level] = node.id;
    }
    return path;
  }, [byId, value]);
  const [draft, setDraft] = useState<Partial<Record<Level, string>>>({});
  const selected = value ? pathFromValue : draft;

  function optionsFor(level: Level) {
    const index = levels.indexOf(level);
    const parentId = index === 0 ? null : selected[levels[index - 1]];
    return nodes
      .filter((node) => node.type === level && (index === 0 ? !node.parentId : node.parentId === parentId))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
  }

  function select(level: Level, id: string) {
    const index = levels.indexOf(level);
    const next = { ...selected, [level]: id || undefined };
    levels.slice(index + 1).forEach((child) => delete next[child]);
    setDraft(next);
    onChange(level === "SUBTOPIC" ? id : "");
  }

  return (
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">{t("Knowledge path")}</legend>
      {levels.map((level, index) => {
        const options = optionsFor(level);
        const parentSelected = index === 0 || Boolean(selected[levels[index - 1]]);
        return (
          <div key={level}>
            <Label htmlFor={`${idPrefix}-${level.toLowerCase()}`}>{t(level)}</Label>
            <Select
              id={`${idPrefix}-${level.toLowerCase()}`}
              value={selected[level] ?? ""}
              disabled={disabled || !parentSelected}
              onChange={(event) => select(level, event.target.value)}
            >
              <option value="">{t("Select {{level}}", { level: t(level).toLowerCase() })}</option>
              {options.map((node) => <option key={node.id} value={node.id}>{node.name} ({t(node.status)})</option>)}
            </Select>
          </div>
        );
      })}
    </fieldset>
  );
}

export function knowledgePathLabel(nodes: KnowledgeNode[], nodeId: string) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const names: string[] = [];
  for (let node = byId.get(nodeId); node; node = node.parentId ? byId.get(node.parentId) : undefined) {
    names.unshift(node.name);
  }
  return names.join(" → ");
}
