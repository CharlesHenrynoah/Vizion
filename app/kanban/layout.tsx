import type { ReactNode } from "react"
import { ProjectSidebar } from "@/components/project-sidebar"

export default function KanbanLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <ProjectSidebar />
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full max-w-full px-4 py-4">{children}</div>
      </div>
    </div>
  )
}

