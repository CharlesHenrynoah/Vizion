import Link from "next/link"
import { ProjectFormEnhanced } from "@/components/project-form-enhanced"
import ClientLayout from "./ClientLayout"

export default function Home() {
  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col relative z-10">
        <section className="max-w-3xl mx-auto text-center py-20 px-4">
          <h2 className="text-5xl font-bold text-blue-400 mb-4">Vibe Code with your vision 👁️</h2>
          <p className="text-xl text-blue-400 mb-10">
            Vizion AI turns your project idea description into a Kanban board with clear, copy-paste-ready functional tickets for
            your AI IDE
          </p>
          <div className="flex justify-center gap-4 mb-16">
            <Link
              href="/signup"
              className="bg-blue-400 text-white font-medium px-6 py-3 rounded-md transition-all transform hover:-translate-y-0.5 hover:bg-blue-300"
            >
              Create New Project
            </Link>
          </div>
        </section>

        <div className="max-w-4xl w-full mx-auto mb-20 relative px-4">
          <div className="bg-white/60 border border-blue-400/50 rounded-lg p-8 paper-vignette overflow-hidden relative transition-all duration-300 shadow-2xl shadow-black/20">
            <ProjectFormEnhanced />
          </div>
        </div>

        <section id="how-it-works" className="max-w-4xl mx-auto py-12 mb-20 px-4">
          <h3 className="text-3xl font-bold text-blue-400 mb-12 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/60 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">1</span>
              </div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Describe Your Project</h4>
              <p className="text-blue-500">
                Explain the purpose and your inspirations in a simple form. Our AI uses this information to understand
                your vision.
              </p>
            </div>
            <div className="bg-white/60 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">2</span>
              </div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">AI Analyzes and Structures</h4>
              <p className="text-blue-500">
                Our AI analyzes your description and explores similar projects to create an optimal structure with
                meaningful tickets.
              </p>
            </div>
            <div className="bg-white/60 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">3</span>
              </div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Get Your Kanban Board</h4>
              <p className="text-blue-500">
                Receive a complete Kanban board with functional tickets that you can customize, organize, and enhance with
                AI suggestions.
              </p>
            </div>
            <div className="bg-white/60 p-6 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">4</span>
              </div>
              <h4 className="text-lg font-semibold text-blue-400 mb-2">Copy and Paste to your AI IDE</h4>
              <p className="text-blue-500">
                Copy and Paste Tickets in your AI IDE and just Vibe Code...
              </p>
            </div>
          </div>
        </section>
        
        {/* Add a spacer div to ensure full height coverage */}
        <div className="flex-grow"></div>
      </div>
    </ClientLayout>
  )
}
