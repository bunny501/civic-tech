import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { agentTools } from '@/lib/agent-tools';
import { mockProjects } from '@/lib/data';
import { analyzeDelay } from '@/lib/timeline';
import { detectConflicts } from '@/lib/conflicts';

function executeOfflineFallback(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Delay / Schedule analysis query
  if (lower.includes('delay') || lower.includes('overdue') || lower.includes('late') || lower.includes('timeline') || lower.includes('why')) {
    const delayed = mockProjects
      .map(p => ({ project: p, finding: analyzeDelay(p) }))
      .filter(item => item.finding !== null || item.project.status === 'delayed');

    if (delayed.length > 0) {
      const items = delayed.map(({ project, finding }) => {
        const days = finding?.daysLate ? `${finding.daysLate} days` : 'past scheduled deadline';
        return `• **${project.title}** (${project.id}):\n  - Department: ${project.department || 'Not listed'}\n  - Status: ${project.status} (${days})\n  - Planned schedule: ${project.plannedStartDate} to ${project.plannedEndDate}\n  - Recorded Details: ${project.description}\n  - Evidence Note: Under CivicTech data truth rules, an absent recorded explanation indicates no explanation was provided in available municipal records (${project.sourceIds.join(', ')}), not proof of misconduct.`;
      }).join('\n\n');

      return `[Coordination Agent Intelligence]\n\nBased on verified schedule records across municipal projects:\n\n${items}`;
    }
    return `[Coordination Agent Intelligence]\n\nNo active municipal projects are currently recorded as overdue or delayed in the registry.`;
  }

  // Conflict query
  if (lower.includes('conflict') || lower.includes('clash') || lower.includes('overlap') || lower.includes('excavation')) {
    const conflicts = detectConflicts(mockProjects);
    if (conflicts.length > 0) {
      const items = conflicts.map(c => {
        const pTitles = c.projectIds.map(id => mockProjects.find(p => p.id === id)?.title || id).join(' AND ');
        return `• **${c.type.toUpperCase().replace('_', ' ')}** (Severity: ${c.severity}):\n  - Projects: ${pTitles}\n  - Proximity: ${c.spatialBasis || 'N/A'}\n  - Timeline: ${c.temporalBasis || 'N/A'}\n  - Explanation: ${c.reason}`;
      }).join('\n\n');
      return `[Coordination Agent Intelligence]\n\nDetected ${conflicts.length} cross-department coordination conflict(s):\n\n${items}`;
    }
    return `[Coordination Agent Intelligence]\n\nNo physical or schedule overlaps detected among active projects.`;
  }

  // Work type or specific project query (e.g. water, road, fiber)
  const matches = mockProjects.filter(p => 
    lower.includes(p.workType.toLowerCase()) || 
    lower.includes(p.title.toLowerCase()) ||
    (p.department && lower.includes(p.department.toLowerCase()))
  );

  if (matches.length > 0) {
    const items = matches.map(p => 
      `• **${p.title}** (${p.id}):\n  - Type: ${p.workType} | Status: ${p.status}\n  - Department: ${p.department || 'TBD'}\n  - Location: ${p.addressText}\n  - Planned Window: ${p.plannedStartDate} to ${p.plannedEndDate}`
    ).join('\n\n');
    return `[Coordination Agent Intelligence]\n\nFound matching projects for your inquiry:\n\n${items}`;
  }

  // General overview
  return `[Coordination Agent Intelligence]\n\nCivicTech currently monitors ${mockProjects.length} infrastructure projects in the registry:\n` +
    mockProjects.map(p => `• **${p.title}** (${p.status}) — ${p.workType} work by ${p.department || 'City Dept'}`).join('\n') +
    `\n\nYou can ask about specific project delays, cross-department conflicts, or neighborhood locations.`;
}

export async function POST(req: Request) {
  let userPrompt = '';
  try {
    const body = await req.json();
    userPrompt = body?.prompt || '';

    if (!userPrompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Graceful offline fallback if GEMINI_API_KEY is not configured
    if (!process.env.GEMINI_API_KEY) {
      const fallbackText = executeOfflineFallback(userPrompt);
      return NextResponse.json({ 
        text: fallbackText + '\n\n*(Note: Operating in deterministic verification mode. Configure GEMINI_API_KEY for generative synthesis.)*'
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const chat = ai.chats.create({
      model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
      config: {
        systemInstruction: `You are a bounded read-only coordination agent for CivicTech.
          You investigate public works projects using tools.
          Rules:
          1. Only use tools provided.
          2. Base answers on tool findings.
          3. Distinguish facts (from tools), calculations (from tools), and your own estimates.
          4. If data cannot answer, say so. Missing explanation is not proof of misconduct.
          5. Cite project IDs/titles in responses.`,
        tools: [{
          functionDeclarations: [
            {
              name: 'searchProjects',
              description: 'Search for projects by status, work type, or department.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  status: { type: Type.STRING },
                  workType: { type: Type.STRING },
                  department: { type: Type.STRING }
                }
              }
            },
            {
              name: 'getProjectDetails',
              description: 'Get full details of a specific project by ID.',
              parameters: {
                type: Type.OBJECT,
                properties: { projectId: { type: Type.STRING } },
                required: ['projectId'] as any
              }
            },
            {
              name: 'getProjectTimeline',
              description: 'Analyze delay and timeline for a specific project.',
              parameters: {
                type: Type.OBJECT,
                properties: { projectId: { type: Type.STRING } },
                required: ['projectId'] as any
              }
            },
            {
              name: 'findConflicts',
              description: 'Check deterministic conflicts involving a specific project.',
              parameters: {
                type: Type.OBJECT,
                properties: { projectId: { type: Type.STRING } },
                required: ['projectId'] as any
              }
            },
            {
              name: 'getNeighborhoodWorks',
              description: 'Find projects near a specific coordinate within a date window.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER },
                  radiusMeters: { type: Type.NUMBER }
                },
                required: ['latitude', 'longitude'] as any
              }
            }
          ]
        }]
      }
    });

    let response = await chat.sendMessage({ message: userPrompt });
    
    // Bounded loop: max 3 tool calls
    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 3) {
      iterations++;
      const toolResponses = [];
      
      for (const call of response.functionCalls) {
        let result: any;
        try {
          const args = call.args as any;
          if (call.name === 'searchProjects') result = await agentTools.searchProjects.execute(args);
          else if (call.name === 'getProjectDetails') result = await agentTools.getProjectDetails.execute(args);
          else if (call.name === 'getProjectTimeline') result = await agentTools.getProjectTimeline.execute(args);
          else if (call.name === 'findConflicts') result = await agentTools.findConflicts.execute(args);
          else if (call.name === 'getNeighborhoodWorks') result = await agentTools.getNeighborhoodWorks.execute(args);
          else result = { error: 'Unknown tool' };
        } catch (e: any) {
          result = { error: e.message };
        }
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: result
          }
        });
      }
      
      response = await chat.sendMessage({
        message: toolResponses as any
      });
    }

    if (iterations >= 3) {
      return NextResponse.json({ text: (response.text || '') + '\n\n[Agent stopped: Maximum investigation steps reached.]' });
    }

    return NextResponse.json({ text: response.text || executeOfflineFallback(userPrompt) });
  } catch (error: any) {
    console.error('Agent error, falling back to deterministic response:', error);
    const fallbackText = executeOfflineFallback(userPrompt);
    return NextResponse.json({ 
      text: fallbackText + `\n\n*(Note: Operating in deterministic verification mode. Provider error: ${error?.message || 'AI provider unavailable'})*`
    });
  }
}
