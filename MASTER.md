# MASTER.md — Trello Clone PM Handover Document

## Project Overview
- **Project:** Trello Clone (Frontend-only mock)
- **Repo:** https://github.com/dewainbadial/trello-clone
- **PM Tool:** Asana — Project: "Trello Clone - Frontend Build"
- **Owner:** Uldis Leiterts
- **PM:** Claude (Anthropic)
- **Started:** 2026-05-15
- **Stack:** Pure HTML + CSS + Vanilla JS, LocalStorage, Google Cloud Storage

## Key Decisions Log
| Date | Decision | Chosen | Reason |
|------|----------|--------|--------|
| 2026-05-15 | Framework | Vanilla JS | No build step, fastest to ship |
| 2026-05-15 | Storage | Google Cloud Storage | Per owner instruction |
| 2026-05-15 | Deploy | GitHub Pages | Free, tied to repo |
| 2026-05-15 | GitHub | dewainbadial (new) | Created per owner request |

## File Structure
- index.html — Main app
- style.css — All styles
- app.js — All logic
- MASTER.md — This file

## Features (MVP)
- Multiple boards, columns, cards
- Drag-and-drop cards
- Card labels, due dates, checklists
- File attachments via Google Cloud Storage
- Fully responsive

## Master Prompt for EPD
Build a frontend-only Trello clone: HTML + CSS + Vanilla JS.
Board view with draggable columns, add/edit/delete cards, drag-and-drop via HTML5,
card labels/due dates/checklists, GCS file attachments, LocalStorage state, responsive UI.

## Pending Owner Input
- Google Cloud project + GCS API key for attachments
- Confirm GitHub Pages deployment

## Task Status
- GitHub repo: DONE
- MASTER.md: DONE
- index.html + style.css + app.js: IN PROGRESS
- GCS setup: PENDING owner API key
- Deploy: PENDING
