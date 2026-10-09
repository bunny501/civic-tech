"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { mockProjects } from "@/lib/data";
import { detectConflicts } from "@/lib/conflicts";
import { analyzeDelay } from "@/lib/timeline";
import { AlertTriangle, Clock, MapPin, Building, Calendar, Info, FileText } from "lucide-react";
import { Project } from "@/lib/types";

// Dynamically import map to avoid SSR window errors
const CivicMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Workspace() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<'directory' | 'agent'>('directory');
  
  const [agentInput, setAgentInput] = useState("");
  const [agentMessages, setAgentMessages] = useState<{role: string, content: string}[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  const handleAgentSubmit = async () => {
    if (!agentInput.trim()) return;
    const prompt = agentInput;
    setAgentInput("");
    setAgentMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsAgentTyping(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setAgentMessages(prev => [...prev, { role: 'agent', content: data.text }]);
      } else {
        setAgentMessages(prev => [...prev, { role: 'agent', content: `Error: ${data.error}` }]);
      }
    } catch (e: any) {
      setAgentMessages(prev => [...prev, { role: 'agent', content: `Network Error: ${e.message}` }]);
    } finally {
      setIsAgentTyping(false);
    }
  };
  
  // Calculate conflicts deterministically
  const conflicts = useMemo(() => detectConflicts(mockProjects), []);
  
  const filteredProjects = useMemo(() => {
    return mockProjects.filter(p => {
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterWorkType !== "all" && p.workType !== filterWorkType) return false;
      return true;
    });
  }, [filterStatus, filterWorkType]);

  const selectedProject = mockProjects.find(p => p.id === selectedProjectId) || null;
  
  // Find conflicts involving the selected project
  const projectConflicts = selectedProject 
    ? conflicts.filter(c => c.projectIds.includes(selectedProject.id))
    : [];

  const delayFinding = selectedProject ? analyzeDelay(selectedProject) : null;

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      {/* N6 Newspaper Masthead */}
      <header className="flex-none border-b border-ink-3 px-6 py-4 flex flex-col items-center justify-center bg-paper relative z-10 shadow-sm">
        <div className="absolute left-6 text-xs tracking-widest uppercase text-ink-2">Vol. 1</div>
        <h1 className="text-4xl md:text-5xl font-display tracking-tight text-ink uppercase">CivicTech</h1>
        <div className="w-full flex justify-between items-end mt-2 pt-2 border-t border-ink-3 text-xs uppercase tracking-widest text-ink-2 font-sans">
          <span>Public Works Intelligence</span>
          <span>Date: Today</span>
        </div>
      </header>

      {/* Main Workspace: 19 Map / Diagram layout */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left Panel: Directory & Filters & Agent */}
        <aside className="w-full md:w-[400px] flex-none bg-paper border-r border-ink-3 flex flex-col overflow-hidden z-10 shadow-md">
          <div className="flex border-b border-ink-3 font-sans text-xs uppercase tracking-widest font-semibold bg-paper-2">
            <button 
              className={`flex-1 py-3 text-center border-r border-ink-3 transition-colors ${activeTab === 'directory' ? 'bg-paper text-ink border-b-2 border-b-ink' : 'text-ink-2 hover:bg-paper'}`}
              onClick={() => setActiveTab('directory')}
            >
              Directory
            </button>
            <button 
              className={`flex-1 py-3 text-center transition-colors ${activeTab === 'agent' ? 'bg-paper text-ink border-b-2 border-b-ink' : 'text-ink-2 hover:bg-paper'}`}
              onClick={() => setActiveTab('agent')}
            >
              Agent
            </button>
          </div>
          
          {activeTab === 'directory' ? (
            <>
              <div className="p-4 border-b border-ink-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-sans uppercase tracking-widest font-semibold">Directory Filters</h2>
                  <label className="cursor-pointer text-xs uppercase tracking-widest text-accent underline hover:text-accent-2">
                    Upload Notice
                    <input 
                      type="file" 
                      accept="application/pdf"
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        alert('Uploading and analyzing notice...');
                        try {
                          const res = await fetch('/api/ingest', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (res.ok) alert(`Success! Extracted: ${data.data.title}`);
                          else alert(`Error: ${data.error}`);
                        } catch (err) {
                          alert('Upload failed.');
                        }
                      }} 
                    />
                  </label>
                </div>
                <div className="flex gap-2 flex-col font-sans text-sm">
                  <label className="flex items-center justify-between">
                    <span className="text-ink-2">Status</span>
                    <select 
                      className="bg-transparent border border-ink-3 px-2 py-1 outline-none focus:border-ink"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="planned">Planned</option>
                      <option value="delayed">Delayed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-ink-2">Work Type</span>
                    <select 
                      className="bg-transparent border border-ink-3 px-2 py-1 outline-none focus:border-ink"
                      value={filterWorkType}
                      onChange={e => setFilterWorkType(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="road">Road</option>
                      <option value="water">Water</option>
                      <option value="electrical">Electrical</option>
                    </select>
                  </label>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0">
                {filteredProjects.length === 0 ? (
                  <div className="p-6 text-center text-ink-2 italic font-serif">No projects match your criteria.</div>
                ) : (
                  <ul className="divide-y divide-ink-3/30">
                    {filteredProjects.map(proj => (
                      <li key={proj.id}>
                        <button 
                          onClick={() => setSelectedProjectId(proj.id)}
                          className={`w-full text-left p-4 hover:bg-paper-2 transition-colors focus:outline-none focus:bg-paper-2 ${selectedProjectId === proj.id ? 'bg-paper-2 border-l-2 border-ink' : 'border-l-2 border-transparent'}`}
                        >
                          <h3 className="font-display text-lg leading-tight mb-1">{proj.title}</h3>
                          <div className="flex items-center gap-2 font-sans text-xs text-ink-2 uppercase tracking-wide">
                            <span className="capitalize">{proj.status}</span>
                            <span>·</span>
                            <span className="capitalize">{proj.workType}</span>
                          </div>
                          {!proj.latitude && (
                            <div className="mt-2 text-xs text-accent italic flex items-center gap-1">
                              <MapPin size={12} /> No coordinates available
                            </div>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col p-4 font-sans text-sm h-full">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {agentMessages.map((msg, i) => (
                  <div key={i} className={`p-3 border ${msg.role === 'user' ? 'bg-paper-2 border-ink-3 ml-4' : 'bg-paper border-ink-2 mr-4'}`}>
                    <div className="font-semibold text-xs uppercase tracking-widest mb-1 text-ink-2">{msg.role}</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {isAgentTyping && (
                  <div className="p-3 border bg-paper border-ink-2 mr-4 text-ink-2 italic">Agent is investigating...</div>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAgentSubmit()}
                  placeholder="Ask about projects..."
                  className="flex-1 bg-transparent border border-ink-3 px-3 py-2 outline-none focus:border-ink"
                  disabled={isAgentTyping}
                />
                <button 
                  onClick={handleAgentSubmit}
                  disabled={isAgentTyping}
                  className="px-4 py-2 border border-ink-3 uppercase tracking-widest text-xs hover:bg-paper-2 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Center Panel: Map */}
        <section className="flex-1 relative bg-paper-2 min-h-[40vh] md:min-h-0">
          <CivicMap 
            projects={filteredProjects} 
            conflicts={conflicts} 
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />
        </section>

        {/* Right Panel: Detail View */}
        {selectedProject && (
          <aside className="w-full md:w-96 flex-none bg-paper border-l border-ink-3 flex flex-col overflow-y-auto shadow-[-4px_0_12px_rgba(0,0,0,0.05)] z-10 absolute md:relative right-0 h-full md:h-auto">
            <div className="p-4 border-b border-ink-3 sticky top-0 bg-paper flex justify-between items-center">
              <h2 className="text-sm font-sans uppercase tracking-widest font-semibold">Project Details</h2>
              <button onClick={() => setSelectedProjectId(null)} className="text-ink-2 hover:text-ink font-sans text-xs uppercase tracking-widest">Close [×]</button>
            </div>
            
            <div className="p-6 font-sans">
              <div className="mb-6">
                <span className={`inline-block px-2 py-1 text-xs uppercase tracking-widest border mb-3 ${
                  selectedProject.status === 'delayed' ? 'border-accent text-accent' :
                  selectedProject.status === 'ongoing' ? 'border-status-ongoing text-status-ongoing' :
                  'border-ink-2 text-ink-2'
                }`}>
                  {selectedProject.status}
                </span>
                <h1 className="font-display text-2xl leading-tight mb-2">{selectedProject.title}</h1>
                <p className="text-sm text-ink-2 leading-relaxed">{selectedProject.description}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-ink-3 italic">
                  Data origin: <span className="uppercase">{selectedProject.dataOrigin}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 mb-8">
                <div className="flex gap-3 text-sm items-start">
                  <Building size={16} className="text-ink-2 mt-0.5" />
                  <div>
                    <div className="font-semibold">{selectedProject.department || 'Unknown Dept'}</div>
                    <div className="text-ink-2 text-xs">Contractor: {selectedProject.contractor || 'TBD'}</div>
                  </div>
                </div>
                
                <div className="flex gap-3 text-sm items-start">
                  <MapPin size={16} className="text-ink-2 mt-0.5" />
                  <div>
                    <div className="font-semibold">{selectedProject.addressText}</div>
                    {selectedProject.latitude ? (
                      <div className="text-ink-2 text-xs">{selectedProject.latitude.toFixed(4)}, {selectedProject.longitude?.toFixed(4)}</div>
                    ) : (
                      <div className="text-accent text-xs italic">Geospatial data missing</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 text-sm items-start">
                  <Calendar size={16} className="text-ink-2 mt-0.5" />
                  <div>
                    <div className="font-semibold">Schedule</div>
                    <div className="text-ink-2 text-xs tabular-nums">
                      Planned: {selectedProject.plannedStartDate || '?'} to {selectedProject.plannedEndDate || '?'}
                    </div>
                    {(selectedProject.actualStartDate || selectedProject.actualEndDate) && (
                      <div className="text-ink-2 text-xs tabular-nums mt-0.5">
                        Actual: {selectedProject.actualStartDate || '?'} to {selectedProject.actualEndDate || 'Present'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timeline & Accountability */}
              {delayFinding && (
                <div className="mb-8 border border-ink-3 p-4 bg-paper-2">
                  <h3 className="text-sm font-sans uppercase tracking-widest font-semibold flex items-center gap-2 mb-2">
                    <Clock size={14} /> Schedule Analysis
                  </h3>
                  <p className="text-sm">
                    {delayFinding.isOverdue ? (
                      <span className="text-accent font-semibold">Overdue by {delayFinding.daysLate} days.</span>
                    ) : delayFinding.isLateCompleted ? (
                      <span className="text-ink font-semibold">Completed {delayFinding.daysLate} days late.</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-ink-2 mt-2 leading-relaxed">{delayFinding.reason}</p>
                  <p className="text-xs text-ink-3 italic mt-1">(A missing explanation indicates no explanation is recorded in the available data.)</p>
                </div>
              )}

              {/* Conflict Evidence */}
              {projectConflicts.length > 0 && (
                <div className="mb-8 border border-accent p-4 bg-paper">
                  <h3 className="text-sm font-sans uppercase tracking-widest text-accent font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} /> Coordination Conflicts
                  </h3>
                  <div className="flex flex-col gap-4">
                    {projectConflicts.map(conflict => {
                      const otherId = conflict.projectIds.find(id => id !== selectedProject.id);
                      const otherProject = mockProjects.find(p => p.id === otherId);
                      return (
                        <div key={conflict.id} className="text-sm border-t border-ink-3/30 pt-3 first:border-0 first:pt-0">
                          <div className="font-semibold mb-1 capitalize text-accent">{conflict.type.replace('_', ' ')}</div>
                          <p className="text-xs mb-2">With: <span className="font-semibold">{otherProject?.title || otherId}</span></p>
                          <p className="text-xs text-ink-2 leading-relaxed mb-1">{conflict.reason}</p>
                          <ul className="text-xs text-ink-2 list-disc pl-4 space-y-1 mt-2">
                            {conflict.temporalBasis && <li>{conflict.temporalBasis}</li>}
                            {conflict.spatialBasis && <li>{conflict.spatialBasis}</li>}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Source Records */}
              <div className="border-t border-ink-3 pt-6 mt-auto">
                <h3 className="text-sm font-sans uppercase tracking-widest font-semibold flex items-center gap-2 mb-3">
                  <FileText size={14} /> Source Records
                </h3>
                <ul className="flex flex-col gap-2">
                  {selectedProject.sourceIds.map(src => (
                    <li key={src} className="text-sm flex items-center gap-2">
                      <a href="#" className="text-ink underline hover:text-accent font-mono text-xs">{src}</a>
                    </li>
                  ))}
                  {selectedProject.sourceIds.length === 0 && (
                    <li className="text-xs text-ink-3 italic">No sources attached.</li>
                  )}
                </ul>
              </div>

            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
