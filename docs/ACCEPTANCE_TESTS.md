# Acceptance tests

For Phase 3, follow **PUBLIC_LAUNCH_ACCEPTANCE.md**. The original Phase 1/2 baseline regression checks remain in `tests/` and must continue to pass. Run:

```powershell
node --test tests/test-core.cjs tests/test-phase2.cjs tests/test-phase3.cjs
```

Keep all public backend features disabled until real preview integration is verified.
