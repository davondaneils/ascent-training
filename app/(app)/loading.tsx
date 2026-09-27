/** Simple branded loading state (docs/03-UX.md): wordmark only, no skeleton overload. */
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
      <p className="animate-pulse text-heading text-text-tertiary motion-reduce:animate-none">Ascent</p>
    </div>
  );
}
