"use client";

import { useState } from "react";

import { Button, Card, CardContent, Feedback, Input, Label, Select, Textarea } from "@/components/ui";
import type { Difficulty, KnowledgeNode, QuestionCategory, QuestionLanguage } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";
import { KnowledgePathSelect, knowledgePathLabel } from "./knowledge-path-select";

type OptionDraft = { position: number; content: string; correct: boolean; explanation: string };
export type BatchQuestionDraft = {
  difficulty: Difficulty;
  content: string;
  explanation: string;
  options: OptionDraft[];
};
export type BatchQuestionPayload = {
  subtopicId: string;
  language: QuestionLanguage;
  category: QuestionCategory;
  questions: BatchQuestionDraft[];
};

const blankQuestion = (): BatchQuestionDraft => ({
  difficulty: "EASY",
  content: "",
  explanation: "",
  options: [1, 2, 3, 4].map((position) => ({
    position, content: "", correct: position === 1, explanation: "",
  })),
});

export function QuestionBatchEditor({
  nodes,
  pending,
  onSubmit,
}: {
  nodes: KnowledgeNode[];
  pending: boolean;
  onSubmit: (payload: BatchQuestionPayload) => Promise<void>;
}) {
  const { t } = useI18n();
  const [subtopicId, setSubtopicId] = useState("");
  const [language, setLanguage] = useState<QuestionLanguage>("VI");
  const [category, setCategory] = useState<QuestionCategory>("TECHNICAL");
  const [questions, setQuestions] = useState<BatchQuestionDraft[]>([blankQuestion()]);
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string>();

  function update(index: number, next: BatchQuestionDraft) {
    setQuestions((current) => current.map((item, itemIndex) => itemIndex === index ? next : item));
  }

  function importQuestions() {
    try {
      const parsed = parseImport(importText);
      if (!parsed.length) throw new Error(t("No valid questions found in import data."));
      setQuestions(parsed);
      setPreview(true);
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Import data is invalid."));
    }
  }

  async function submit() {
    const validation = validate(questions, subtopicId, t);
    if (validation) { setError(validation); return; }
    setError(undefined);
    try {
      await onSubmit({ subtopicId, language, category, questions });
      setQuestions([blankQuestion()]);
      setImportText("");
      setPreview(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("The request could not be completed."));
    }
  }

  return (
    <Card>
      <CardContent>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-semibold text-text">{t("Create questions in batch")}</h2><p className="mt-1 text-sm text-text-muted">{t("All questions are saved together. If one is invalid, none are created.")}</p></div>
          <Button variant="secondary" onClick={() => setPreview((value) => !value)}>{preview ? t("Edit") : t("Preview")}</Button>
        </div>
        {error ? <Feedback className="mt-4" tone="error" title={t("Check question data")}>{error}</Feedback> : null}
        <div className="mt-5"><KnowledgePathSelect nodes={nodes} value={subtopicId} onChange={setSubtopicId} idPrefix="batch-question" /></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="batch-language">{t("Language")}</Label><Select id="batch-language" value={language} onChange={(event) => setLanguage(event.target.value as QuestionLanguage)}><option value="VI">VI</option><option value="EN">EN</option></Select></div>
          <div><Label htmlFor="batch-category">{t("Category")}</Label><Select id="batch-category" value={category} onChange={(event) => setCategory(event.target.value as QuestionCategory)}>{["TECHNICAL", "GRAMMAR", "VOCABULARY", "TOEIC"].map((item) => <option key={item}>{item}</option>)}</Select></div>
        </div>

        <details className="mt-5 rounded-md border border-border p-4">
          <summary className="cursor-pointer font-medium text-text">{t("Import CSV or JSON")}</summary>
          <p className="mt-2 text-xs leading-5 text-text-muted">{t("CSV columns: question, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty. Correct answer is A-D.")}</p>
          <Textarea className="mt-3 min-h-32 font-mono text-xs" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={t("Paste CSV or a JSON array here")}/>
          <Button className="mt-3" size="sm" variant="secondary" disabled={!importText.trim()} onClick={importQuestions}>{t("Validate and preview")}</Button>
        </details>

        <div className="mt-6 space-y-5">
          {questions.map((question, index) => preview ? (
            <article key={index} className="rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-text">{index + 1}. {question.content || t("Untitled question")}</h3><span className="text-xs text-text-muted">{question.difficulty}</span></div>
              <ol className="mt-3 space-y-1 text-sm text-text-muted">{question.options.map((option) => <li key={option.position} className={option.correct ? "font-semibold text-success-strong" : ""}>{String.fromCharCode(64 + option.position)}. {option.content}</li>)}</ol>
              <p className="mt-3 text-sm text-text-muted">{question.explanation}</p>
            </article>
          ) : (
            <QuestionEditor key={index} index={index} question={question} onChange={(next) => update(index, next)} onDuplicate={() => setQuestions((current) => [...current.slice(0, index + 1), structuredClone(question), ...current.slice(index + 1)])} onRemove={() => setQuestions((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {!preview ? <Button variant="secondary" onClick={() => setQuestions((current) => [...current, blankQuestion()])}>{t("Add another question")}</Button> : null}
          <Button loading={pending} disabled={!subtopicId || !questions.length} onClick={() => void submit()}>{t("Create {{count}} questions", { count: questions.length })}</Button>
        </div>
        {subtopicId ? <p className="mt-3 text-xs text-text-muted">{knowledgePathLabel(nodes, subtopicId)}</p> : null}
      </CardContent>
    </Card>
  );
}

function QuestionEditor({ index, question, onChange, onDuplicate, onRemove }: { index: number; question: BatchQuestionDraft; onChange: (next: BatchQuestionDraft) => void; onDuplicate: () => void; onRemove: () => void }) {
  const { t } = useI18n();
  return <article className="rounded-md border border-border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-text">{t("Question {{number}}", { number: index + 1 })}</h3><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={onDuplicate}>{t("Duplicate")}</Button><Button size="sm" variant="ghost" onClick={onRemove}>{t("Remove")}</Button></div></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>{t("Difficulty")}</Label><Select value={question.difficulty} onChange={(event) => onChange({ ...question, difficulty: event.target.value as Difficulty })}><option>EASY</option><option>MEDIUM</option><option>HARD</option></Select></div><div className="sm:col-span-2"><Label>{t("Question")}</Label><Textarea value={question.content} onChange={(event) => onChange({ ...question, content: event.target.value })} /></div>{question.options.map((option, optionIndex) => <div key={option.position}><label className="mb-2 flex items-center gap-2 text-sm font-medium text-text"><input type="radio" name={`batch-correct-${index}`} checked={option.correct} onChange={() => onChange({ ...question, options: question.options.map((item, itemIndex) => ({ ...item, correct: itemIndex === optionIndex })) })}/>{t("Option {{position}}", { position: String.fromCharCode(65 + optionIndex) })}</label><Input value={option.content} onChange={(event) => onChange({ ...question, options: question.options.map((item, itemIndex) => itemIndex === optionIndex ? { ...item, content: event.target.value, explanation: item.correct ? question.explanation : item.explanation || "Incorrect option." } : item) })}/></div>)}<div className="sm:col-span-2"><Label>{t("Explanation")}</Label><Textarea value={question.explanation} onChange={(event) => onChange({ ...question, explanation: event.target.value, options: question.options.map((option) => option.correct ? { ...option, explanation: event.target.value } : option) })}/></div></div></article>;
}

function validate(questions: BatchQuestionDraft[], subtopicId: string, t: (key: string, values?: Record<string, string | number>) => string) {
  if (!subtopicId) return t("Select a complete knowledge path.");
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    if (!question.content.trim()) return t("Question {{number}} needs content.", { number: index + 1 });
    if (!question.explanation.trim()) return t("Question {{number}} needs an explanation.", { number: index + 1 });
    if (question.options.some((option) => !option.content.trim())) return t("Question {{number}} needs four answer options.", { number: index + 1 });
    if (question.options.filter((option) => option.correct).length !== 1) return t("Question {{number}} needs exactly one correct answer.", { number: index + 1 });
  }
}

function parseImport(raw: string): BatchQuestionDraft[] {
  const value = raw.trim();
  if (value.startsWith("[")) {
    const data = JSON.parse(value) as unknown;
    if (!Array.isArray(data)) throw new Error("JSON must be an array.");
    return data.map(normalizeImported);
  }
  const rows = value.split(/\r?\n/).filter(Boolean).map(parseCsvRow);
  if (rows[0]?.[0]?.toLowerCase() === "question") rows.shift();
  return rows.map((row) => normalizeImported({ question: row[0], options: row.slice(1, 5), correctAnswer: row[5], explanation: row[6], difficulty: row[7] }));
}

function normalizeImported(input: unknown): BatchQuestionDraft {
  const item = input as { question?: string; content?: string; options?: (string | { content?: string })[]; correctAnswer?: string | number; explanation?: string; difficulty?: string };
  const correct = typeof item.correctAnswer === "number" ? item.correctAnswer : Math.max(1, "ABCD".indexOf(String(item.correctAnswer ?? "A").toUpperCase()) + 1);
  const options = (item.options ?? []).slice(0, 4).map((option, index) => ({ position: index + 1, content: typeof option === "string" ? option : option.content ?? "", correct: index + 1 === correct, explanation: index + 1 === correct ? item.explanation ?? "" : "Incorrect option." }));
  while (options.length < 4) options.push({ position: options.length + 1, content: "", correct: false, explanation: "Incorrect option." });
  return { difficulty: (["EASY", "MEDIUM", "HARD"].includes(item.difficulty ?? "") ? item.difficulty : "EASY") as Difficulty, content: item.question ?? item.content ?? "", explanation: item.explanation ?? "", options };
}

function parseCsvRow(row: string) {
  const values: string[] = []; let current = ""; let quoted = false;
  for (let index = 0; index < row.length; index++) { const char = row[index]; if (char === '"' && row[index + 1] === '"') { current += '"'; index++; } else if (char === '"') quoted = !quoted; else if (char === "," && !quoted) { values.push(current.trim()); current = ""; } else current += char; }
  values.push(current.trim()); return values;
}
