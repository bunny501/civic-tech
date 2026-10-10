"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { mockProjects as initialProjects } from "@/lib/data";
import { detectConflicts } from "@/lib/conflicts";
import { analyzeDelay } from "@/lib/timeline";
import { getDistance } from "@/lib/neighborhood";
import { Project } from "@/lib/types";
import { 
  AlertTriangle, 
  Clock, 
  MapPin, 
  Building, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Compass,
  CheckCircle2,
  X,
  Upload,
  Info,
  ShieldAlert
} from "lucide-react";

// Dynamically import map to avoid SSR window errors
const CivicMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Workspace() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<'directory' | 'neighborhood' | 'agent'>('directory');
  
  // Agent State
  const [agentInput, setAgentInput] = useState("");
  const [agentMessages, setAgentMessages] = useState<{role: string, content: string}[]>([]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // Ingestion / PDF Extraction State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [extractedNotice, setExtractedNotice] = useState<{
    data: {
      title: string;
      description: string;
      department: string | null;
      contractor: string | null;
      plannedStartDate: string | null;
      plannedEndDate: string | null;
      addressText: string;
      uncertainFields: string[];
    };
    sourceTitle: string;
    extractedTextPreview?: string;
  } | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Neighborhood Impact State
  const [neighborhoodLat, setNeighborhoodLat] = useState<number>(40.7128);
  const [neighborhoodLon, setNeighborhoodLon] = useState<number>(-74.0060);
  const [neighborhoodRadius, setNeighborhoodRadius] = useState<number>(500);

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
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(10000)
      });
      const data = await res.json();
      if (res.ok) {
        setAgentMessages(prev => [...prev, { role: 'agent', content: data.text }]);
      } else {
        setAgentMessages(prev => [...prev, { role: 'agent', content: `Error: ${data.error}` }]);
      }
    } catch (e: any) {
      if (e.name === 'TimeoutError' || e.name === 'AbortError') {
        setAgentMessages(prev => [...prev, { role: 'agent', content: 'Investigation request timed out. Please ask again.' }]);
      } else {
        setAgentMessages(prev => [...prev, { role: 'agent', content: `Network Error: ${e.message}` }]);
      }
    } finally {
      setIsAgentTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || 'Failed to parse notice');
        alert(`Ingestion error: ${json.error || 'Failed to parse notice'}`);
      } else {
        setExtractedNotice({
          data: json.data,
          sourceTitle: json.sourceTitle || file.name,
          extractedTextPreview: json.extractedTextPreview
        });
        setShowNoticeModal(true);
      }
    } catch (err: any) {
      setUploadError(err.message || 'Network upload failed');
      alert(`Network error: ${err.message || 'Upload failed'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAcceptNotice = () => {
    if (!extractedNotice) return;
    const newId = `notice-${Date.now()}`;
    const newProject: Project = {
      id: newId,
      title: extractedNotice.data.title,
      description: extractedNotice.data.description,
      workType: 'road',
      department: extractedNotice.data.department,
      contractor: extractedNotice.data.contractor,
      status: 'planned',
      plannedStartDate: extractedNotice.data.plannedStartDate,
      plannedEndDate: extractedNotice.data.plannedEndDate,
      actualStartDate: null,
      actualEndDate: null,
      updatedAt: new Date().toISOString(),
      addressText: extractedNotice.data.addressText,
      latitude: 40.7140, // Cluster near active center
      longitude: -74.0080,
      sourceIds: [extractedNotice.sourceTitle],
      dataOrigin: 'public'
    };

    setProjects(prev => [newProject, ...prev]);
    setSelectedProjectId(newId);
    setShowNoticeModal(false);
    setExtractedNotice(null);
  };
  
  // Calculate conflicts deterministically over stateful projects list
  const conflicts = useMemo(() => detectConflicts(projects), [projects]);
  
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterWorkType !== "all" && p.workType !== filterWorkType) return false;
      return true;
    });
  }, [projects, filterStatus, filterWorkType]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  
  // Find conflicts involving the selected project
  const projectConflicts = selectedProject 
    ? conflicts.filter(c => c.projectIds.includes(selectedProject.id))
    : [];

  const delayFinding = selectedProject ? analyzeDelay(selectedProject) : null;

  // Neighborhood proximity calculations
  const neighborhoodProjects = useMemo(() => {
    return projects
      .filter(p => p.latitude !== null && p.longitude !== null)
      .map(p => {
        const distance = getDistance(neighborhoodLat, neighborhoodLon, p.latitude!, p.longitude!);
        return { project: p, distance: Math.round(distance) };
      })
      .filter(item => item.distance <= neighborhoodRadius)
      .sort((a, b) => a.distance - b.distance);
  }, [projects, neighborhoodLat, neighborhoodLon, neighborhoodRadius]);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-paper text-ink">
      {/* N6 Newspaper Masthead */}
      <header className="flex-none border-b border-ink-3 px-6 py-4 flex flex-col items-center justify-center bg-paper relative z-10 shadow-sm">
        <Link href="/" className="absolute left-6 flex items-center gap-1 text-xs tracking-widest uppercase text-ink-2 hover:text-ink transition-colors" aria-label="Back to home">
          <ArrowLeft size={12} /> Home
        </Link>
        <h1 className="text-4xl md:text-5xl font-display tracking-tight text-ink uppercase">CivicTech</h1>
        <div className="w-full flex justify-between items-end mt-2 pt-2 border-t border-ink-3 text-xs uppercase tracking-widest text-ink-2 font-sans">
          <span>Public Works Intelligence</span>
          <span>Date: Today</span>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Left Panel: Tabs for Directory, Neighborhood Impact, and Agent */}
        <aside className="w-full md:w-[400px] flex-none bg-paper border-r border-ink-3 flex flex-col overflow-hidden z-10 shadow-md">
          <div className="flex border-b border-ink-3 font-sans text-xs uppercase tracking-widest font-semibold bg-paper-2">
            <button 
              className={`flex-1 py-3 text-center border-r border-ink-3 transition-colors ${activeTab === 'directory' ? 'bg-paper text-ink border-b-2 border-b-ink' : 'text-ink-2 hover:bg-paper'}`}
              onClick={() => setActiveTab('directory')}
            >
              Directory
            </button>
            <button 
              className={`flex-1 py-3 text-center border-r border-ink-3 transition-colors ${activeTab === 'neighborhood' ? 'bg-paper text-ink border-b-2 border-b-ink' : 'text-ink-2 hover:bg-paper'}`}
              onClick={() => setActiveTab('neighborhood')}
            >
              Neighborhood
            </button>
            <button 
              className={`flex-1 py-3 text-center transition-colors ${activeTab === 'agent' ? 'bg-paper text-ink border-b-2 border-b-ink' : 'text-ink-2 hover:bg-paper'}`}
              onClick={() => setActiveTab('agent')}
            >
              Agent
            </button>
          </div>
          
          {/* TAB 1: DIRECTORY */}
          {activeTab === 'directory' && (
            <>
              <div className="p-4 border-b border-ink-3">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-sans uppercase tracking-widest font-semibold">Directory Filters</h2>
                  <label className="cursor-pointer text-xs uppercase tracking-widest text-accent underline hover:text-accent-2 flex items-center gap-1">
                    <Upload size={12} />
                    {isUploading ? 'Analyzing...' : 'Upload Notice'}
                    <input 
                      type="file" 
                      accept="application/pdf"
                      disabled={isUploading}
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await handleFileUpload(file);
                        e.target.value = '';
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
          )}

          {/* TAB 2: NEIGHBORHOOD IMPACT */}
          {activeTab === 'neighborhood' && (
            <div className="flex-1 flex flex-col p-4 font-sans text-sm h-full overflow-y-auto">
              <div className="border-b border-ink-3 pb-3 mb-4">
                <div className="flex items-center gap-1.5 mb-1 text-xs uppercase tracking-widest text-ink font-semibold">
                  <Compass size={14} /> Neighborhood Impact
                </div>
                <p className="text-xs text-ink-2 leading-relaxed">
                  Discover nearby works and compute physical proximity to spot localized disruptions before construction begins.
                </p>
              </div>

              <div className="space-y-3 mb-4 bg-paper-2 p-3 border border-ink-3">
                <div>
                  <label className="text-xs uppercase tracking-wider text-ink-2 block mb-1">
                    Radius: <strong className="text-ink">{neighborhoodRadius}m</strong> ({Math.round(neighborhoodRadius / 1000 * 10) / 10} km)
                  </label>
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="50" 
                    value={neighborhoodRadius} 
                    onChange={e => setNeighborhoodRadius(Number(e.target.value))}
                    className="w-full accent-ink"
                  />
                </div>

                <div className="flex gap-1.5">
                  <button 
                    onClick={() => { setNeighborhoodLat(40.7128); setNeighborhoodLon(-74.0060); }}
                    className="flex-1 py-1 px-2 border border-ink-3 text-[11px] uppercase tracking-wider hover:bg-paper"
                  >
                    Downtown
                  </button>
                  <button 
                    onClick={() => { setNeighborhoodLat(40.7150); setNeighborhoodLon(-74.0100); }}
                    className="flex-1 py-1 px-2 border border-ink-3 text-[11px] uppercase tracking-wider hover:bg-paper"
                  >
                    Oak Ave
                  </button>
                  {selectedProject?.latitude && selectedProject?.longitude && (
                    <button 
                      onClick={() => { 
                        setNeighborhoodLat(selectedProject.latitude!); 
                        setNeighborhoodLon(selectedProject.longitude!); 
                      }}
                      className="flex-1 py-1 px-2 border border-accent text-accent text-[11px] uppercase tracking-wider hover:bg-paper"
                    >
                      Selected Loc
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-ink-3 font-mono">
                  Center: {neighborhoodLat.toFixed(4)}, {neighborhoodLon.toFixed(4)}
                </div>
              </div>

              {/* Proximity disclaimer */}
              <div className="p-2.5 mb-4 bg-paper border border-ink-3/40 text-[11px] text-ink-2 leading-relaxed flex items-start gap-1.5">
                <Info size={14} className="shrink-0 mt-0.5 text-ink-3" />
                <span>
                  Proximity calculated deterministically using the Haversine equation. Disruption indices are estimates based on active project schedules; no live sensor claims are made.
                </span>
              </div>

              {/* Project list in radius */}
              <div className="flex-1">
                <div className="text-xs uppercase tracking-widest text-ink-2 mb-2 font-semibold flex justify-between">
                  <span>Nearby Projects</span>
                  <span>{neighborhoodProjects.length} found</span>
                </div>

                {neighborhoodProjects.length === 0 ? (
                  <div className="p-6 text-center text-ink-2 italic font-serif">
                    No projects found within {neighborhoodRadius}m of this location. Expand radius to inspect further.
                  </div>
                ) : (
                  <ul className="divide-y divide-ink-3/30 border border-ink-3">
                    {neighborhoodProjects.map(({ project: proj, distance }) => (
                      <li key={proj.id} className="p-3 hover:bg-paper-2 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-display text-base leading-snug">{proj.title}</h4>
                          <span className="shrink-0 ml-2 text-xs font-mono px-1.5 py-0.5 bg-paper border border-ink-3 text-ink">
                            {distance}m
                          </span>
                        </div>
                        <div className="text-xs text-ink-2 mb-2">
                          <span className="capitalize font-semibold">{proj.workType}</span> · <span>{proj.department || 'Unknown Dept'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="capitalize px-1.5 py-0.5 border text-[11px]" style={{
                            borderColor: proj.status === 'delayed' ? 'var(--color-status-delayed)' : 'var(--color-ink-3)'
                          }}>
                            {proj.status}
                          </span>
                          <button 
                            onClick={() => setSelectedProjectId(proj.id)}
                            className="text-accent underline uppercase tracking-wider text-[11px] hover:text-accent-2"
                          >
                            Inspect details →
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AGENT */}
          {activeTab === 'agent' && (
            <div className="flex-1 flex flex-col p-4 font-sans text-sm h-full">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {agentMessages.length === 0 && (
                  <div className="p-4 bg-paper-2 border border-ink-3 text-xs text-ink-2 leading-relaxed">
                    <p className="font-semibold text-ink uppercase tracking-wider mb-1">Bounded Coordination Agent</p>
                    <p>Ask investigative questions grounded in verified civic records. Example prompts:</p>
                    <ul className="list-disc pl-4 mt-2 space-y-1">
                      <li>"Are there any conflicts involving the water main replacement?"</li>
                      <li>"Which projects on Main St are currently overdue?"</li>
                      <li>"Find works near latitude 40.7128, longitude -74.0060."</li>
                    </ul>
                  </div>
                )}
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
                  Data origin: <span className="uppercase font-semibold">{selectedProject.dataOrigin}</span>
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
                      const otherProject = projects.find(p => p.id === otherId);
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
                      <span className="text-ink underline font-mono text-xs">{src}</span>
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

      {/* AI Notice Extraction Review Modal */}
      {showNoticeModal && extractedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-paper border-2 border-ink max-w-xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-ink-3 pb-3 mb-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
                  <FileText size={14} /> AI Notice Extraction Review
                </span>
                <h2 className="font-display text-2xl mt-1 leading-tight">{extractedNotice.data.title}</h2>
              </div>
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="text-ink-2 hover:text-ink text-sm p-1"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Uncertain Fields Warning Banner */}
            {extractedNotice.data.uncertainFields && extractedNotice.data.uncertainFields.length > 0 && (
              <div className="mb-4 p-3 bg-paper-2 border border-accent text-accent text-xs">
                <div className="font-semibold flex items-center gap-1 mb-1">
                  <ShieldAlert size={14} /> Fields Requiring Review / Inferred:
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {extractedNotice.data.uncertainFields.map((field, idx) => (
                    <span key={idx} className="bg-paper px-2 py-0.5 border border-accent uppercase tracking-wide font-mono text-[11px]">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 font-sans text-sm mb-6">
              <div>
                <span className="text-ink-2 text-xs uppercase tracking-wider block">Description</span>
                <p className="mt-0.5 leading-relaxed text-ink">{extractedNotice.data.description || 'No description extracted.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-ink-2 text-xs uppercase tracking-wider block">Department</span>
                  <p className="font-semibold">{extractedNotice.data.department || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-ink-2 text-xs uppercase tracking-wider block">Contractor</span>
                  <p className="font-semibold">{extractedNotice.data.contractor || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-ink-2 text-xs uppercase tracking-wider block">Schedule</span>
                  <p className="tabular-nums font-mono text-xs">
                    {extractedNotice.data.plannedStartDate || '?'} → {extractedNotice.data.plannedEndDate || '?'}
                  </p>
                </div>
                <div>
                  <span className="text-ink-2 text-xs uppercase tracking-wider block">Location / Address</span>
                  <p className="font-semibold">{extractedNotice.data.addressText || 'Not specified'}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-ink-3/40 text-xs text-ink-2 flex justify-between">
                <span>Source File: <strong className="font-mono text-ink">{extractedNotice.sourceTitle}</strong></span>
                <span className="italic font-mono text-[11px]">Zod Validated</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-ink-3">
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="px-4 py-2 text-xs uppercase tracking-widest border border-ink-3 hover:bg-paper-2 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleAcceptNotice}
                className="px-4 py-2 text-xs uppercase tracking-widest bg-ink text-paper hover:bg-ink-2 transition-colors flex items-center gap-1.5 font-semibold"
              >
                <CheckCircle2 size={14} /> Add to Project Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
