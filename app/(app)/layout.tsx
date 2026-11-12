import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/interface/workspace-shell";

/** Chrome (top bar / mobile nav) only for the authenticated app area. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
