'use client'

// Shared "unsaved changes" flag for the Tabù forms: ProjectForm sets it, and anything that
// navigates away by code (e.g. the year dropdown) asks confirmLeave() first.

export const UNSAVED_MESSAGE = 'Attenzione: modifiche non salvate. Vuoi uscire senza salvare?'

let dirty = false

export const isDirty = () => dirty
export const setDirty = (value: boolean) => {
  dirty = value
}

// true when it's fine to leave (nothing to lose, or the user confirmed)
export function confirmLeave() {
  if (!dirty || window.confirm(UNSAVED_MESSAGE)) {
    dirty = false
    return true
  }
  return false
}
