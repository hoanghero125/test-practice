// Aggregator — defines the final SUBJECTS global in order.
// Each subject file (pldc.js, triet_hoc.js, ...) registers itself
// onto window.SUBJECTS_DATA. This file freezes the order the user
// sees in the dropdown and the default selection.
const SUBJECTS = (window.SUBJECTS_DATA && window.SUBJECTS_DATA.triet_hoc)
  ? (window.SUBJECTS_DATA.pldc ? window.SUBJECTS_DATA : { triet_hoc: window.SUBJECTS_DATA.triet_hoc })
  : (window.SUBJECTS_DATA || {});

// Dropdown groups (rendered as <optgroup>), top to bottom.
const SUBJECT_GROUPS = [
  { label: 'Năm 3', subjects: ['ktct', 'csdl'] },
  { label: 'Năm 2', subjects: ['triet_hoc', 'pldc'] },
];
const SUBJECT_ORDER = SUBJECT_GROUPS.flatMap(g => g.subjects);
const DEFAULT_SUBJECT = 'ktct';
