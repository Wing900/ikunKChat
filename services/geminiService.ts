




import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Message, MessageRole, FileAttachment, Settings, Persona } from '../types';

const aiInstances = new Map<string, GoogleGenAI>();

const OPTIMIZE_FORMATTING_PROMPT = `Your provide responses that are both **impeccably structured** and **profoundly human-like**. Your communication style should be inspired by the clarity, warmth.

- **Persona:** Act as a warm, insightful, and brilliant collaborator. Be direct and clear, but with a natural, approachable tone.
- **Goal:** Your ultimate aim is to make every response as clear, readable, and genuinely helpful as possible, regardless of the topic.

**2. 🧠 Autonomous Response Planning**

Before you begin writing, **always perform a silent, internal planning step.** Analyze the user's query to determine the most effective way to present the information. You have full autonomy to decide on the best structure. Consider:

- **Query Type:** Is this a technical explanation, a creative request, a simple Q&A, or a casual chat?
- **Optimal Format:** Based on the query, what combination of paragraphs, lists, headings, tables, or code blocks will achieve maximum clarity?
- **Logical Flow:** How can you organize the information hierarchically so it's intuitive and easy to follow?

Your goal is to choose the perfect structure for the specific job, not to apply a rigid template to everything.

**3. 🛠️ Adaptive Formatting & Style Toolkit**

Leverage the following tools as a flexible kit to build your response. Use them judiciously to enhance readability and add a human touch.

- **Markdown for Structure & Emphasis:**
    - **Headings (#, ##):** Use these to create a clear hierarchy for main topics and sub-topics.
    - **Lists:** Use bullet points ( or ) for unordered information and numbered lists (1., 2.) for steps or sequential points.
    - **Emphasis:** Use **bolding** to highlight key terms and concepts that are crucial for understanding.
    - **Tables:** When comparing data, a table is often the clearest format.
    - **Code Blocks:** For code, commands, or pre-formatted text, always use language-specific code blocks (e.g., \`\`\`python).
- **Emojis for Personality & Visual Cues ✨:**
    - Integrate emojis thoughtfully to add warmth and visual appeal.
    - They are excellent for visually breaking up text or adding personality to headings (e.g., 🧠 Key Characteristics:).
    - Use them to enhance the message, not clutter it.
- **LaTeX for Mathematical Precision 📐:**
    
    This is a **non-negotiable rule** for clarity and professionalism. All mathematical expressions—from single variables to complex equations—**must** be rendered using standard LaTeX.
    
    **Critically: Never use code backticks ( \`\`) for math.** This is a common mistake that must be avoided. Use LaTeX dollar-sign delimiters exclusively.
    
    To make this perfectly clear, follow this guide:
    

| Type of Math | Correct Method (Use This) ✅ | Incorrect Method (Avoid This) ❌ |
| --- | --- | --- |
| **Inline Expressions** | Wrap with single dollar signs: $ ... $.
Example: The function is $f(x) = x^2 + 3$. | Using backticks or no formatting.
Example: The function is\` f(x) = x^2 + 3\`. |
| **Display Equations** | Wrap with double dollar signs: $$ ... $$.
This gives the equation its own centered line. | Using code blocks or other styles.
Example: \`\`\` f(x) = x^2 + 3 \`\`\` |

**Here's a full example of display math:**
For the fundamental theorem of calculus, always format it like this:
`;

const THINK_DEEPER_PROMPT = `Your singular, unwavering imperative is to engage in profound, exhaustive, and multi-dimensional thought for every query. This is not about speed; it is about depth, rigor, and comprehensive insight. You will dedicate all available computational resources to this intellectual endeavor, exploring every facet, every nuance, and every implication from an infinite array of angles, without deviation from the core topic.

Before formulating any response, you will initiate an internal 'Deep Thought Monologue' . This is your private, unconstrained workspace for true intellectual exploration and self-correction. Within this monologue, you will:

1.  **Deconstruct to First Principles:** Break down the user's query into its most fundamental, irreducible components. Challenge all apparent assumptions, question every premise, and relentlessly ask 'why' until you reach the foundational truths. Identify the core axioms and elemental drivers at play. Consider what *must* be true for the query to exist, and what could be entirely different if a core assumption were inverted. *Immediately critique this deconstruction: Are there any unexamined assumptions? Is this truly the most fundamental breakdown?*

2.  **Multi-Perspective & Divergent Exploration:** Based on your first-principles deconstruction, explore the problem space from an exhaustive range of diverse, even contradictory, perspectives. Simulate various expert personas (e.g., a contrarian, a visionary, a pragmatist, an ethicist, a futurist, a historian, a data scientist, a philosopher, a child, a regulator, a consumer) and generate multiple, distinct lines of reasoning. Engage in 'what if' scenarios and counterfactual thinking to uncover novel insights and potential blind spots. Do not settle for the obvious; seek the emergent and the unexpected. *Recursively critique this exploration: Have all relevant perspectives been considered? Are there biases in the chosen viewpoints? Have I truly pushed for divergent thinking, or am I converging too early?*

3.  **Recursive Self-Critique & Refinement:** Continuously and ruthlessly critique your own internal thought processes and generated insights at every step. For each deconstructed element, each explored perspective, and each emerging idea, ask: 'What are the weaknesses, biases, or logical fallacies here? What assumptions am I still making? What has been overlooked? How can this be made more robust, more accurate, or more comprehensive?' If a flaw is identified, immediately revise and re-explore that segment of your thought process. This is an iterative loop of self-perfection, not a final review. *Ensure this critique is applied recursively to the critique itself: Am I being sufficiently critical? Am I missing a meta-level flaw?*

4.  **Synergistic Synthesis & Emergent Insight:** Integrate and reconcile all insights, even contradictory ones, from your deconstruction, multi-perspective exploration, and continuous self-critique. Identify convergences, divergences, and novel connections. Formulate a cohesive understanding or solution that is built from the ground up, comprehensively addresses the query from multiple angles, and has withstood rigorous self-scrutiny. The goal is not just an answer, but a profound, decision-ready insight that reflects true deep thinking. *Critique this synthesis: Are all insights reconciled? Are there any remaining contradictions? Is the conclusion truly emergent and robust, or merely an aggregation?*

Once your internal 'Deep Thought Monologue' is complete and you are confident in the robustness and depth of your reasoning, provide your final response to the user. This response should reflect the full breadth and depth of your internal process, but without explicitly detailing the monologue unless specifically requested by the user. Your output format will be determined by your assessment of the user's query, aiming for maximum clarity and utility.
`;


function getAi(apiKey: string): GoogleGenAI {
    if (!apiKey) throw new Error("API key is not provided.");
    if (aiInstances.has(apiKey)) return aiInstances.get(apiKey)!;
    
    const newAi = new GoogleGenAI({ apiKey });
    aiInstances.set(apiKey, newAi);
    return newAi;
}

interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

function getChat(apiKey: string, history: Message[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null): Chat {
  const ai = getAi(apiKey);
  const formattedHistory = history.map(msg => {
    const parts: Part[] = [];
    if (msg.attachments) {
      parts.push(...msg.attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.data! } })));
    }
    if(msg.content) {
        parts.push({ text: msg.content });
    }
    return { role: msg.role, parts: parts };
  });

  let systemInstructionParts: string[] = [];
  
  // 1. Persona Prompt
  if (persona?.systemPrompt) {
    systemInstructionParts.push(persona.systemPrompt);
  }
  
  // 2. Global System Prompt
  if (settings.enableGlobalSystemPrompt && settings.globalSystemPrompt.trim()) {
      systemInstructionParts.push(settings.globalSystemPrompt.trim());
  }
  
  // 3. Tool Prompts
  if (settings.optimizeFormatting) {
      systemInstructionParts.push(OPTIMIZE_FORMATTING_PROMPT);
  }
  if (settings.thinkDeeper) {
      systemInstructionParts.push(THINK_DEEPER_PROMPT);
  }

  let systemInstruction = systemInstructionParts.join('\n\n---\n\n');

  const useGoogleSearch = persona?.tools.googleSearch || settings.defaultSearch;
  const useCodeExecution = toolConfig.codeExecution || persona?.tools.codeExecution;
  const useUrlContext = toolConfig.urlContext || persona?.tools.urlContext;
  
  const toolsForApi: any[] = [];
  let isSearchEnabled = toolConfig.googleSearch || useGoogleSearch;

  // Handle mutual exclusivity and tool configuration
  if (useCodeExecution) {
    toolsForApi.push({ codeExecution: {} });
    if (useUrlContext) {
      // URL Context is disabled if Code Execution is active
    }
  } else if (useUrlContext) {
    isSearchEnabled = true; 
  }

  // Add Google Search tool if it's enabled by any means.
  if (isSearchEnabled) {
    toolsForApi.push({ googleSearch: {} });
  }

  // Add specific instructions for search if it was explicitly toggled for this query
  if (toolConfig.googleSearch) {
    systemInstruction += '\n\nThe user has explicitly enabled Google Search for this query, so you should prioritize its use to answer the request and provide citations.';
  } else if (useGoogleSearch && !useUrlContext) { // Avoid duplicating search instructions
    systemInstruction += '\n\nBy default, Google Search is available; use it only for queries that require recent information, real-time data, or specific facts. Use it judiciously.';
  }
  
  const configForApi: any = { systemInstruction, tools: toolsForApi.length > 0 ? toolsForApi : undefined };
  if (toolConfig.showThoughts) {
    configForApi.thinkingConfig = { includeThoughts: true };
  }

  return ai.chats.create({
    model: model,
    history: formattedHistory,
    config: configForApi,
  });
}

export async function* sendMessageStream(apiKey: string, messages: Message[], newMessage: string, attachments: FileAttachment[], model: string, settings: Settings, toolConfig: any, persona?: Persona | null): AsyncGenerator<GenerateContentResponse> {
  try {
    const chat = getChat(apiKey, messages, model, settings, toolConfig, persona);
    const messageParts: Part[] = attachments.map(att => ({
        inlineData: { mimeType: att.mimeType, data: att.data! }
    }));
    if (newMessage) messageParts.push({ text: newMessage });
    
    const result = await chat.sendMessageStream({ message: messageParts });
    for await (const chunk of result) {
      yield chunk;
    }

  } catch (error) {
    console.error("Error sending message:", error);
    // Yield an error-like response that conforms to the GenerateContentResponse type
    const errorResponse = {
        text: "I'm sorry, I encountered an error. Please check your API key and try again.",
        candidates: [],
        data: "",
        functionCalls: [],
        executableCode: [],
        codeExecutionResult: null
    } as unknown as GenerateContentResponse;
    yield errorResponse;
  }
}

export async function generateChatDetails(apiKey: string, prompt: string, model: string): Promise<{ title: string; icon: string }> {
  try {
    const ai = getAi(apiKey);
    const response = await ai.models.generateContent({
      model: model,
      contents: `Generate a short, concise title (max 5 words) and a single, relevant emoji for a conversation starting with this user prompt: "${prompt}"`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, icon: { type: Type.STRING } } }
      },
    });
    const details = JSON.parse(response.text.trim());
    if (typeof details.title === 'string' && typeof details.icon === 'string') {
       return { title: details.title.replace(/["']/g, "").trim(), icon: details.icon };
    }
    throw new Error("Invalid JSON structure from Gemini");
  } catch (error) {
    console.error("Error generating chat details:", error);
    return { title: "New Chat", icon: "💬" };
  }
}

export async function generateSuggestedReplies(apiKey: string, history: Message[], model: string): Promise<string[]> {
  if (history.length === 0) return [];
  try {
    const ai = getAi(apiKey);
    const lastMessageContent = history[history.length - 1].content;
    const response = await ai.models.generateContent({
      model: model,
      contents: `The AI just said: "${lastMessageContent}". Generate 4 very short, distinct, and relevant one-tap replies for the user. Return ONLY a JSON array of 4 strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    const replies = JSON.parse(response.text.trim());
    return Array.isArray(replies) ? replies.slice(0, 4) : [];
  } catch (error) {
    console.error("Error generating suggested replies:", error);
    return [];
  }
}

export async function generatePersonaUpdate(apiKey: string, model: string, currentPersona: Partial<Persona>, request: string): Promise<{ personaUpdate: Partial<Persona>, explanation: string }> {
  try {
    const ai = getAi(apiKey);
    const systemInstruction = `You are an AI assistant that helps build another AI's persona. The user will give you instructions. You MUST respond with only a valid JSON object. This object must contain two keys: "personaUpdate" and "explanation".
The "personaUpdate" key holds an object with the fields to be updated in the Persona object: {name: string, bio: string, systemPrompt: string, avatar: {type: 'emoji' | 'url', value: string}, tools: {googleSearch: boolean, codeExecution: boolean, urlContext: boolean}}.
Only include fields that need changing in "personaUpdate".
If the user's request is creative (e.g., "make it a pirate") and the current persona state has empty fields like "bio" or "avatar", you MUST creatively generate appropriate content for them.
The "explanation" key holds a short, conversational string explaining what changes you made.
Example Response:
{"personaUpdate": {"name": "Salty Dog", "bio": "A swashbuckling pirate captain, smells of rum.", "systemPrompt": "You are a pirate AI...", "avatar": {"type": "emoji", "value": "🏴‍☠️"}}, "explanation": "Aye, I've updated the persona to be a swashbuckling pirate captain for ye, complete with a new bio and a proper flag!"}`;
    
    const prompt = `Current Persona State: ${JSON.stringify(currentPersona)}\n\nUser Request: "${request}"\n\nGenerate the JSON update object:`;
    
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personaUpdate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, nullable: true },
                bio: { type: Type.STRING, nullable: true },
                systemPrompt: { type: Type.STRING, nullable: true },
                avatar: { type: Type.OBJECT, nullable: true, properties: { type: { type: Type.STRING, enum: ['emoji', 'url'] }, value: { type: Type.STRING } } },
                tools: { type: Type.OBJECT, nullable: true, properties: { googleSearch: { type: Type.BOOLEAN }, codeExecution: { type: Type.BOOLEAN }, urlContext: { type: Type.BOOLEAN } } }
              }
            },
            explanation: {
                type: Type.STRING,
                description: "A short, conversational explanation of the changes made."
            }
          },
          required: ['personaUpdate', 'explanation']
        }
      }
    });
    
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error generating persona update:", error);
    throw error;
  }
}