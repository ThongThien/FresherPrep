"use client";

import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type ReactNode } from "react";

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
        heading: {
          levels: [2, 3, 4],
        },

        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
          HTMLAttributes: {
            rel: "noopener noreferrer nofollow",
          },
        },
      }),

      Image.configure({
        allowBase64: false,
      }),

      TableKit.configure({
        table: {
          resizable: false,
        },
      }),
    ],

    content: prepareLessonHtml(value),

    editorProps: {
      attributes: {
        class: "lesson-prose lesson-editor-content",
        "aria-label": t("Lesson rich content editor"),
      },
    },

    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    const next = prepareLessonHtml(value);

    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, {
        emitUpdate: false,
      });
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

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: href.trim(),
      })
      .run();
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

      const uploaded = await adminRequest<LessonAssetUploadResponse>(
        "lessons/assets",
        {
          method: "POST",
          body: formData,
        },
      );

      const alt = window.prompt(t("Image description"), file.name) ?? file.name;

      editor
        .chain()
        .focus()
        .setImage({
          src: uploaded.assetReference,
          alt: alt.trim() || file.name,
        })
        .run();
    } catch (reason) {
      setUploadError(
        reason instanceof Error
          ? reason.message
          : t("Unable to upload lesson image."),
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (!editor) {
    return (
      <p
        className="rounded-md border border-border bg-surface-muted p-4 text-sm text-text-muted"
        role="status"
      >
        {t("Loading rich text editor...")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className={`overflow-hidden rounded-md border bg-surface ${
          invalid ? "border-danger" : "border-border"
        }`}
      >
        <div
          className="flex flex-wrap gap-1 border-b border-border bg-surface-muted p-2"
          role="toolbar"
          aria-label={t("Text formatting")}
        >
          <ToolButton
            label={t("Paragraph")}
            icon={<EditorIcon name="paragraph" />}
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
          />

          <ToolButton
            label="H2"
            icon={<EditorIcon name="h2" />}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", {
              level: 2,
            })}
          />

          <ToolButton
            label="H3"
            icon={<EditorIcon name="h3" />}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", {
              level: 3,
            })}
          />

          <ToolButton
            label={t("Bold")}
            icon={<EditorIcon name="bold" />}
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          />

          <ToolButton
            label={t("Italic")}
            icon={<EditorIcon name="italic" />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          />

          <ToolButton
            label={t("Underline")}
            icon={<EditorIcon name="underline" />}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
          />

          <ToolButton
            label={t("Bulleted list")}
            icon={<EditorIcon name="bullet-list" />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
          />

          <ToolButton
            label={t("Numbered list")}
            icon={<EditorIcon name="ordered-list" />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
          />

          <ToolButton
            label={t("Blockquote")}
            icon={<EditorIcon name="quote" />}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
          />

          <ToolButton
            label={t("Inline code")}
            icon={<EditorIcon name="inline-code" />}
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
          />

          <ToolButton
            label={t("Code block")}
            icon={<EditorIcon name="code-block" />}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
          />

          <ToolButton
            label={t("Link")}
            icon={<EditorIcon name="link" />}
            onClick={setLink}
            active={editor.isActive("link")}
          />

          <ToolButton
            label={t("Divider")}
            icon={<EditorIcon name="divider" />}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />

          <ToolButton
            label={t("Insert table")}
            icon={<EditorIcon name="table" />}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({
                  rows: 3,
                  cols: 3,
                  withHeaderRow: true,
                })
                .run()
            }
          />

          {editor.isActive("table") ? (
            <>
              <ToolButton
                label={t("Add row")}
                icon={<EditorIcon name="add-row" />}
                onClick={() => editor.chain().focus().addRowAfter().run()}
              />

              <ToolButton
                label={t("Add column")}
                icon={<EditorIcon name="add-column" />}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              />

              <ToolButton
                label={t("Delete table")}
                icon={<EditorIcon name="delete" />}
                onClick={() => editor.chain().focus().deleteTable().run()}
              />
            </>
          ) : null}

          <ToolButton
            label={t("Image")}
            icon={<EditorIcon name="image" />}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          />

          <ToolButton
            label={t("Undo")}
            icon={<EditorIcon name="undo" />}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
          />

          <ToolButton
            label={t("Redo")}
            icon={<EditorIcon name="redo" />}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
          />
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

      {uploading ? (
        <p className="text-sm text-text-muted" role="status">
          {t("Uploading lesson image...")}
        </p>
      ) : null}

      {uploadError ? (
        <Feedback tone="error" title={t("Image upload failed")}>
          {uploadError}
        </Feedback>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "primary" : "ghost"}
      className="!size-10 !min-h-10 !min-w-10 shrink-0 p-0 [&>svg]:!size-7 [&>svg]:!h-7 [&>svg]:!w-7"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="flex size-7 shrink-0 items-center justify-center">
        {icon}
      </span>
    </Button>
  );
}

type EditorIconName =
  | "paragraph"
  | "h2"
  | "h3"
  | "bold"
  | "italic"
  | "underline"
  | "bullet-list"
  | "ordered-list"
  | "quote"
  | "inline-code"
  | "code-block"
  | "link"
  | "divider"
  | "table"
  | "add-row"
  | "add-column"
  | "delete"
  | "image"
  | "undo"
  | "redo";

function EditorIcon({ name }: { name: EditorIconName }) {
  const common = {
    width: 28,
    height: 28,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "block size-7 shrink-0",
  };

  if (name === "h2" || name === "h3") {
    return (
      <svg {...common}>
        <path d="M5 6v12M13 6v12M5 12h8" />

        {name === "h2" ? (
          <path d="M16 10.5a2 2 0 1 1 3.5 1.3L16 16h4" />
        ) : (
          <path d="M16.5 10.5h3l-2 2.2a2 2 0 1 1-1 3.3" />
        )}
      </svg>
    );
  }

  const paths: Record<Exclude<EditorIconName, "h2" | "h3">, ReactNode> = {
    paragraph: (
      <>
        <path d="M13 5v14M17 5v14" />
        <path d="M13 5H9a4 4 0 0 0 0 8h4" />
      </>
    ),

    bold: (
      <>
        <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7z" />
        <path d="M7 12h7a3.5 3.5 0 0 1 0 7H7z" />
      </>
    ),

    italic: (
      <>
        <path d="M10 5h8M6 19h8M14 5 10 19" />
      </>
    ),

    underline: (
      <>
        <path d="M7 5v6a5 5 0 0 0 10 0V5M5 21h14" />
      </>
    ),

    "bullet-list": (
      <>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" />
      </>
    ),

    "ordered-list": (
      <>
        <path d="M10 6h10M10 12h10M10 18h10" />
        <path d="M4 4h1v4M4 11h2l-2 3h2M4 17h2l-2 3h2" />
      </>
    ),

    quote: (
      <>
        <path d="M7 17H4a2 2 0 0 1-2-2v-3a5 5 0 0 1 5-5v3a2 2 0 0 0-2 2h2zM19 17h-3a2 2 0 0 1-2-2v-3a5 5 0 0 1 5-5v3a2 2 0 0 0-2 2h2z" />
      </>
    ),

    "inline-code": (
      <>
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </>
    ),

    "code-block": (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="m9 9-3 3 3 3M15 9l3 3-3 3" />
      </>
    ),

    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
      </>
    ),

    divider: (
      <>
        <path d="M4 12h16M8 7l4-3 4 3M8 17l4 3 4-3" />
      </>
    ),

    table: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 4v16M15 4v16" />
      </>
    ),

    "add-row": (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M3 10h18M12 18v4M10 20h4" />
      </>
    ),

    "add-column": (
      <>
        <rect x="3" y="4" width="14" height="16" rx="2" />
        <path d="M10 4v16M20 9v6M17 12h6" />
      </>
    ),

    delete: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
      </>
    ),

    image: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9" r="1.5" />
        <path d="m4 17 5-5 4 4 2-2 5 5" />
      </>
    ),

    undo: (
      <>
        <path d="M9 7 4 12l5 5" />
        <path d="M4 12h9a6 6 0 0 1 6 6" />
      </>
    ),

    redo: (
      <>
        <path d="m15 7 5 5-5 5" />
        <path d="M20 12h-9a6 6 0 0 0-6 6" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function isSafeLink(value: string) {
  return /^https?:\/\//i.test(value) || /^mailto:/i.test(value);
}
