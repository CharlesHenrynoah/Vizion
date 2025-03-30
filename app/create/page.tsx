import { ProjectForm } from "@/components/project-form"

export default function CreateProject() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Create Your Purposeful Code</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-8">
          Fill in the details below to generate a Kanban board with AI-powered tickets for your project.
        </p>
        <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-sm p-6 backdrop-blur-sm">
          <ProjectForm />
        </div>
      </div>
    </div>
  )
}

