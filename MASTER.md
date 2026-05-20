# MASTER.md — TrelloClone PM Handover Document
## Project Overview
- **Project:** TrelloClone (Frontend-only mock)
- **Live URL:** https://dewainbadial.github.io/trello-clone/
- **Repo:** https://github.com/dewainbadial/trello-clone
- **PM Tool:** Asana — Project: "Trello Clone - Frontend Build"
- **Owner:** Dewain Badial (dewainbadial)
- **PM:** Claude (Anthropic) — Claude Sonnet 4.6
- **Started:** 2026-05-15
- **Last Updated:** 2026-05-20
- **Stack:** Pure HTML + CSS + Vanilla JS, LocalStorage, Google Cloud Storage (stub)

---

## Key Decisions Log
| Date | Decision | Chosen | Reason |
|------|----------|--------|--------|
| 2026-05-15 | Framework | Vanilla JS | No build step, fastest to ship |
| 2026-05-15 | Storage | Google Cloud Storage | Per owner instruction |
| 2026-05-15 | Deploy | GitHub Pages | Free, tied to repo |
| 2026-05-15 | GitHub | dewainbadial (existing) | Already had account |
| 2026-05-15 | Asana | dewainbadial (existing) | Already had account |
| 2026-05-20 | Architecture | Multi-board v2 | Added home screen, board creation |
| 2026-05-20 | Claude Code | GitHub web editor via CM6 API | No desktop app needed |

---

## Architecture
### File Structure
- index.html — Main app (145 lines) — multi-board UI, all modals
- style.css — All styles (1432 lines) — full responsive design
- app.js — All logic (619 lines) — multi-board state, drag-drop, CRUD
- MASTER.md — This file (PM handover, specs, changelog)
- README.md — Basic readme

### State Model (v2)
appState = {
  boards: [{ id, title, bg, lists: [{ id, title, cards: [...] }] }],
  activeBoardId: null,
  nextBoardId, nextListId, nextCardId
}
Persisted to localStorage key: 'trello-clone-v2'

---

## Features — MVP COMPLETE
- [x] Multi-board support (home screen, create/delete boards, color themes)
- [x] Board view with columns (add/rename/delete lists)
- [x] Cards with drag-and-drop between columns
- [x] Card modal: title, description, labels (8 colors), due dates, checklist, attachments
- [x] Card metadata shown on board (due date, checklist progress, attachment count)
- [x] Checklist with progress bar
- [x] File attachments (local URL, GCS stub ready)
- [x] LocalStorage persistence
- [x] Fully responsive (mobile-first)
- [x] GitHub Pages deployment

## Features — PENDING OWNER INPUT
- [ ] Google Cloud Storage integration (needs: GCS project + API key from owner)
- [ ] GCS bucket: 'trello-clone-attachments' (owner must create)

---

## Master Prompt for New PM/EPD
**Context:** This is a frontend-only Trello clone at https://dewainbadial.github.io/trello-clone/

**How to update code:**
1. Go to https://github.com/dewainbadial/trello-clone/edit/main/[file]
2. Open browser DevTools console
3. Run: function replaceEditorContent(text) { const c = document.querySelector('.cm-content'); c.focus(); document.execCommand('selectAll',false,null); return document.execCommand('insertText',false,text); }
4. Call: replaceEditorContent(YOUR_NEW_CODE)
5. Click "Commit changes..." button

**Next PM tasks:**
1. Get GCS API key from owner → set window.GCS_CONFIG.apiKey and .enabled=true in index.html
2. Add card search/filter
3. Add card cover images
4. Add board background images

---

## Commit History
| Commit | Message | Date |
|--------|---------|------|
| ae36b4f | Create app.js | 2026-05-15 |
| 494dce7 | Create index.html | 2026-05-15 |
| [sha] | Create style.css | 2026-05-15 |
| [sha] | Create MASTER.md | 2026-05-15 |
| 8a28f91 | feat: v2 multi-board support, improved state management | 2026-05-20 |
| f53e529 | feat: v2 multi-board UI - home screen, create board modal | 2026-05-20 |
| fbffa5e | feat: v2 styles - boards home, create board modal, bg picker | 2026-05-20 |
| 348851b | fix: syntax error in renderModalLabels onclick handler | 2026-05-20 |

---

## Task Status (Asana Sync)
### Setup & Infrastructure — DONE
- [x] Create GitHub repo (trello-clone)
- [x] Create MASTER.md PM handover file in repo
- [x] Design & set up Claude Code in browser as EPD
- [x] Design board layout - columns, cards, header
- [x] Design card component with title, description, labels
- [x] Design responsive mobile layout
- [ ] Set up Google Cloud project for storage (PENDING owner)

### Development — DONE
- [x] Build board view with draggable columns
- [x] Implement drag-and-drop card movement
- [x] Add/edit/delete cards and columns
- [x] Card labels, due dates, checklist features
- [ ] Google Cloud Storage integration (PENDING API key)

### QA & Deploy — DONE
- [x] Push all code to GitHub repo
- [x] Deploy to GitHub Pages
- [x] Cross-browser QA testing (manual)
- [x] Write MASTER.md final handover notes

---

## GCS Setup Instructions (For Owner)
When you have a GCS project ready, provide:
1. Bucket name (default: 'trello-clone-attachments')
2. API key (restricted to Cloud Storage API)

Then in index.html, update:
window.GCS_CONFIG = {
  bucketName: 'YOUR_BUCKET',
  apiKey: 'YOUR_API_KEY',
  enabled: true
};

The uploadToGCS() function in app.js will need the signed URL endpoint.
Recommend: use Firebase Storage instead (simpler auth).

---

*This document is the single source of truth for the TrelloClone project.*
*A new PM can pick up this project by reading this file only.*
