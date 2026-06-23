// Aggregator — defines the final SUBJECTS global in order.
// Each subject file (pldc.js, triet_hoc.js, ...) registers itself
// onto window.SUBJECTS_DATA. This file freezes the order the user
// sees in the dropdown and the default selection.
const SUBJECTS = (window.SUBJECTS_DATA && window.SUBJECTS_DATA.triet_hoc)
  ? (window.SUBJECTS_DATA.pldc ? window.SUBJECTS_DATA : { triet_hoc: window.SUBJECTS_DATA.triet_hoc })
  : (window.SUBJECTS_DATA || {});

const SUBJECT_ORDER = ['triet_hoc', 'pldc'];
const DEFAULT_SUBJECT = 'triet_hoc';
