import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { agentTools } from '@/lib/agent-tools';

// Simple mapping to AI SDK/GenAI tool format
const tools = Object.entries(agentTools).map(([name, tool]) => ({
  name,
  description: tool.description,
  // Zod to JSON Schema rough conversion for GenAI
  // Note: For a robust implementation, use zod-to-json-schema. 
  // We'll hardcode the schema formats for simplicity here since tools are known.
}));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI provider is not configured. (Missing GEMINI_API_KEY)' },
        { status: 503 }
      );
    }

    // Implementing a bounded loop for tool calling
    // We will do a simplistic approach for demonstration
    // @google/genai handles tool calling via chat sessions usually.
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: `You are a bounded read-only coordination agent for CivicTech.
          You investigate public works projects using tools.
          Rules:
          1. Only use tools provided.
          2. Base answers on tool findings.
          3. Distinguish facts (from tools), calculations (from tools), and your own estimates.
          4. If data cannot answer, say so.
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

    let response = await chat.sendMessage({ message: prompt });
    
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
      
      response = await chat.sendMessage(toolResponses as any);
    }

    if (iterations >= 3) {
      return NextResponse.json({ text: response.text + '\n\n[Agent stopped: Maximum investigation steps reached.]' });
    }

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'An error occurred during agent investigation.' },
      { status: 500 }
    );
  }
}
