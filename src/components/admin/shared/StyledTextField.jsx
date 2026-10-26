/**
 * StyledTextField
 *
 * Thin wrapper around MUI's TextField that bakes in a fix for a RECURRING
 * bug, not a decorative default: TextField labels getting visually cropped/
 * overlapped by the input border, seen repeatedly during tonight's build
 * (Edit Treatment's Treatment Name field, and other newly-added fields
 * elsewhere). Each occurrence so far was patched individually with
 * `InputLabelProps={{ shrink: true }}` -- this component makes that fix the
 * DEFAULT for every new TextField going forward, so the same bug class
 * doesn't keep recurring one field at a time.
 *
 * Why `shrink: true` fixes it: it permanently keeps the label in its small,
 * "floated above the outline notch" position, instead of MUI's default
 * dynamic behaviour (label sits at input height until focus/value changes
 * it). The dynamic path is fine for a plain static field, but is prone to
 * rendering the label oversized/overlapping the outline in dynamic layouts
 * (fields that appear conditionally, live inside flex/grid rows with
 * shifting widths, or start with a non-empty value on mount). Confirmed as
 * the established fix pattern already used elsewhere in this codebase --
 * e.g. BlogEditor's Slug field (commit 84c5ce7, "Slug label no longer
 * overlaps input value (shrink fixed...)") and AddAppointmentModal's
 * Date/Time fields.
 *
 * Usage: swap `TextField` for `StyledTextField` on any new/edited field.
 * All props pass through unchanged. If a field has a genuine reason not to
 * force shrink, pass `InputLabelProps={{ shrink: false }}` (or any other
 * override) explicitly -- this wrapper only supplies a DEFAULT, it never
 * clobbers a caller-supplied InputLabelProps.
 */
import React from "react";
import TextField from "@mui/material/TextField";

const StyledTextField = React.forwardRef(({ InputLabelProps, ...props }, ref) => (
  <TextField
    ref={ref}
    InputLabelProps={{ shrink: true, ...InputLabelProps }}
    {...props}
  />
));

StyledTextField.displayName = "StyledTextField";

export default StyledTextField;
