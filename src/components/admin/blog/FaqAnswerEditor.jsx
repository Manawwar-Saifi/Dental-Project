import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useMemo, useRef, useEffect } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";

export default function FaqAnswerEditor({ content, onChange }) {
  const initialLoaded = useRef(false);

  // Each FAQ answer editor has its own useMemo([], []) extensions array —
  // never shared between instances or with the main RichTextEditor.
  const extensions = useMemo(() => [
    StarterKit.configure({ link: false, heading: false }),
    Link.configure({ openOnClick: false }),
  ], []);

  const editor = useEditor({
    extensions,
    content: content || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "min-h-[80px] p-2 focus:outline-none text-sm" },
    },
  });

  useEffect(() => {
    if (!editor || initialLoaded.current || !content) return;
    editor.commands.setContent(content, false);
    initialLoaded.current = true;
  }, [editor, content]);

  if (!editor) return null;

  return (
    <Box className="border border-gray-200 rounded-lg overflow-hidden">
      <Box className="flex gap-0.5 px-1.5 py-1 bg-gray-50 border-b border-gray-200">
        <Tooltip title="Bold">
          <span>
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive("bold") ? "primary" : "default"}
            >
              <FormatBoldIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive("italic") ? "primary" : "default"}
            >
              <FormatItalicIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Bullet list">
          <span>
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive("bulletList") ? "primary" : "default"}
            >
              <FormatListBulletedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Link">
          <span>
            <IconButton
              size="small"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const u = window.prompt("URL:");
                if (u) editor.chain().focus().setLink({ href: u }).run();
              }}
              color={editor.isActive("link") ? "primary" : "default"}
            >
              <LinkIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <EditorContent editor={editor} />
    </Box>
  );
}
