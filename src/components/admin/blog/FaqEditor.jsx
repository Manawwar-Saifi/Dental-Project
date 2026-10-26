import { Box, TextField, IconButton, Button, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FaqAnswerEditor from "./FaqAnswerEditor";

export default function FaqEditor({ faqs, onChange }) {
  const add = () => onChange([...faqs, { question: "", answer: "" }]);
  const remove = (i) => onChange(faqs.filter((_, idx) => idx !== i));
  const moveUp = (i) => {
    if (i === 0) return;
    const f = [...faqs];
    [f[i - 1], f[i]] = [f[i], f[i - 1]];
    onChange(f);
  };
  const moveDown = (i) => {
    if (i === faqs.length - 1) return;
    const f = [...faqs];
    [f[i], f[i + 1]] = [f[i + 1], f[i]];
    onChange(f);
  };
  const update = (i, field, value) => {
    const f = [...faqs];
    f[i] = { ...f[i], [field]: value };
    onChange(f);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {faqs.map((faq, i) => (
        <Box
          key={i}
          sx={{ border: "1px solid", borderColor: "grey.200", borderRadius: 1, p: 2 }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              FAQ {i + 1}
            </Typography>
            <Box>
              <Tooltip title="Move up">
                <span>
                  <IconButton size="small" onClick={() => moveUp(i)} disabled={i === 0}>
                    <KeyboardArrowUpIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => moveDown(i)}
                    disabled={i === faqs.length - 1}
                  >
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton size="small" onClick={() => remove(i)} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <TextField
            fullWidth
            label="Question"
            size="small"
            value={faq.question}
            onChange={(e) => update(i, "question", e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ mb: 1.5 }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.75 }}
          >
            Answer
          </Typography>
          <FaqAnswerEditor
            content={faq.answer}
            onChange={(val) => update(i, "answer", val)}
          />
        </Box>
      ))}
      <Button
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={add}
        sx={{ alignSelf: "flex-start" }}
      >
        Add FAQ
      </Button>
    </Box>
  );
}
