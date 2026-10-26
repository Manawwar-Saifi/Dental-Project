/**
 * Rich Text Editor (Tiptap)
 *
 * Toolbar: bold, italic, heading, bullet/ordered list, blockquote, link, image upload.
 * Images support corner-drag resizing and left / centre / right alignment.
 * Images are uploaded to Cloudinary via uploadBlogImage and inserted inline.
 */
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { TextStyle, Color } from "@tiptap/extension-text-style";
import { useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { toast } from "react-toastify";
import { uploadBlogImage } from "../../../api/admin/blogs.api";
import { Box, IconButton, Tooltip, CircularProgress, Divider } from "@mui/material";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ImageIcon from "@mui/icons-material/Image";
import LinkIcon from "@mui/icons-material/Link";
import TableChartIcon from "@mui/icons-material/TableChart";

// ─── Image resize + alignment NodeView ───────────────────────────────────────
const IMG_MIN_W = 80;   // px — minimum draggable width
const IMG_MAX_W = 900;  // px — maximum (clamped at content width in practice by max-width CSS)

/**
 * React NodeView for the resizable + alignable image node.
 * Replaces the built-in ResizableNodeView so both features live in one component.
 *
 * Selected state shows:
 *   - Alignment toolbar (L / C / R icons) floating above the image
 *   - Right-edge drag handle (ew-resize cursor)
 *   - Bottom-right corner drag handle (nwse-resize cursor)
 */
function ImageResizeView({ node, updateAttributes, selected }) {
  const { src, alt, width, alignment } = node.attrs;
  const imgRef = useRef(null);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = imgRef.current?.offsetWidth ?? parseInt(width, 10) ?? 600;

    const onMove = (ev) => {
      const newW = Math.max(IMG_MIN_W, Math.min(IMG_MAX_W, startW + ev.clientX - startX));
      updateAttributes({ width: `${newW}px` });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const align = alignment || "none";
  const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";

  return (
    <NodeViewWrapper
      as="div"
      style={{ display: "block", margin: "1.5rem 0", textAlign, userSelect: selected ? "none" : undefined }}
    >
      {/*
        inline-block span sizes to the image so the resize handles
        always sit at the image's actual edges, regardless of alignment.
      */}
      <span style={{ position: "relative", display: "inline-block", maxWidth: "100%" }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ""}
          className="blog-editor-image"
          draggable={false}
          style={{
            width: width ?? "100%",
            maxWidth: "100%",
            display: "block",
            borderRadius: "0.75rem",
            margin: 0, // block spacing is on NodeViewWrapper; prevent CSS rule doubling it
          }}
        />

        {selected && (
          <>
            {/* Alignment toolbar — centred above the image */}
            <span
              contentEditable={false}
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 4,
                padding: "2px 4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                zIndex: 30,
              }}
            >
              {[
                { val: "left",   Icon: FormatAlignLeftIcon,   label: "Align left" },
                { val: "center", Icon: FormatAlignCenterIcon, label: "Align centre" },
                { val: "right",  Icon: FormatAlignRightIcon,  label: "Align right" },
              ].map(({ val, Icon, label }) => (
                <span
                  key={val}
                  title={label}
                  onMouseDown={(e) => { e.preventDefault(); updateAttributes({ alignment: val }); }}
                  style={{
                    cursor: "pointer",
                    padding: "2px 4px",
                    borderRadius: 3,
                    display: "inline-flex",
                    alignItems: "center",
                    color: align === val ? "#f57c00" : "#6b7280",
                    background: align === val ? "rgba(245,124,0,0.10)" : "transparent",
                  }}
                >
                  <Icon style={{ fontSize: 15 }} />
                </span>
              ))}
            </span>

            {/* Right-edge handle */}
            <span
              contentEditable={false}
              onMouseDown={startResize}
              style={{
                position: "absolute",
                right: -5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                background: "#fff",
                border: "2px solid #f57c00",
                borderRadius: "50%",
                cursor: "ew-resize",
                zIndex: 30,
              }}
            />
            {/* Bottom-right corner handle */}
            <span
              contentEditable={false}
              onMouseDown={startResize}
              style={{
                position: "absolute",
                right: -5,
                bottom: -5,
                width: 10,
                height: 10,
                background: "#fff",
                border: "2px solid #f57c00",
                borderRadius: "50%",
                cursor: "nwse-resize",
                zIndex: 30,
              }}
            />
          </>
        )}
      </span>
    </NodeViewWrapper>
  );
}

// Extend Image at MODULE LEVEL — stable reference that never triggers Tiptap's
// "duplicate extension" check or the reset-storm bug from unstable options.
//
// The built-in Image v3 already carries { src, alt, title, width, height } attrs
// and a `resize` option (ResizableNodeView). We:
//   • Keep all parent attrs via this.parent?.()
//   • Override width's renderHTML to use inline style (better max-width behaviour)
//   • Add `alignment` (data-align on the <img>)
//   • Override addNodeView() so our React component handles both resize + alignment
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      // Inline style width → max-width: 100% constrains it cleanly on narrow screens
      width: {
        default: null,
        parseHTML: (el) => el.style.width || el.getAttribute("width") || null,
        renderHTML: ({ width }) => (width ? { style: `width:${width}` } : {}),
      },
      alignment: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-align") || null,
        renderHTML: ({ alignment }) => (alignment ? { "data-align": alignment } : {}),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageResizeView);
  },
});
// ─────────────────────────────────────────────────────────────────────────────

const ToolbarButton = ({ label, active, onClick, disabled, children }) => (
  <Tooltip title={label}>
    <span>
      <IconButton
        size="small"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        disabled={disabled}
        color={active ? "primary" : "default"}
        sx={active ? { backgroundColor: "rgba(245, 124, 0, 0.1)" } : undefined}
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);

const COLOR_SWATCHES = [
  { label: "Black",  value: "#000000" },
  { label: "Navy",   value: "#003366" },
  { label: "Orange", value: "#f57c00" },
  { label: "Red",    value: "#dc2626" },
  { label: "Green",  value: "#16a34a" },
  { label: "Grey",   value: "#6b7280" },
];

export default function RichTextEditor({ content, onChange, placeholder = "Write your blog post..." }) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [tablePicker, setTablePicker] = useState({ open: false, hoverRow: 0, hoverCol: 0 });
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const fileInputRef = useRef(null);
  const tablePickerRef = useRef(null);
  const colorPickerRef = useRef(null);
  // Tracks whether we have loaded the initial API content into the editor yet.
  // We only ever call setContent() once — when API data arrives after mount.
  const initialContentLoaded = useRef(false);

  // Stable extension array — .configure() returns a new object each call, so
  // memoising here prevents Tiptap v3's compareOptions from detecting a spurious
  // change on every render and calling editor.setOptions() (which resets the
  // document state and silently drops toolbar commands).
  //
  // StarterKit v3 bundles Link internally. Passing Link.configure() separately
  // caused a "Duplicate extension names: ['link']" warning. Fix: disable Link
  // inside StarterKit and keep the explicit Link.configure({ openOnClick: false }).
  //
  // StarterKit does NOT bundle Image — confirmed by grepping its dist. No duplication.
  const extensions = useMemo(
    () => [
      StarterKit.configure({ link: false }),
      ResizableImage.configure({ inline: false, HTMLAttributes: { class: "blog-editor-image" } }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true, cellMinWidth: 40 }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const editor = useEditor({
    extensions,
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // "prose" intentionally omitted — @tailwindcss/typography is not installed.
        class: "min-h-[300px] p-4 pl-10 focus:outline-none",
      },
    },
  });

  // Load API content exactly once, after both editor and content are ready.
  // false as second arg to setContent suppresses the onUpdate event.
  useEffect(() => {
    if (!editor || initialContentLoaded.current || !content) return;
    editor.commands.setContent(content, false);
    initialContentLoaded.current = true;
  }, [editor, content]);

  // Close the table size picker when clicking outside it.
  useEffect(() => {
    if (!tablePicker.open) return;
    const close = (e) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target)) {
        setTablePicker((p) => ({ ...p, open: false }));
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [tablePicker.open]);

  // Close the colour picker when clicking outside it.
  useEffect(() => {
    if (!colorPickerOpen) return;
    const close = (e) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target)) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [colorPickerOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setIsUploadingImage(true);
    try {
      const result = await uploadBlogImage(file);
      const imageUrl = result?.data?.url || result?.url;
      if (imageUrl) {
        const altText = window.prompt("Add alt text for this image (leave blank for decorative images):", "");
        editor.chain().focus().setImage({ src: imageUrl, alt: altText || "" }).run();
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      toast.error(err.response?.data?.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleLinkAdd = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  if (!editor) return null;

  return (
    <Box className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <Box className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <FormatBoldIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <FormatItalicIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>H2</span>
        </ToolbarButton>

        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1 }}>H3</span>
        </ToolbarButton>

        <ToolbarButton
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <FormatQuoteIcon fontSize="small" />
        </ToolbarButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        <ToolbarButton
          label="Bullet List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <FormatListBulletedIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarButton
          label="Numbered List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <FormatListNumberedIcon fontSize="small" />
        </ToolbarButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        <ToolbarButton label="Add Link" active={editor.isActive("link")} onClick={handleLinkAdd}>
          <LinkIcon fontSize="small" />
        </ToolbarButton>

        <ToolbarButton
          label="Insert Image"
          disabled={isUploadingImage}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploadingImage ? <CircularProgress size={18} /> : <ImageIcon fontSize="small" />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageUpload}
        />

        {/* Text colour picker */}
        <div ref={colorPickerRef} style={{ position: "relative", display: "inline-flex" }}>
          <Tooltip title="Text colour">
            <span>
              <IconButton
                size="small"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setColorPickerOpen((o) => !o)}
                sx={colorPickerOpen ? { backgroundColor: "rgba(245,124,0,0.1)" } : undefined}
              >
                <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, lineHeight: 1, color: editor.getAttributes("textStyle").color || "#000000" }}>A</span>
                  <span style={{ width: 14, height: 3, borderRadius: 1, background: editor.getAttributes("textStyle").color || "#000000" }} />
                </span>
              </IconButton>
            </span>
          </Tooltip>

          {colorPickerOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 200,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
              userSelect: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 116 }}>
                {COLOR_SWATCHES.map(({ label, value }) => (
                  <div
                    key={value}
                    title={label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().setColor(value).run();
                      setColorPickerOpen(false);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: value,
                      border: editor.getAttributes("textStyle").color === value
                        ? "2px solid #f57c00"
                        : "2px solid #d1d5db",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
              <div
                title="Remove colour"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().unsetColor().run();
                  setColorPickerOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                  fontSize: 11,
                  color: "#6b7280",
                  fontWeight: 600,
                  padding: "2px 0",
                }}
              >
                <span style={{ width: 22, height: 22, borderRadius: "50%", border: "2px dashed #d1d5db", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#9ca3af" }}>✕</span>
                Remove colour
              </div>
            </div>
          )}
        </div>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

        {/* Table size picker — hover to highlight, click to insert */}
        <div ref={tablePickerRef} style={{ position: "relative", display: "inline-flex" }}>
          <ToolbarButton
            label="Insert Table"
            active={tablePicker.open}
            onClick={() => setTablePicker((p) => ({ ...p, open: !p.open }))}
          >
            <TableChartIcon fontSize="small" />
          </ToolbarButton>

          {tablePicker.open && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                zIndex: 200,
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "10px 10px 8px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.14)",
                userSelect: "none",
              }}
            >
              <div
                style={{ display: "grid", gridTemplateColumns: "repeat(6, 22px)", gap: 3 }}
                onMouseLeave={() => setTablePicker((p) => ({ ...p, hoverRow: 0, hoverCol: 0 }))}
              >
                {Array.from({ length: 36 }, (_, i) => {
                  const row = Math.floor(i / 6);
                  const col = i % 6;
                  const lit = row <= tablePicker.hoverRow && col <= tablePicker.hoverCol;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setTablePicker((p) => ({ ...p, hoverRow: row, hoverCol: col }))}
                      onMouseDown={(e) => {
                        e.preventDefault(); // keep editor focus
                        editor.chain().focus().insertTable({ rows: row + 1, cols: col + 1, withHeaderRow: true }).run();
                        setTablePicker({ open: false, hoverRow: 0, hoverCol: 0 });
                      }}
                      style={{
                        width: 22,
                        height: 22,
                        border: "1px solid",
                        borderColor: lit ? "#f57c00" : "#d1d5db",
                        background: lit ? "rgba(245,124,0,0.13)" : "#f9fafb",
                        borderRadius: 2,
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", fontWeight: 600, marginTop: 6 }}>
                {tablePicker.hoverCol + 1} × {tablePicker.hoverRow + 1}
              </div>
            </div>
          )}
        </div>

        {/* Table management — only shown when cursor is inside a table */}
        {editor.isActive("table") && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            <ToolbarButton label="Add row below" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>+R</span>
            </ToolbarButton>
            <ToolbarButton label="Delete row" onClick={() => editor.chain().focus().deleteRow().run()}>
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>−R</span>
            </ToolbarButton>
            <ToolbarButton label="Add column right" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>+C</span>
            </ToolbarButton>
            <ToolbarButton label="Delete column" onClick={() => editor.chain().focus().deleteColumn().run()}>
              <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>−C</span>
            </ToolbarButton>
            {/* Delete table — red, separated, distinct from structural controls.
                No confirmation dialog: action only appears inside a table, undo (Ctrl+Z)
                covers accidents, and a modal would break editing flow. */}
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />
            <Tooltip title="Delete table (Ctrl+Z to undo)">
              <span>
                <IconButton
                  size="small"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  sx={{ color: "#dc2626", "&:hover": { backgroundColor: "rgba(220,38,38,0.1)" } }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>✕ Table</span>
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Content */}
      <EditorContent editor={editor} />
    </Box>
  );
}
