# Apply this instruction pack safely

This ZIP is an instruction/documentation refresh, not a replacement for the application repository.

1. Unzip it outside the live repository first.
2. Review `AGENTS.md`, `GEMINI.md`, `MEMORY.md`, `ARCHITECTURE.md`, `RULES.md`, and `IMPLEMENTATION_PLAN.md`.
3. Copy the files into the existing repository, preserving the `.agents/skills/hallmark/` folder and all application source/configuration.
4. Replace `.agents/skills/civictech-implementation/SKILL.md` only after reviewing the updated content.
5. Keep your existing `prompts/` directory and replace the two phase prompts after reviewing them.
6. Add `docs/QUALITY_CHECKLIST.md` and `docs/SKILL_CLEANUP.md`.
7. Do not copy this pack's empty directory assumptions over your existing app. The ZIP deliberately does not include `app/`, `src/`, `package.json`, migrations, or environment files.
8. Run the commands in `docs/SKILL_CLEANUP.md` only after verifying the folder paths.
9. Inspect `git diff` before committing.
10. Do not run Phase 1 and Phase 2 prompts together. Finish Phase 1 and its acceptance gate first.
