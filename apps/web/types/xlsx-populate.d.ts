// Minimal ambient module declaration for xlsx-populate (no official types).
// xlsx-populate is dynamically-typed JS; we treat it as `any` and rely on
// runtime tests in apps/web/lib/xlsx-fill.test.ts to guard correctness.
declare module 'xlsx-populate';
