import Link from "next/link";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Still home">
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      still<span className="brand-period">.</span>
    </Link>
  );
}
export function Sculpture() {
  return (
    <div className="sculpture" aria-hidden="true">
      <div className="sculpture-halo" />
      <div className="sculpture-shadow" />
      <div className="sculpture-ring ring-back" />
      <div className="sculpture-ring ring-front" />
      <div className="sculpture-pebble" />
    </div>
  );
}
