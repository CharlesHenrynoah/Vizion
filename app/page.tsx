import Link from "next/link"
import { ProjectForm } from "@/components/project-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-purple-950 text-white flex flex-col">
      <section className="max-w-3xl mx-auto text-center py-20 px-4">
        <h2 className="text-5xl font-bold text-white mb-4">Vibe Code with Vision 👁️</h2>
        <p className="text-xl text-slate-300 mb-10">
          zeway turns your project description into a Kanban board with clear, copy-paste-ready functional tickets for
          your AI IDE
        </p>
        <div className="flex justify-center gap-4 mb-16">
          <Link
            href="/create"
            className="bg-purple-600 text-white font-medium px-6 py-3 rounded-md transition-all transform hover:-translate-y-0.5 hover:bg-purple-500"
          >
            Create New Project
          </Link>
        </div>
      </section>

      <div className="max-w-4xl w-full mx-auto mb-20 relative px-4">
        <div className="bg-gray-900/80 border border-purple-800/50 rounded-lg p-8 paper-vignette overflow-hidden relative transition-all duration-300 shadow-2xl shadow-black/50">
          {/* Motif de vague subtil */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] overflow-hidden pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
              <path
                d="M0,100 C150,50 350,150 500,100 C650,50 700,150 900,100 C1050,50 1150,150 1200,100 L1200,600 L0,600 Z"
                className="fill-purple-700"
              />
              <path
                d="M0,200 C150,150 350,250 500,200 C650,150 700,250 900,200 C1050,150 1150,250 1200,200 L1200,600 L0,600 Z"
                className="fill-purple-800"
                transform="translate(0,20)"
              />
              <path
                d="M0,300 C150,250 350,350 500,300 C650,250 700,350 900,300 C1050,250 1150,350 1200,300 L1200,600 L0,600 Z"
                className="fill-purple-900"
                transform="translate(0,40)"
              />
            </svg>
          </div>

          <ProjectForm />
        </div>
      </div>

      <section id="how-it-works" className="max-w-4xl mx-auto py-12 mb-20 px-4">
        <h3 className="text-3xl font-bold text-white mb-12 text-center">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-black bg-opacity-40 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-bold">1</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Describe Your Project</h4>
            <p className="text-slate-300">
              Explain the purpose and your inspirations in a simple form. Our AI uses this information to understand
              your vision.
            </p>
          </div>
          <div className="bg-black bg-opacity-40 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-bold">2</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">AI Analyzes and Structures</h4>
            <p className="text-slate-300">
              Our AI analyzes your description and explores similar projects to create an optimal structure with
              meaningful tickets.
            </p>
          </div>
          <div className="bg-black bg-opacity-40 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-bold">3</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Get Your Kanban Board</h4>
            <p className="text-slate-300">
              Receive a complete Kanban board with functional tickets that you can customize, organize, and enhance with
              AI suggestions.
            </p>
          </div>
          <div className="bg-black bg-opacity-40 p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-xl font-bold">4</span>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">Copy and Paste to your AI IDE</h4>
            <p className="text-slate-300">
              Copy and Paste Tickets in your AI IDE and just Vibe Code...
            </p>
          </div>
        </div>
      </section>
      
      {/* Add a spacer div to ensure full height coverage */}
      <div className="flex-grow"></div>
    </div>
  )
}
