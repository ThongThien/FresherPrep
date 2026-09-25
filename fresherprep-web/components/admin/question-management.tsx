"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import { adminRequest, jsonBody } from "@/lib/admin/client";
import type { AdminPage, ContentStatus, Difficulty, KnowledgeNode, Question, QuestionCategory, QuestionLanguage, QuestionVersion } from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";

type OptionDraft = { position: number; content: string; correct: boolean; explanation: string };
const difficulties: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const languages: QuestionLanguage[] = ["VI", "EN"];
const categories: QuestionCategory[] = ["TECHNICAL", "GRAMMAR", "VOCABULARY", "TOEIC"];
const emptyQuestion = { subtopicId: "", code: "", difficulty: "EASY" as Difficulty, language: "VI" as QuestionLanguage, category: "TECHNICAL" as QuestionCategory };
const emptyOptions = (): OptionDraft[] => [1, 2, 3, 4].map((position) => ({ position, content: "", correct: position === 1, explanation: "" }));

export function QuestionManagement() {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subtopics, setSubtopics] = useState<KnowledgeNode[]>([]);
  const [selected, setSelected] = useState<Question>();
  const [versions, setVersions] = useState<QuestionVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>();
  const [form, setForm] = useState(emptyQuestion);
  const [versionForm, setVersionForm] = useState({ content: "", explanation: "", options: emptyOptions() });
  const [revisionSource, setRevisionSource] = useState<string>();
  const [query, setQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [knowledgeFilter, setKnowledgeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
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
      const params = new URLSearchParams({ page: "0", size: "100", sort: "code,asc" });
      if (languageFilter) params.set("language", languageFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (knowledgeFilter) params.set("knowledgeNodeId", knowledgeFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      if (statusFilter) params.set("status", statusFilter);
      const [page, nodes] = await Promise.all([
        adminRequest<AdminPage<Question>>(`questions?${params.toString()}`),
        adminRequest<KnowledgeNode[]>("knowledge/nodes"),
      ]);
      setQuestions(page.content);
      setSubtopics(nodes.filter((node) => node.type === "SUBTOPIC"));
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, knowledgeFilter, languageFilter, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLists(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLists]);

  const visible = useMemo(() => questions.filter((question) =>
    `${question.code} ${question.language} ${question.category} ${question.difficulty} ${question.status}`.toLowerCase().includes(query.toLowerCase()),
  ), [questions, query]);

  async function selectQuestion(questionId: string) {
    setError(undefined);
    setSuccess(undefined);
    try {
      const [question, questionVersions] = await Promise.all([
        adminRequest<Question>(`questions/${questionId}`),
        adminRequest<QuestionVersion[]>(`questions/${questionId}/versions`),
      ]);
      setSelected(question);
      setVersions(questionVersions);
      setSelectedVersionId(question.publishedVersionId ?? questionVersions[0]?.id);
      setForm({ subtopicId: question.subtopicId, code: question.code, difficulty: question.difficulty, language: question.language, category: question.category });
      resetVersionEditor();
      setValidation({});
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  function startCreate() {
    setSelected(undefined);
    setVersions([]);
    setSelectedVersionId(undefined);
    setForm(emptyQuestion);
    resetVersionEditor();
    clearMessages();
  }

  async function submitQuestion(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.subtopicId) errors.subtopicId = "Select a subtopic.";
    if (!form.code.trim()) errors.code = "Question code is required.";
    setValidation(errors);
    if (Object.keys(errors).length) return;
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const saved = await adminRequest<Question>(
        selected ? `questions/${selected.id}` : "questions",
        { method: selected ? "PUT" : "POST", ...jsonBody({ ...form, code: form.code.trim().toUpperCase() }) },
      );
      await loadLists();
      await selectQuestion(saved.id);
      setSuccess(selected ? "Question metadata updated." : "Question created. Add its first immutable version next.");
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  async function changeStatus(status: Exclude<ContentStatus, "PUBLISHED">) {
    if (!selected) return;
    await mutateQuestion(`questions/${selected.id}/status`, "PATCH", { status }, `Question moved to ${status.toLowerCase()}.`);
  }

  async function deleteQuestion() {
    if (!selected || !window.confirm("Delete this question? Questions with version or quiz history cannot be deleted.")) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`questions/${selected.id}`, { method: "DELETE" });
      startCreate();
      await loadLists();
      setSuccess("Question deleted.");
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  function editAsRevision(version: QuestionVersion) {
    setRevisionSource(version.id);
    setSelectedVersionId(version.id);
    setVersionForm({
      content: version.content,
      explanation: version.explanation,
      options: version.options.map((option) => ({ position: option.position, content: option.content, correct: option.correct, explanation: option.explanation })),
    });
    setValidation({});
    setError(undefined);
    setSuccess(undefined);
  }

  async function submitVersion(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    const errors: Record<string, string> = {};
    if (!versionForm.content.trim()) errors.versionContent = "Question content is required.";
    if (!versionForm.explanation.trim()) errors.versionExplanation = "Question explanation is required.";
    versionForm.options.forEach((option, index) => {
      if (!option.content.trim()) errors[`option-${index}-content`] = "Option content is required.";
      if (!option.explanation.trim()) errors[`option-${index}-explanation`] = "Option explanation is required.";
    });
    if (versionForm.options.filter((option) => option.correct).length !== 1) errors.correct = "Select exactly one correct option.";
    setValidation(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = {
        content: versionForm.content.trim(),
        explanation: versionForm.explanation.trim(),
        options: versionForm.options.map((option) => ({ ...option, content: option.content.trim(), explanation: option.explanation.trim() })),
      };
      const nextVersion = Math.max(0, ...versions.map((version) => version.versionNumber)) + 1;
      const created = await adminRequest<QuestionVersion>(
        revisionSource ? `questions/${selected.id}/versions/${revisionSource}/revisions` : `questions/${selected.id}/versions`,
        { method: "POST", ...jsonBody(revisionSource ? payload : { versionNumber: nextVersion, ...payload }) },
      );
      const refreshed = await adminRequest<QuestionVersion[]>(`questions/${selected.id}/versions`);
      setVersions(refreshed);
      setSelectedVersionId(created.id);
      resetVersionEditor();
      setSuccess(`Version ${created.versionNumber} created. Existing versions remain unchanged.`);
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  async function publishVersion(versionId: string) {
    if (!selected) return;
    await mutateQuestion(`questions/${selected.id}/versions/${versionId}/publish`, "POST", undefined, "Question version published.");
  }

  async function mutateQuestion(path: string, method: "POST" | "PATCH", body: unknown, message: string) {
    if (!selected) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest(path, { method, ...(body ? jsonBody(body) : {}) });
      await loadLists();
      await selectQuestion(selected.id);
      setSuccess(message);
    } catch (reason) { setError(messageOf(reason)); } finally { setPending(false); }
  }

  function resetVersionEditor() {
    setRevisionSource(undefined);
    setVersionForm({ content: "", explanation: "", options: emptyOptions() });
  }
  function clearMessages() { setError(undefined); setSuccess(undefined); setValidation({}); }

  return <div className="mx-auto max-w-7xl">
    <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t("Questions")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{t("Manage question metadata and immutable content versions.")}</p></div><Button onClick={startCreate}>{t("New question")}</Button></header>
    {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
    {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
      <Card><CardContent><Label htmlFor="question-search">{t("Search questions")}</Label><Input id="question-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Code, language, category, difficulty, or status")} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FilterSelect label={t("Language")} value={languageFilter} onChange={setLanguageFilter} options={languages.map((value) => ({ value, label: t(value) }))} />
          <FilterSelect label={t("Category")} value={categoryFilter} onChange={setCategoryFilter} options={categories.map((value) => ({ value, label: t(value) }))} />
          <FilterSelect label={t("Knowledge")} value={knowledgeFilter} onChange={setKnowledgeFilter} options={subtopics.map((node) => ({ value: node.id, label: node.name }))} />
          <FilterSelect label={t("Difficulty")} value={difficultyFilter} onChange={setDifficultyFilter} options={difficulties.map((value) => ({ value, label: t(value) }))} />
          <FilterSelect label={t("Status")} value={statusFilter} onChange={setStatusFilter} options={["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"].map((value) => ({ value, label: t(value) }))} />
        </div>
        {loading ? <p className="py-10 text-center text-sm text-text-muted">{t("Loading questions...")}</p> : visible.length ? <ul className="mt-5 space-y-2">{visible.map((question) => <li key={question.id}><button type="button" onClick={() => void selectQuestion(question.id)} className={`w-full rounded-md border p-3 text-left hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${selected?.id === question.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}><span className="flex items-start justify-between gap-2"><span className="font-semibold text-text">{question.code}</span><Status status={question.status} /></span><span className="mt-1 block text-xs text-text-muted">{t(question.language)} · {t(question.category)} · {t(question.difficulty)}{question.publishedVersionId ? t(" - published version available") : t(" - no published version")}</span></button></li>)}</ul> : <p className="py-10 text-center text-sm text-text-muted">{t("No matching questions.")}</p>}</CardContent></Card>
      <div className="space-y-6">
        <Card><CardContent><div className="flex justify-between gap-3"><div><h2 className="text-lg font-semibold text-text">{selected ? t("Question metadata") : t("Create question")}</h2><p className="mt-1 text-sm text-text-muted">{t("Content and answers are managed as immutable versions below.")}</p></div>{selected ? <Status status={selected.status} /> : null}</div>
          <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submitQuestion}>
            <div><Label htmlFor="question-code">{t("Code")}</Label><Input id="question-code" maxLength={50} aria-invalid={Boolean(validation.code)} value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} />{validation.code ? <FieldError>{validation.code}</FieldError> : null}</div>
            <div><Label htmlFor="question-difficulty">{t("Difficulty")}</Label><Select id="question-difficulty" value={form.difficulty} onChange={(event) => setForm((current) => ({ ...current, difficulty: event.target.value as Difficulty }))}>{difficulties.map((difficulty) => <option key={difficulty} value={difficulty}>{t(difficulty)}</option>)}</Select></div>
            <div><Label htmlFor="question-language">{t("Language")}</Label><Select id="question-language" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as QuestionLanguage }))}>{languages.map((language) => <option key={language} value={language}>{t(language)}</option>)}</Select></div>
            <div><Label htmlFor="question-category">{t("Category")}</Label><Select id="question-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as QuestionCategory }))}>{categories.map((category) => <option key={category} value={category}>{t(category)}</option>)}</Select></div>
            <div className="sm:col-span-2"><Label htmlFor="question-subtopic">{t("Subtopic")}</Label><Select id="question-subtopic" aria-invalid={Boolean(validation.subtopicId)} value={form.subtopicId} onChange={(event) => setForm((current) => ({ ...current, subtopicId: event.target.value }))}><option value="">{t("Select subtopic")}</option>{subtopics.map((node) => <option key={node.id} value={node.id}>{node.name} ({node.status})</option>)}</Select>{validation.subtopicId ? <FieldError>{validation.subtopicId}</FieldError> : null}</div>
            <div className="sm:col-span-2"><Button type="submit" loading={pending}>{selected ? t("Save metadata") : t("Create question")}</Button></div>
          </form>
          {selected ? <div className="mt-7 border-t border-border pt-6"><div className="flex flex-wrap gap-2">{questionTransitions(selected.status).map((status) => <Button key={status} size="sm" variant="secondary" disabled={pending} onClick={() => void changeStatus(status)}>{status === "REVIEW" ? t("Submit for review") : status === "DRAFT" ? t("Move to draft") : t("Archive")}</Button>)}</div><Button className="mt-5" size="sm" variant="danger" loading={pending} onClick={() => void deleteQuestion()}>{t("Delete question")}</Button></div> : null}
        </CardContent></Card>
        {selected ? <Card><CardContent><div><h2 className="text-lg font-semibold text-text">{t("Version history")}</h2><p className="mt-1 text-sm text-text-muted">{t("Versions and options are never edited in place. A revision creates a new version.")}</p></div>
          {versions.length ? <div className="mt-5 space-y-3">{versions.map((version) => <div key={version.id} className={`rounded-md border p-4 ${selectedVersionId === version.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><button type="button" className="min-w-0 text-left" onClick={() => setSelectedVersionId(version.id)}><span className="font-semibold text-text">{t("Version {{number}}", { number: version.versionNumber })}</span>{selected.publishedVersionId === version.id ? <Badge className="ml-2" variant="success">{t("Published")}</Badge> : null}<span className="mt-1 block line-clamp-2 text-sm text-text-muted">{version.content}</span></button><div className="flex shrink-0 gap-2"><Button size="sm" variant="secondary" onClick={() => editAsRevision(version)}>{t("Create revision")}</Button><Button size="sm" disabled={pending || selected.publishedVersionId === version.id || (selected.status !== "REVIEW" && selected.status !== "PUBLISHED")} onClick={() => void publishVersion(version.id)}>{t("Publish")}</Button></div></div>{selectedVersionId === version.id ? <div className="mt-4 border-t border-border pt-4"><p className="text-sm text-text">{version.explanation}</p><ol className="mt-3 space-y-2">{version.options.map((option) => <li key={option.id} className="text-sm text-text-muted"><span className="font-semibold text-text">{option.position}. {option.content}</span>{option.correct ? <span className="ml-2 font-semibold text-success-strong">{t("Correct")}</span> : null}<span className="block text-xs">{option.explanation}</span></li>)}</ol></div> : null}</div>)}</div> : <p className="mt-5 text-sm text-text-muted">{t("No versions yet.")}</p>}
          <form className="mt-7 border-t border-border pt-6" onSubmit={submitVersion}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-text">{revisionSource ? t("Create revision") : t("Create new version")}</h3><p className="mt-1 text-xs text-text-muted">{revisionSource ? t("The selected version is copied into a new immutable version.") : t("The backend requires next version number {{number}}.", { number: Math.max(0, ...versions.map((version) => version.versionNumber)) + 1 })}</p></div>{revisionSource ? <Button size="sm" variant="ghost" onClick={resetVersionEditor}>{t("Cancel revision")}</Button> : null}</div>
            <div className="mt-5"><Label htmlFor="version-content">{t("Question content")}</Label><Textarea id="version-content" aria-invalid={Boolean(validation.versionContent)} value={versionForm.content} onChange={(event) => setVersionForm((current) => ({ ...current, content: event.target.value }))} />{validation.versionContent ? <FieldError>{validation.versionContent}</FieldError> : null}</div>
            <div className="mt-4"><Label htmlFor="version-explanation">{t("Question explanation")}</Label><Textarea id="version-explanation" aria-invalid={Boolean(validation.versionExplanation)} value={versionForm.explanation} onChange={(event) => setVersionForm((current) => ({ ...current, explanation: event.target.value }))} />{validation.versionExplanation ? <FieldError>{validation.versionExplanation}</FieldError> : null}</div>
            <fieldset className="mt-5 space-y-4"><legend className="text-sm font-semibold text-text">{t("Four answer options")}</legend>{versionForm.options.map((option, index) => <div key={option.position} className="rounded-md border border-border p-4"><label className="flex items-center gap-2 text-sm font-semibold text-text"><input type="radio" name="correct-option" checked={option.correct} onChange={() => setVersionForm((current) => ({ ...current, options: current.options.map((item, itemIndex) => ({ ...item, correct: itemIndex === index })) }))} className="size-4 accent-primary" />{t("Option {{position}} is correct", { position: option.position })}</label><Input className="mt-3" aria-label={t("Option {{position}} content", { position: option.position })} aria-invalid={Boolean(validation[`option-${index}-content`])} value={option.content} onChange={(event) => updateOption(index, "content", event.target.value, setVersionForm)} placeholder={t("Answer content")} />{validation[`option-${index}-content`] ? <FieldError>{validation[`option-${index}-content`]}</FieldError> : null}<Textarea className="mt-3 min-h-20" aria-label={t("Option {{position}} explanation", { position: option.position })} aria-invalid={Boolean(validation[`option-${index}-explanation`])} value={option.explanation} onChange={(event) => updateOption(index, "explanation", event.target.value, setVersionForm)} placeholder={t("Why this option is correct or incorrect")} />{validation[`option-${index}-explanation`] ? <FieldError>{validation[`option-${index}-explanation`]}</FieldError> : null}</div>)}</fieldset>{validation.correct ? <FieldError>{validation.correct}</FieldError> : null}
            <Button className="mt-5" type="submit" loading={pending}>{revisionSource ? t("Create revision") : t("Create version")}</Button>
          </form>
        </CardContent></Card> : null}
      </div>
    </div>
  </div>;
}

function updateOption(index: number, field: "content" | "explanation", value: string, setter: React.Dispatch<React.SetStateAction<{ content: string; explanation: string; options: OptionDraft[] }>>) {
  setter((current) => ({ ...current, options: current.options.map((option, itemIndex) => itemIndex === index ? { ...option, [field]: value } : option) }));
}
function questionTransitions(status: ContentStatus): Exclude<ContentStatus, "PUBLISHED">[] {
  if (status === "DRAFT") return ["REVIEW"];
  if (status === "REVIEW" || status === "ARCHIVED") return ["DRAFT"];
  return ["ARCHIVED"];
}
function Status({ status }: { status: ContentStatus }) { const { t } = useI18n(); return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "DRAFT" ? "info" : "neutral"}>{t(status)}</Badge>; }
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  const { t } = useI18n();
  return <div><Label className="sr-only">{label}</Label><Select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{t("All {{label}}", { label: label.toLowerCase() })}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></div>;
}
function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "The request could not be completed."; }
