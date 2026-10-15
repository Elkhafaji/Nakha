import { asset } from "../lib/assets";

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? "logo-compact" : ""}`}>
      <img src={asset("logo")} alt="نكهة" />
    </div>
  );
}
