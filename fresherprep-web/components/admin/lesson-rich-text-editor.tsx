"use client";

import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";

import { Button, Feedback } from "@/components/ui";
import { adminRequest } from "@/lib/admin/client";
import { useI18n } from "@/lib/i18n";
import { prepareLessonHtml } from "@/lib/lessons/content";

interface LessonAssetUploadResponse {
  assetReference: string;
  contentType: string;
  size: number;
}

const supportedImageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const maxImageBytes = 2 * 1024 * 1024;

export function LessonRichTextEditor({
  value,
  onChange,
  invalid = false,
}: {
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: { rel: "noopener noreferrer nofollow" },
        },
      }),
      Image.configure({ allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: prepareLessonHtml(value),
    editorProps: {
      attributes: {
        class: "lesson-prose lesson-editor-content",
        "aria-label": t("Lesson rich content editor"),
      },
    },
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const next = prepareLessonHtml(value);
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt(t("Link URL"), current ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!isSafeLink(href.trim())) {
      setUploadError(t("Use an HTTP, HTTPS, or mailto link."));
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  async function uploadImage(file?: File) {
    if (!editor || !file) return;
    setUploadError(undefined);
    if (!supportedImageTypes.has(file.type)) {
      setUploadError(t("Lesson image must be WEBP, PNG, or JPEG."));
      return;
    }
    if (file.size > maxImageBytes) {
      setUploadError(t("Lesson image must not exceed 2 MB."));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await adminRequest<LessonAssetUploadResponse>("lessons/assets", {
        method: "POST",
        body: formData,
      });
      const alt = window.prompt(t("Image description"), file.name) ?? file.name;
      editor.chain().focus().setImage({
        src: uploaded.assetReference,
        alt: alt.trim() || file.name,
      }).run();
    } catch (reason) {
      setUploadError(reason instanceof Error ? reason.message : t("Unable to upload lesson image."));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (!editor) {
    return <p className="rounded-md border border-border bg-surface-muted p-4 text-sm text-text-muted" role="status">{t("Loading rich text editor...")}</p>;
  }

  return (
    <div className="space-y-3">
      <div className={`overflow-hidden rounded-md border bg-surface ${invalid ? "border-danger" : "border-border"}`}>
        <div className="flex flex-wrap gap-1 border-b border-border bg-surface-muted p-2" role="toolbar" aria-label={t("Text formatting")}>
          <ToolButton label={t("Paragraph")} onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} />
          <ToolButton label="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} />
          <ToolButton label="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} />
          <ToolButton label={t("Bold")} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} />
          <ToolButton label={t("Italic")} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} />
          <ToolButton label={t("Underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} />
          <ToolButton label={t("Bulleted list")} onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} />
          <ToolButton label={t("Numbered list")} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} />
          <ToolButton label={t("Blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} />
          <ToolButton label={t("Inline code")} onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} />
          <ToolButton label={t("Code block")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} />
          <ToolButton label={t("Link")} onClick={setLink} active={editor.isActive("link")} />
          <ToolButton label={t("Divider")} onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          <ToolButton label={t("Insert table")} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          {editor.isActive("table") ? <>
            <ToolButton label={t("Add row")} onClick={() => editor.chain().focus().addRowAfter().run()} />
            <ToolButton label={t("Add column")} onClick={() => editor.chain().focus().addColumnAfter().run()} />
            <ToolButton label={t("Delete table")} onClick={() => editor.chain().focus().deleteTable().run()} />
          </> : null}
          <ToolButton label={t("Image")} onClick={() => inputRef.current?.click()} disabled={uploading} />
          <ToolButton label={t("Undo")} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} />
          <ToolButton label={t("Redo")} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} />
        </div>
        <EditorContent editor={editor} />
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        aria-label={t("Upload lesson image")}
        onChange={(event) => void uploadImage(event.target.files?.[0])}
      />
      {uploading ? <p className="text-sm text-text-muted" role="status">{t("Uploading lesson image...")}</p> : null}
      {uploadError ? <Feedback tone="error" title={t("Image upload failed")}>{uploadError}</Feedback> : null}
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "primary" : "ghost"}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function isSafeLink(value: string) {
  return /^https?:\/\//i.test(value)
    || /^mailto:/i.test(value);
}
