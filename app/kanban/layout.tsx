import { ReactNode } from "react"
import { ProjectSidebar } from "@/components/project-sidebar"

// Ce layout est utilisé uniquement pour la page Kanban
// Il n'inclut ni header ni footer
export const metadata = {
  title: "Vizion AI - Project Board",
}

export default function KanbanLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-white via-blue-100 to-blue-200 bg-fixed">
      <ProjectSidebar />
      <main className="flex-1 ml-64 p-6">
        {children}
      </main>
    </div>
  )
}
