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
  Building2, 
  Calendar, 
  FileText, 
  ArrowLeft,
  Compass,
  CheckCircle2,
  X,
  Upload,
  Info,
  ShieldAlert,
  Search,
  Sparkles,
  Layers,
  Send,
  Loader2,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";

// Dynamically import map to avoid SSR window errors
const CivicMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Workspace() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
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

  const handleAgentSubmit = async (customPrompt?: string) => {
    const prompt = (customPrompt || agentInput).trim();
    if (!prompt) return;
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
        setAgentMessages(prev => [...prev, { role: 'agent', content: 'Investigation request timed out. Please try again.' }]);
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
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesAddress = p.addressText.toLowerCase().includes(q);
        const matchesDept = (p.department || "").toLowerCase().includes(q);
        const matchesContractor = (p.contractor || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesAddress && !matchesDept && !matchesContractor) return false;
      }
      return true;
    });
  }, [projects, filterStatus, filterWorkType, searchQuery]);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">Ongoing</span>;
      case 'delayed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">Delayed</span>;
      case 'planned':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Planned</span>;
      case 'completed':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">Completed</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">{status}</span>;
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* ── Top Header Navigation ── */}
      <header className="flex-none h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-slate-900">CivicTech</span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 hidden md:inline">
              Public Works Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Platform Status */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {projects.length} Projects
            </span>
            {conflicts.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200 font-medium">
                <AlertTriangle size={12} />
                {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Upload Notice Button */}
          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs">
            <Upload size={13} className={isUploading ? 'animate-bounce text-blue-600' : 'text-slate-500'} />
            <span>{isUploading ? 'Parsing Notice...' : 'Upload Notice (PDF)'}</span>
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
      </header>

      {/* ── Main Workspace Layout ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
        
        {/* ── Left Sidebar / Control Panel ── */}
        <aside className="w-full md:w-[410px] flex-none bg-white border-r border-slate-200 flex flex-col overflow-hidden z-10 shadow-xs">
          
          {/* Segmented Control Navigation */}
          <div className="p-2 border-b border-slate-200 bg-slate-50/80">
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-lg">
              <button 
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'directory' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                onClick={() => setActiveTab('directory')}
              >
                <Layers size={13} />
                <span>Directory</span>
              </button>
              <button 
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'neighborhood' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                onClick={() => setActiveTab('neighborhood')}
              >
                <Compass size={13} />
                <span>Radius</span>
              </button>
              <button 
                className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activeTab === 'agent' 
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                onClick={() => setActiveTab('agent')}
              >
                <Sparkles size={13} />
                <span>Agent</span>
              </button>
            </div>
          </div>
          
          {/* ── TAB 1: DIRECTORY ── */}
          {activeTab === 'directory' && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-200 bg-white space-y-2.5">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search projects, streets, departments..." 
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Status</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filterStatus}
                      onChange={e => setFilterStatus(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="planned">Planned</option>
                      <option value="delayed">Delayed</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Work Type</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={filterWorkType}
                      onChange={e => setFilterWorkType(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="road">Road</option>
                      <option value="water">Water</option>
                      <option value="electrical">Electrical</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Showing {filteredProjects.length} of {projects.length} projects</span>
                  {(filterStatus !== 'all' || filterWorkType !== 'all' || searchQuery) && (
                    <button 
                      onClick={() => { setFilterStatus('all'); setFilterWorkType('all'); setSearchQuery(''); }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Reset filters
                    </button>
                  )}
                </div>
              </div>
              
              {/* Project Card List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
                {filteredProjects.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-lg border border-slate-200 border-dashed">
                    <p className="text-xs text-slate-500">No projects match your current filters.</p>
                  </div>
                ) : (
                  filteredProjects.map(proj => {
                    const isSelected = selectedProjectId === proj.id;
                    const projConflicts = conflicts.filter(c => c.projectIds.includes(proj.id));
                    
                    return (
                      <button 
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                          isSelected 
                            ? 'bg-blue-50/40 border-blue-500 shadow-2xs ring-1 ring-blue-500/20' 
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-medium text-xs text-slate-900 leading-snug line-clamp-2">
                            {proj.title}
                          </h3>
                          <div className="shrink-0">
                            {getStatusBadge(proj.status)}
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-700 capitalize">{proj.workType}</span>
                          <span>·</span>
                          <span>{proj.department || 'Municipal Dept'}</span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <div className="flex items-center gap-1 text-slate-600 truncate max-w-[220px]">
                            <MapPin size={12} className="shrink-0 text-slate-400" />
                            <span className="truncate">{proj.addressText}</span>
                          </div>

                          {projConflicts.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                              <AlertTriangle size={10} />
                              {projConflicts.length} Conflict
                            </span>
                          )}
                        </div>

                        {!proj.latitude && (
                          <div className="mt-1.5 text-[10px] text-amber-600 italic flex items-center gap-1">
                            <span>⚠ Approximate location only (no GPS)</span>
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: NEIGHBORHOOD IMPACT ── */}
          {activeTab === 'neighborhood' && (
            <div className="flex-1 flex flex-col p-4 font-sans text-xs overflow-y-auto">
              <div className="border-b border-slate-200 pb-3 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 mb-1">
                  <Compass size={14} className="text-blue-600" />
                  <span>Neighborhood Impact Radius</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Calculate localized disruption radius to detect overlapping works before street closures compound.
                </p>
              </div>

              {/* Radius & Location Controls */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3 mb-4">
                <div>
                  <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-medium text-slate-700">Inspection Radius</span>
                    <strong className="text-slate-900 font-mono">{neighborhoodRadius}m ({(neighborhoodRadius / 1000).toFixed(1)} km)</strong>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="2000" 
                    step="50" 
                    value={neighborhoodRadius} 
                    onChange={e => setNeighborhoodRadius(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>100m</span>
                    <span>1 km</span>
                    <span>2 km</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-medium text-slate-500 block mb-1.5">Preset Focal Points</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => { setNeighborhoodLat(40.7128); setNeighborhoodLon(-74.0060); }}
                      className="flex-1 py-1 px-2 border border-slate-200 bg-white text-[11px] font-medium text-slate-700 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      Downtown
                    </button>
                    <button 
                      onClick={() => { setNeighborhoodLat(40.7150); setNeighborhoodLon(-74.0100); }}
                      className="flex-1 py-1 px-2 border border-slate-200 bg-white text-[11px] font-medium text-slate-700 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    >
                      Oak Ave
                    </button>
                    {selectedProject?.latitude && selectedProject?.longitude && (
                      <button 
                        onClick={() => { 
                          setNeighborhoodLat(selectedProject.latitude!); 
                          setNeighborhoodLon(selectedProject.longitude!); 
                        }}
                        className="flex-1 py-1 px-2 border border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        Selected Project
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-200">
                  Center: {neighborhoodLat.toFixed(4)}, {neighborhoodLon.toFixed(4)}
                </div>
              </div>

              {/* Haversine Methodology Note */}
              <div className="p-3 mb-4 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                <span>
                  Proximity calculated deterministically using the Haversine formula. Proximity findings reflect active schedule windows and do not imply live traffic sensor feeds.
                </span>
              </div>

              {/* Works in Radius */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-xs text-slate-900">Projects in Radius</span>
                  <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    {neighborhoodProjects.length} found
                  </span>
                </div>

                {neighborhoodProjects.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-lg border border-slate-200 border-dashed text-slate-500 text-xs">
                    No projects found within {neighborhoodRadius}m of this location. Expand radius to inspect broader zone.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {neighborhoodProjects.map(({ project: proj, distance }) => (
                      <div key={proj.id} className="p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-medium text-xs text-slate-900 leading-snug">{proj.title}</h4>
                          <span className="shrink-0 font-mono text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {distance}m
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mb-2">
                          <span className="capitalize font-medium text-slate-700">{proj.workType}</span> · <span>{proj.department || 'Unknown Dept'}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          {getStatusBadge(proj.status)}
                          <button 
                            onClick={() => setSelectedProjectId(proj.id)}
                            className="text-blue-600 hover:text-blue-800 text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <span>Inspect details</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: AGENT INTELLIGENCE ── */}
          {activeTab === 'agent' && (
            <div className="flex-1 flex flex-col p-3 font-sans text-xs h-full overflow-hidden">
              <div className="border-b border-slate-200 pb-2 mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                  <Sparkles size={14} className="text-blue-600" />
                  <span>Coordination Intelligence Agent</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Stateless investigator grounded strictly in verified municipal records.
                </p>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                {agentMessages.length === 0 && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2.5">
                    <p className="font-medium text-slate-900">Suggested questions:</p>
                    <div className="space-y-1.5">
                      <button 
                        onClick={() => handleAgentSubmit("Are there any conflicts involving the water main replacement?")}
                        className="w-full text-left p-2 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 transition-colors text-[11px] flex items-center justify-between group"
                      >
                        <span>"Are there any conflicts involving the water main replacement?"</span>
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleAgentSubmit("Which projects on Main St are currently overdue?")}
                        className="w-full text-left p-2 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 transition-colors text-[11px] flex items-center justify-between group"
                      >
                        <span>"Which projects on Main St are currently overdue?"</span>
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => handleAgentSubmit("Find works near latitude 40.7128, longitude -74.0060.")}
                        className="w-full text-left p-2 rounded bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-700 transition-colors text-[11px] flex items-center justify-between group"
                      >
                        <span>"Find works near latitude 40.7128, longitude -74.0060."</span>
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 text-blue-600" />
                      </button>
                    </div>
                  </div>
                )}

                {agentMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-slate-100 text-slate-900 border border-slate-200 ml-4' 
                        : 'bg-white text-slate-900 border border-slate-200 mr-2 shadow-2xs'
                    }`}
                  >
                    <div className="font-semibold text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                      {msg.role === 'user' ? 'You' : 'Coordination Agent'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}

                {isAgentTyping && (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-500 italic text-xs flex items-center gap-2 mr-4 shadow-2xs">
                    <Loader2 size={13} className="animate-spin text-blue-600" />
                    <span>Investigating civic records & calculating schedule dependencies...</span>
                  </div>
                )}
              </div>

              {/* Input Bar */}
              <div className="flex gap-2 pt-2 border-t border-slate-200">
                <input 
                  type="text" 
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !isAgentTyping && handleAgentSubmit()}
                  placeholder="Ask about project delays, conflicts, works..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={isAgentTyping}
                />
                <button 
                  onClick={() => handleAgentSubmit()}
                  disabled={isAgentTyping || !agentInput.trim()}
                  className="px-3.5 py-2 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  <Send size={12} />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* ── Center Section: Map View ── */}
        <section className="flex-1 relative bg-slate-100 min-h-[40vh] md:min-h-0">
          <CivicMap 
            projects={filteredProjects} 
            conflicts={conflicts} 
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
          />

          {/* Synchronized Legend Tag */}
          <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 rounded-md shadow-2xs text-[11px] text-slate-600 hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Directory & Map Synchronized</span>
          </div>
        </section>

        {/* ── Right Panel: Project Detail Inspector ── */}
        {selectedProject && (
          <aside className="w-full md:w-[410px] flex-none bg-white border-l border-slate-200 flex flex-col overflow-y-auto shadow-lg md:shadow-none z-20 absolute md:relative right-0 h-full">
            <div className="p-4 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-xs flex justify-between items-center z-10">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Project Details</span>
              <button 
                onClick={() => setSelectedProjectId(null)} 
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close inspector"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-6">
              
              {/* Header Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusBadge(selectedProject.status)}
                  <span className="text-[11px] text-slate-400 uppercase font-mono">
                    ID: {selectedProject.id}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900 leading-snug mb-2">
                  {selectedProject.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProject.description}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Origin: {selectedProject.dataOrigin}
                </div>
              </div>

              {/* Core Attributes */}
              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <Building2 size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800">{selectedProject.department || 'Unknown Department'}</div>
                    <div className="text-slate-500 text-[11px]">Contractor: {selectedProject.contractor || 'Not specified'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-200/80">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800">{selectedProject.addressText}</div>
                    {selectedProject.latitude ? (
                      <div className="text-slate-500 font-mono text-[11px]">
                        GPS: {selectedProject.latitude.toFixed(4)}, {selectedProject.longitude?.toFixed(4)}
                      </div>
                    ) : (
                      <div className="text-amber-600 text-[11px] italic">Coordinates unavailable</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2.5 border-t border-slate-200/80">
                  <Calendar size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-800">Timeline</div>
                    <div className="text-slate-600 text-[11px] font-mono mt-0.5">
                      Planned: {selectedProject.plannedStartDate || '?'} → {selectedProject.plannedEndDate || '?'}
                    </div>
                    {(selectedProject.actualStartDate || selectedProject.actualEndDate) && (
                      <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                        Actual: {selectedProject.actualStartDate || '?'} → {selectedProject.actualEndDate || 'Present'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delay & Schedule Analysis */}
              {delayFinding && (
                <div className={`p-4 rounded-lg border text-xs ${
                  delayFinding.isOverdue 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900' 
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-1.5 font-semibold text-xs mb-1.5">
                    <Clock size={14} className={delayFinding.isOverdue ? 'text-rose-600' : 'text-slate-600'} />
                    <span>Schedule Delay Analysis</span>
                  </div>
                  <p className="font-medium">
                    {delayFinding.isOverdue ? (
                      <span className="text-rose-700">Project is overdue by {delayFinding.daysLate} calendar days.</span>
                    ) : delayFinding.isLateCompleted ? (
                      <span>Completed {delayFinding.daysLate} days past planned end date.</span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{delayFinding.reason}</p>
                  <p className="text-[10px] text-slate-400 italic mt-1">(Absence of explanation indicates missing status reason in municipal record.)</p>
                </div>
              )}

              {/* Coordination Conflicts */}
              {projectConflicts.length > 0 && (
                <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-800 mb-2">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Coordination Conflict Detected</span>
                  </div>
                  <div className="space-y-3">
                    {projectConflicts.map(conflict => {
                      const otherId = conflict.projectIds.find(id => id !== selectedProject.id);
                      const otherProject = projects.find(p => p.id === otherId);
                      return (
                        <div key={conflict.id} className="pt-2 border-t border-amber-200/80 first:border-0 first:pt-0">
                          <div className="font-semibold text-amber-900 capitalize mb-1">
                            {conflict.type.replace('_', ' ')}
                          </div>
                          <p className="text-[11px] text-slate-700 mb-1">
                            Conflict with: <button 
                              onClick={() => otherId && setSelectedProjectId(otherId)} 
                              className="font-medium text-blue-700 underline hover:text-blue-900 text-left"
                            >
                              {otherProject?.title || otherId}
                            </button>
                          </p>
                          <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">{conflict.reason}</p>
                          <ul className="text-[11px] text-slate-600 space-y-0.5 font-mono list-disc pl-4">
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
              <div className="pt-4 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                  <FileText size={14} className="text-slate-400" />
                  <span>Source Provenance</span>
                </span>
                <div className="space-y-1.5">
                  {selectedProject.sourceIds.map(src => (
                    <div key={src} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-700 truncate">
                      {src}
                    </div>
                  ))}
                  {selectedProject.sourceIds.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No source documents attached.</p>
                  )}
                </div>
              </div>

            </div>
          </aside>
        )}
      </div>

      {/* ── AI Notice Extraction Review Modal ── */}
      {showNoticeModal && extractedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl overflow-y-auto max-h-[90vh] text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 uppercase tracking-wider">
                  <FileText size={13} />
                  <span>AI Structured Notice Extraction</span>
                </span>
                <h2 className="text-base font-semibold text-slate-900 mt-1 leading-snug">
                  {extractedNotice.data.title}
                </h2>
              </div>
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            {/* Uncertain Fields Warning Banner */}
            {extractedNotice.data.uncertainFields && extractedNotice.data.uncertainFields.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                <div className="font-semibold flex items-center gap-1.5 mb-1 text-amber-800">
                  <ShieldAlert size={14} />
                  <span>Fields Requiring Review / Inferred:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {extractedNotice.data.uncertainFields.map((field, idx) => (
                    <span key={idx} className="bg-white px-2 py-0.5 rounded border border-amber-300 font-mono text-[10px] text-amber-800 uppercase">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <span className="text-[11px] font-medium text-slate-500 block">Description</span>
                <p className="mt-0.5 leading-relaxed text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {extractedNotice.data.description || 'No description extracted.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block">Department</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{extractedNotice.data.department || 'Not specified'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block">Contractor</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{extractedNotice.data.contractor || 'Not specified'}</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block">Schedule</span>
                  <p className="font-mono text-slate-900 mt-0.5">
                    {extractedNotice.data.plannedStartDate || '?'} → {extractedNotice.data.plannedEndDate || '?'}
                  </p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-[10px] font-medium text-slate-500 uppercase block">Location / Address</span>
                  <p className="font-semibold text-slate-900 mt-0.5 truncate">{extractedNotice.data.addressText || 'Not specified'}</p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 flex justify-between">
                <span>Source: <strong className="font-mono text-slate-700">{extractedNotice.sourceTitle}</strong></span>
                <span className="text-emerald-700 font-medium">✓ Zod Validated</span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button 
                onClick={() => setShowNoticeModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
              >
                Discard
              </button>
              <button 
                onClick={handleAcceptNotice}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 size={14} />
                <span>Add to Project Directory</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

