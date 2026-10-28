import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function PageFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`site-shell ${className}`.trim()} id="top">
      <SiteHeader />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
