"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, FieldError, Input, Label, Select } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type {
  AdminPage,
  ContentStatus,
  Difficulty,
  KnowledgeNode,
  Question,
  QuestionLanguage,
  QuizCategory,
  QuizDetail,
  QuizRule,
  QuizSelectionMode,
  QuizType,
} from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

const quizTypes: QuizType[] = ["LESSON", "TOPIC", "MIXED", "READINESS"];
const selectionModes: QuizSelectionMode[] = ["FIXED", "RULE_BASED"];
const quizCategories: QuizCategory[] = ["TECHNICAL", "GRAMMAR", "VOCABULARY", "TOEIC", "MIXED"];
const emptyForm = { code: "", title: "", type: "LESSON" as QuizType, selectionMode: "FIXED" as QuizSelectionMode, passPercentage: 80, language: "VI" as QuestionLanguage, category: "TECHNICAL" as QuizCategory, maximumScore: 100, durationSeconds: null as number | null };

export function QuizManagement() {
  const { t } = useI18n();
  const [quizzes, setQuizzes] = useState<QuizDetail[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [selected, setSelected] = useState<QuizDetail>();
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [validation, setValidation] = useState<Record<string, string>>({});

  const loadLists = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [quizPage, questionPage, knowledge] = await Promise.all([
        adminRequest<AdminPage<QuizDetail>>("quizzes?page=0&size=200&sort=title,asc"),
        adminRequest<AdminPage<Question>>("questions?page=0&size=200&sort=code,asc"),
        adminRequest<KnowledgeNode[]>("knowledge/nodes"),
      ]);
      setQuizzes(quizPage.content);
      setQuestions(questionPage.content);
      setNodes(knowledge);
    } catch (reason) { setError(messageOf(reason)); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLists(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLists]);

  const visible = useMemo(() => quizzes.filter((quiz) =>
    `${quiz.code} ${quiz.title} ${quiz.type} ${quiz.selectionMode} ${quiz.language} ${quiz.category}`.toLowerCase().includes(query.toLowerCase())
      && (!languageFilter || quiz.language === languageFilter)
      && (!categoryFilter || quiz.category === categoryFilter)
      && (!statusFilter || quiz.status === statusFilter),
  ), [quizzes, query, languageFilter, categoryFilter, statusFilter]);

  async function selectQuiz(quizId: string) {
    setError(undefined);
    setSuccess(undefined);
    try {
      const quiz = await adminRequest<QuizDetail>(`quizzes/${quizId}`);
      setSelected(quiz);
      setForm({ code: quiz.code, title: quiz.title, type: quiz.type, selectionMode: quiz.selectionMode, passPercentage: quiz.passPercentage, language: quiz.language, category: quiz.category, maximumScore: quiz.maximumScore, durationSeconds: quiz.durationSeconds });
      setValidation({});
    } catch (reason) { setError(messageOf(reason)); }
  }

  function startCreate() {
    setSelected(undefined);
    setForm(emptyForm);
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
  }

  async function submitQuiz(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.code.trim()) errors.code = "Quiz code is required.";
    if (!form.title.trim()) errors.title = "Quiz title is required.";
    if (form.passPercentage < 0 || form.passPercentage > 100) errors.passPercentage = "Pass percentage must be between 0 and 100.";
    if (form.maximumScore < 1) errors.maximumScore = "Maximum score must be positive.";
    setValidation(errors);
    if (Object.keys(errors).length) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = await adminRequest<QuizDetail>(
        selected ? `quizzes/${selected.id}` : "quizzes",
        { method: selected ? "PUT" : "POST", ...jsonBody({ ...form, code: form.code.trim().toUpperCase(), title: form.title.trim() }) },
      );
      await loadLists();
      await selectQuiz(saved.id);
      setSuccess(selected ? "Quiz updated." : "Quiz created.");
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  async function mutate(path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", message: string, body?: unknown) {
    if (!selected) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest(path, { method, ...(body ? jsonBody(body) : {}) });
      await loadLists();
      await selectQuiz(selected.id);
      setSuccess(message);
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  async function deleteQuiz() {
    if (!selected || !window.confirm("Delete this quiz? Quizzes with attempts or assessment references cannot be deleted.")) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`quizzes/${selected.id}`, { method: "DELETE" });
      startCreate();
      await loadLists();
      setSuccess("Quiz deleted.");
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  return <div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t("Quizzes")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{t("Configure fixed or rule-based quizzes. The backend remains authoritative for question selection.")}</p></div><Button onClick={startCreate}>{t("New quiz")}</Button></header>
    {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
    {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
      <Card><CardContent><Label htmlFor="quiz-search">{t("Search quizzes")}</Label><Input id="quiz-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Code, title, type, or mode")} /><div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><FilterSelect label={t("Language")} value={languageFilter} onChange={setLanguageFilter} options={["VI", "EN"]} /><FilterSelect label={t("Category")} value={categoryFilter} onChange={setCategoryFilter} options={quizCategories} /><FilterSelect label={t("Status")} value={statusFilter} onChange={setStatusFilter} options={["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]} /></div>{loading ? <p className="py-10 text-center text-sm text-text-muted">{t("Loading quizzes...")}</p> : visible.length ? <ul className="mt-5 space-y-2">{visible.map((quiz) => <li key={quiz.id}><button type="button" onClick={() => void selectQuiz(quiz.id)} className={`w-full rounded-md border p-3 text-left hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${selected?.id === quiz.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}><span className="flex items-start justify-between gap-2"><span className="min-w-0"><span className="block truncate font-semibold text-text">{quiz.title}</span><span className="mt-1 block text-xs text-text-muted">{quiz.code} - {quiz.language} - {quiz.category} - {quiz.selectionMode}</span></span><Status status={quiz.status} /></span></button></li>)}</ul> : <p className="py-10 text-center text-sm text-text-muted">{t("No matching quizzes.")}</p>}</CardContent></Card>
      <div className="space-y-6">
        <Card><CardContent><div className="flex justify-between gap-3"><div><h2 className="text-lg font-semibold text-text">{selected ? t("Quiz details") : t("Create quiz")}</h2><p className="mt-1 text-sm text-text-muted">{t("Changing type or mode requires an empty configuration.")}</p></div>{selected ? <Status status={selected.status} /> : null}</div>
          <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submitQuiz}>
            <div><Label htmlFor="quiz-code">{t("Code")}</Label><Input id="quiz-code" maxLength={50} aria-invalid={Boolean(validation.code)} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />{validation.code ? <FieldError>{validation.code}</FieldError> : null}</div>
            <div><Label htmlFor="quiz-title">{t("Title")}</Label><Input id="quiz-title" maxLength={200} aria-invalid={Boolean(validation.title)} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />{validation.title ? <FieldError>{validation.title}</FieldError> : null}</div>
            <div><Label htmlFor="quiz-type">{t("Quiz type")}</Label><Select id="quiz-type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as QuizType }))}>{quizTypes.map((type) => <option key={type} value={type}>{t(type)}</option>)}</Select></div>
            <div><Label htmlFor="quiz-mode">{t("Selection mode")}</Label><Select id="quiz-mode" value={form.selectionMode} onChange={(event) => setForm((current) => ({ ...current, selectionMode: event.target.value as QuizSelectionMode }))}>{selectionModes.map((mode) => <option key={mode} value={mode}>{t(mode)}</option>)}</Select></div>
            <div><Label htmlFor="quiz-language">{t("Language")}</Label><Select id="quiz-language" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as QuestionLanguage }))}><option value="VI">{t("Vietnamese")}</option><option value="EN">{t("English")}</option></Select></div>
            <div><Label htmlFor="quiz-category">{t("Category")}</Label><Select id="quiz-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as QuizCategory }))}>{quizCategories.map((category) => <option key={category} value={category}>{t(category)}</option>)}</Select></div>
            <div><Label htmlFor="quiz-pass">{t("Pass percentage")}</Label><Input id="quiz-pass" type="number" min={0} max={100} aria-invalid={Boolean(validation.passPercentage)} value={form.passPercentage} onChange={(event) => setForm((current) => ({ ...current, passPercentage: Number(event.target.value) }))} />{validation.passPercentage ? <FieldError>{validation.passPercentage}</FieldError> : null}</div>
            <div><Label htmlFor="quiz-maximum-score">{t("Maximum score")}</Label><Input id="quiz-maximum-score" type="number" min={1} aria-invalid={Boolean(validation.maximumScore)} value={form.maximumScore} onChange={(event) => setForm((current) => ({ ...current, maximumScore: Number(event.target.value) }))} />{validation.maximumScore ? <FieldError>{validation.maximumScore}</FieldError> : <p className="mt-1 text-xs text-text-muted">{t("Passing score: {{score}}", { score: form.maximumScore * form.passPercentage / 100 })}</p>}</div>
            <div><Label htmlFor="quiz-duration">{t("Time limit (minutes)")}</Label><Input id="quiz-duration" type="number" min={1} value={form.durationSeconds ? Math.ceil(form.durationSeconds / 60) : ""} placeholder={t("No time limit")} onChange={(event) => setForm((current) => ({ ...current, durationSeconds: event.target.value ? Number(event.target.value) * 60 : null }))} /></div>
            <div className="self-end"><Button type="submit" loading={pending}>{selected ? t("Save quiz") : t("Create quiz")}</Button></div>
          </form>
          {selected ? <div className="mt-7 border-t border-border pt-6"><div className="flex flex-wrap gap-2">{selected.status === "DRAFT" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => void mutate(`quizzes/${selected.id}/status`, "PATCH", t("Quiz submitted for review."), { status: "REVIEW" })}>{t("Submit for review")}</Button> : null}{selected.status === "REVIEW" ? <><Button size="sm" variant="secondary" disabled={pending} onClick={() => void mutate(`quizzes/${selected.id}/status`, "PATCH", t("Quiz moved to draft."), { status: "DRAFT" })}>{t("Move to draft")}</Button><Button size="sm" disabled={pending} onClick={() => void mutate(`quizzes/${selected.id}/publish`, "POST", t("Quiz published."))}>{t("Publish")}</Button></> : null}{selected.status === "PUBLISHED" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => void mutate(`quizzes/${selected.id}/archive`, "POST", t("Quiz archived."))}>{t("Archive")}</Button> : null}{selected.status === "ARCHIVED" ? <Button size="sm" variant="secondary" disabled={pending} onClick={() => void mutate(`quizzes/${selected.id}/status`, "PATCH", t("Quiz moved to draft."), { status: "DRAFT" })}>{t("Move to draft")}</Button> : null}</div><Button className="mt-5" size="sm" variant="danger" loading={pending} onClick={() => void deleteQuiz()}>{t("Delete quiz")}</Button></div> : null}
        </CardContent></Card>
        {selected ? selected.selectionMode === "FIXED"
          ? <FixedQuestions key={selected.id} quiz={selected} questions={questions} pending={pending} mutate={mutate} />
          : <QuizRules key={selected.id} quiz={selected} nodes={nodesForLanguage(nodes, selected.language)} pending={pending} mutate={mutate} />
        : null}
      </div>
    </div>
  </div>;
}

function FixedQuestions({ quiz, questions, pending, mutate }: { quiz: QuizDetail; questions: Question[]; pending: boolean; mutate: (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", message: string, body?: unknown) => Promise<void> }) {
  const { t } = useI18n();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const available = questions.filter((question) =>
    question.status === "PUBLISHED"
      && question.language === quiz.language
      && (quiz.category === "MIXED" || question.category === quiz.category)
      && !quiz.fixedQuestions.some((item) => item.questionId === question.id)
      && `${question.code} ${question.difficulty} ${question.status}`.toLowerCase().includes(search.toLowerCase()),
  );
  return <Card><CardContent><h2 className="text-lg font-semibold text-text">{t("Fixed questions")}</h2><p className="mt-1 text-sm text-text-muted">{t("FIXED uses the exact questions you choose. New selections are appended in order; the current domain has no reorder operation.")}</p>
    {quiz.fixedQuestions.length ? <ol className="mt-5 space-y-2">{[...quiz.fixedQuestions].sort((a, b) => a.position - b.position).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><span className="text-sm font-semibold text-text">{item.position}. {item.questionCode}</span><Button size="sm" variant="ghost" disabled={pending || quiz.status !== "DRAFT"} onClick={() => { if (window.confirm(t("Remove {{code}} from this quiz?", { code: item.questionCode }))) void mutate(`quizzes/${quiz.id}/fixed-questions/${item.questionId}`, "DELETE", t("Fixed question removed.")); }}>{t("Remove")}</Button></li>)}</ol> : <p className="mt-5 text-sm text-text-muted">{t("No fixed questions configured.")}</p>}
    <div className="mt-6 border-t border-border pt-6"><Label htmlFor="fixed-search">{t("Search published questions")}</Label><Input id="fixed-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("Code or difficulty")} disabled={quiz.status !== "DRAFT"}/><div className="mt-3 max-h-64 space-y-2 overflow-auto rounded-md border border-border p-3">{available.length ? available.map((question) => <label key={question.id} className="flex cursor-pointer items-center justify-between gap-3 rounded p-2 hover:bg-surface-muted"><span className="flex items-center gap-3"><input type="checkbox" className="size-4 accent-primary" checked={selectedIds.includes(question.id)} onChange={() => setSelectedIds((current) => current.includes(question.id) ? current.filter((id) => id !== question.id) : [...current, question.id])}/><span className="font-mono text-sm text-text">{question.code}</span></span><span className="text-xs text-text-muted">{question.difficulty} / {question.status}</span></label>) : <p className="p-3 text-sm text-text-muted">{t("No eligible questions found.")}</p>}</div><Button className="mt-3" disabled={!selectedIds.length || quiz.status !== "DRAFT"} loading={pending} onClick={() => void mutate(`quizzes/${quiz.id}/fixed-questions/batch`, "POST", t("{{count}} fixed questions added.", { count: selectedIds.length }), { questionIds: selectedIds }).then(() => setSelectedIds([]))}>{t("Add selected ({{count}})", { count: selectedIds.length })}</Button></div>
    {quiz.status !== "DRAFT" ? <p className="mt-3 text-xs text-warning-strong">{t("Move the quiz to draft before changing its fixed questions.")}</p> : null}
  </CardContent></Card>;
}

function QuizRules({ quiz, nodes, pending, mutate }: { quiz: QuizDetail; nodes: KnowledgeNode[]; pending: boolean; mutate: (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", message: string, body?: unknown) => Promise<void> }) {
  const { t } = useI18n();
  const [nodeId, setNodeId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | "">("");
  const [count, setCount] = useState(1);
  return <Card><CardContent><h2 className="text-lg font-semibold text-text">{t("Selection rules")}</h2><p className="mt-1 text-sm text-text-muted">{t("The backend selects published questions from each knowledge scope and optional difficulty.")}</p>
    {quiz.rules.length ? <div className="mt-5 space-y-3">{quiz.rules.map((rule) => <RuleEditor key={rule.id} quiz={quiz} rule={rule} nodes={nodes} pending={pending} mutate={mutate} />)}</div> : <p className="mt-5 text-sm text-text-muted">{t("No selection rules configured.")}</p>}
    <div className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2"><div className="sm:col-span-2"><Label htmlFor="rule-node">{t("Knowledge scope")}</Label><Select id="rule-node" value={nodeId} disabled={quiz.status !== "DRAFT"} onChange={(event) => setNodeId(event.target.value)}><option value="">{t("Select knowledge node")}</option>{nodes.map((node) => <option key={node.id} value={node.id}>{node.name} - {node.type} ({node.status})</option>)}</Select></div><div><Label htmlFor="rule-difficulty">{t("Difficulty")}</Label><Select id="rule-difficulty" value={difficulty} disabled={quiz.status !== "DRAFT"} onChange={(event) => setDifficulty(event.target.value as Difficulty | "")}><option value="">{t("Any difficulty")}</option><option value="EASY">{t("EASY")}</option><option value="MEDIUM">{t("MEDIUM")}</option><option value="HARD">{t("HARD")}</option></Select></div><div><Label htmlFor="rule-count">{t("Question count")}</Label><Input id="rule-count" type="number" min={1} disabled={quiz.status !== "DRAFT"} value={count} onChange={(event) => setCount(Number(event.target.value))} /></div><div className="sm:col-span-2"><Button disabled={!nodeId || quiz.status !== "DRAFT"} loading={pending} onClick={() => void mutate(`quizzes/${quiz.id}/rules`, "POST", t("Quiz rule added."), { knowledgeNodeId: nodeId, difficulty: difficulty || null, questionCount: count })}>{t("Add rule")}</Button></div></div>
    {quiz.status !== "DRAFT" ? <p className="mt-3 text-xs text-warning-strong">{t("Move the quiz to draft before changing selection rules.")}</p> : null}
  </CardContent></Card>;
}

function RuleEditor({ quiz, rule, nodes, pending, mutate }: { quiz: QuizDetail; rule: QuizRule; nodes: KnowledgeNode[]; pending: boolean; mutate: (path: string, method: "POST" | "PUT" | "PATCH" | "DELETE", message: string, body?: unknown) => Promise<void> }) {
  const { t } = useI18n();
  const [nodeId, setNodeId] = useState(rule.knowledgeNodeId);
  const [difficulty, setDifficulty] = useState<Difficulty | "">(rule.difficulty ?? "");
  const [count, setCount] = useState(rule.questionCount);
  return <div className="grid gap-3 rounded-md border border-border p-4 sm:grid-cols-2 xl:grid-cols-[1fr_10rem_8rem_auto]"><Select aria-label={t("Rule knowledge scope")} value={nodeId} disabled={quiz.status !== "DRAFT"} onChange={(event) => setNodeId(event.target.value)}>{nodes.map((node) => <option key={node.id} value={node.id}>{node.name} - {node.type}</option>)}</Select><Select aria-label={t("Rule difficulty")} value={difficulty} disabled={quiz.status !== "DRAFT"} onChange={(event) => setDifficulty(event.target.value as Difficulty | "")}><option value="">{t("Any")}</option><option>EASY</option><option>MEDIUM</option><option>HARD</option></Select><Input aria-label={t("Rule question count")} type="number" min={1} value={count} disabled={quiz.status !== "DRAFT"} onChange={(event) => setCount(Number(event.target.value))} /><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={pending || quiz.status !== "DRAFT"} onClick={() => void mutate(`quizzes/${quiz.id}/rules/${rule.id}`, "PUT", t("Quiz rule updated."), { knowledgeNodeId: nodeId, difficulty: difficulty || null, questionCount: count })}>{t("Save")}</Button><Button size="sm" variant="ghost" disabled={pending || quiz.status !== "DRAFT"} onClick={() => { if (window.confirm(t("Remove this selection rule?"))) void mutate(`quizzes/${quiz.id}/rules/${rule.id}`, "DELETE", t("Quiz rule removed.")); }}>{t("Remove")}</Button></div></div>;
}

function Status({ status }: { status: ContentStatus }) { const { t } = useI18n(); return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "DRAFT" ? "info" : "neutral"}>{t(status)}</Badge>; }
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[] }) { const { t } = useI18n(); return <div><Label className="sr-only">{label}</Label><Select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{t("All {{label}}", { label: label.toLowerCase() })}</option>{options.map((option) => <option key={option} value={option}>{t(option)}</option>)}</Select></div>; }
function nodesForLanguage(nodes: KnowledgeNode[], language: QuestionLanguage) {
  const englishRoot = nodes.find((node) => node.slug === "english");
  if (!englishRoot) return language === "EN" ? [] : nodes;
  const englishIds = new Set<string>([englishRoot.id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const node of nodes) {
      if (node.parentId && englishIds.has(node.parentId) && !englishIds.has(node.id)) {
        englishIds.add(node.id);
        changed = true;
      }
    }
  }
  return nodes.filter((node) => language === "EN" ? englishIds.has(node.id) : !englishIds.has(node.id));
}
function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "The request could not be completed."; }
