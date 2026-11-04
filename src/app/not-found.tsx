import { Shell } from "@/components/ui";
import Bi from "@/components/Bi";
import { withBase } from "@/lib/base";

export default function NotFound() {
  return (
    <Shell className="flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-mono text-6xl font-semibold tracking-tight text-signal">404</p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        <Bi k="nf.title" />
      </h1>
      <p className="mt-2 text-sm text-mut">
        <Bi k="nf.body" />
      </p>
      <a href={withBase("/")} className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium">
        <Bi k="nf.home" /> <span aria-hidden>→</span>
      </a>
    </Shell>
  );
}
