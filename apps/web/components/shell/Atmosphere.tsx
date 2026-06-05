/** Layered atmospheric background: warm gradient + blueprint grid + grain. */
export function Atmosphere() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="bg-base absolute inset-0" />
      <div className="bg-grid absolute inset-0" />
      <div className="bg-grain absolute inset-0 opacity-[0.05]" />
    </div>
  );
}
