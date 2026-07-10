import type { ReactNode } from "react";
import "./backlog.css";
import { BacklogProvider } from "@/lib/backlog/store";
import BacklogNav from "@/components/backlog/BacklogNav";

export const metadata = {
  title: "SNAP AI — Backlog Command Center",
};

export default function BacklogLayout({ children }: { children: ReactNode }) {
  return (
    <BacklogProvider>
      <div className="bk-root">
        <BacklogNav />
        {children}
      </div>
    </BacklogProvider>
  );
}
