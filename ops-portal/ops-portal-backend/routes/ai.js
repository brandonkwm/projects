const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

const MODELS = {
  'gemini-flash': { provider: 'gemini', id: 'gemini-2.0-flash', label: 'Gemini Flash 2.0 (Free)' },
  'claude-haiku': { provider: 'anthropic', id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  'claude-opus': { provider: 'anthropic', id: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
};

function isGeminiQuotaError(err) {
  const msg = String(err?.message || '');
  return msg.includes('429') || msg.includes('Too Many Requests') || msg.includes('quota');
}

const SYSTEM_PROMPT = `You are a workflow builder for an operations portal. Convert plain English workflow descriptions into structured workflow JSON definitions.

A workflow has nodes (array) and edges (array connecting nodes).

Node types:
1. "start" — Entry point. Always id: "node_0", position {x:250, y:50}.
2. "task" — Performs work. actionType: "data" | "notification" | "human"
3. "condition" — Branch logic. conditionMode: "rule" | "ai"
4. "end" — Terminal node.

Full node schema:
{
  "id": "node_N",
  "type": "start"|"task"|"condition"|"end",
  "position": {"x": number, "y": number},
  "data": {
    "label": "string",
    "description": "string",
    "actionType": "data"|"notification"|"human",
    "actionConfig": {
      "commTemplateId": "id (notification tasks only)",
      "caseTemplateId": "id (human tasks only)",
      "dataMode": "fetch", "dataFetchSource": "http", "fetchUrl": "...", "fetchMethod": "GET"|"POST"
    },
    "conditionMode": "rule"|"ai",
    "rules": [{"id": "rule_1", "left": "payload.field", "operator": "equals"|"notEquals"|"greaterThan"|"lessThan"|"contains", "right": "value", "logic": "AND"}],
    "aiConfig": {"prompt": "Decision instructions", "allowedOutputs": "yes,no"}
  }
}

Edge schema: {"id": "edge_N", "source": "node_id", "target": "node_id", "label": "string"}

Layout: Start y=50 x=250. Each row += 150. Branch left x=100, right x=400.

Return ONLY valid JSON (no markdown):
{"name":"...","description":"...","definition":{"nodes":[...],"edges":[...]}}`;

const EXPLAIN_WHY_SYSTEM_PROMPT = `You are an operations decision copilot for a workflow engine.

Your task is to recommend the best next action for a case and explain WHY using both:
1) objective profile (what the workflow is trying to optimize),
2) runtime context (what is currently happening).

Rules:
- Prioritize hard constraints and policy constraints over convenience.
- If data is insufficient, say so clearly and lower confidence.
- Keep reasoning concise and grounded in provided data only.
- Never fabricate references.

Return ONLY valid JSON with this schema:
{
  "recommendedAction": {
    "type": "retry"|"escalate"|"request_info"|"reroute"|"pause"|"notify",
    "label": "human readable action",
    "params": {}
  },
  "whyNow": "short runtime-context rationale",
  "whyFitsObjective": "short objective-alignment rationale",
  "tradeoffs": [
    { "benefit": "string", "cost": "string" }
  ],
  "objectiveScorecard": [
    {
      "metric": "sla_met|false_positive_rate|manual_touches|customer_impact_score|other",
      "direction": "up|down|neutral",
      "impact": "low|medium|high",
      "reason": "string"
    }
  ],
  "confidence": 0.0,
  "assumptions": ["string"],
  "citations": ["string"],
  "insufficientContext": false
}`;

function buildObjectiveProfile(raw = {}) {
  return {
    primaryGoal: raw.primaryGoal || 'resolve_case_fast',
    successMetrics: Array.isArray(raw.successMetrics) && raw.successMetrics.length
      ? raw.successMetrics
      : ['sla_met', 'manual_touches', 'customer_impact_score'],
    priorityOrder: Array.isArray(raw.priorityOrder) && raw.priorityOrder.length
      ? raw.priorityOrder
      : ['compliance', 'customer_experience', 'speed', 'cost'],
    hardConstraints: Array.isArray(raw.hardConstraints) ? raw.hardConstraints : [],
    riskTolerance: raw.riskTolerance || 'low',
    personaScope: raw.personaScope || 'default',
  };
}

function buildRuntimeContext(raw = {}) {
  return {
    caseId: raw.caseId || null,
    workflowId: raw.workflowId || null,
    currentStep: raw.currentStep || null,
    currentState: raw.currentState || 'open',
    retryCount: Number.isFinite(raw.retryCount) ? raw.retryCount : 0,
    slaRemainingMinutes: Number.isFinite(raw.slaRemainingMinutes) ? raw.slaRemainingMinutes : null,
    recentEvents: Array.isArray(raw.recentEvents) ? raw.recentEvents : [],
    errors: Array.isArray(raw.errors) ? raw.errors : [],
    missingFields: Array.isArray(raw.missingFields) ? raw.missingFields : [],
    allowedActions: Array.isArray(raw.allowedActions) && raw.allowedActions.length
      ? raw.allowedActions
      : ['retry', 'escalate', 'request_info', 'reroute', 'pause', 'notify'],
    customerTier: raw.customerTier || 'standard',
    businessImpact: raw.businessImpact || 'unknown',
    historicalHints: Array.isArray(raw.historicalHints) ? raw.historicalHints : [],
    policyRefs: Array.isArray(raw.policyRefs) ? raw.policyRefs : [],
  };
}

function validateExplainWhyResult(result) {
  if (!result || typeof result !== 'object') return 'Result must be an object';
  if (!result.recommendedAction || typeof result.recommendedAction !== 'object') return 'recommendedAction is required';
  if (typeof result.whyNow !== 'string') return 'whyNow is required';
  if (typeof result.whyFitsObjective !== 'string') return 'whyFitsObjective is required';
  if (!Array.isArray(result.tradeoffs)) return 'tradeoffs must be an array';
  if (!Array.isArray(result.objectiveScorecard)) return 'objectiveScorecard must be an array';
  if (typeof result.confidence !== 'number') return 'confidence must be a number';
  if (!Array.isArray(result.assumptions)) return 'assumptions must be an array';
  if (!Array.isArray(result.citations)) return 'citations must be an array';
  if (typeof result.insufficientContext !== 'boolean') return 'insufficientContext must be boolean';
  return null;
}

async function generateWithGemini(userContent) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_PROMPT,
  });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  return result.response.text();
}

async function explainWhyWithGemini(userContent) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: EXPLAIN_WHY_SYSTEM_PROMPT,
  });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userContent }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });
  return result.response.text();
}

async function generateWithAnthropic(modelId, userContent) {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: modelId,
    max_tokens: 4096,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userContent }],
  });
  return message.content.find((b) => b.type === 'text')?.text ?? '';
}

async function explainWhyWithAnthropic(modelId, userContent) {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: modelId,
    max_tokens: 4096,
    system: [{ type: 'text', text: EXPLAIN_WHY_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userContent }],
  });
  return message.content.find((b) => b.type === 'text')?.text ?? '';
}

router.get('/models', (_req, res) => {
  res.json(
    Object.entries(MODELS).map(([key, m]) => ({ key, label: m.label }))
  );
});

router.post('/workflow-from-description', async (req, res) => {
  try {
    const {
      description,
      objective = '',
      context = '',
      caseTemplates = [],
      communicationTemplates = [],
      model: modelKey = 'gemini-flash',
    } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: 'description is required' });
    }

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) {
      return res.status(400).json({ error: `Unknown model: ${modelKey}` });
    }

    const contextParts = [];
    if (objective?.trim()) {
      contextParts.push(`Workflow objective:\n${objective.trim()}`);
    }
    if (context?.trim()) {
      contextParts.push(`Workflow context:\n${context.trim()}`);
    }
    if (caseTemplates.length) {
      contextParts.push(`Available case templates:\n${caseTemplates.map((t) => `- id: "${t.id}", name: "${t.name}"`).join('\n')}`);
    }
    if (communicationTemplates.length) {
      contextParts.push(`Available communication templates:\n${communicationTemplates.map((t) => `- id: "${t.id}", name: "${t.name}", channel: "${t.channel || 'email'}"`).join('\n')}`);
    }
    const userContent = contextParts.length
      ? `${contextParts.join('\n\n')}\n\nWorkflow to build:\n${description}`
      : description;

    const rawText = modelConfig.provider === 'gemini'
      ? await generateWithGemini(userContent)
      : await generateWithAnthropic(modelConfig.id, userContent);

    const jsonStr = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const workflow = JSON.parse(jsonStr);

    res.json({ ...workflow, _meta: { usedModel: modelKey } });
  } catch (err) {
    console.error('AI workflow generation error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }
    if (isGeminiQuotaError(err)) {
      return res.status(429).json({
        error: 'Gemini quota exceeded. Switch to Claude Haiku/Opus in the model picker or retry later.',
      });
    }
    res.status(500).json({ error: err.message || 'Failed to generate workflow' });
  }
});

router.post('/explain-why', async (req, res) => {
  try {
    const {
      objective = {},
      context = {},
      model: modelKey = 'gemini-flash',
    } = req.body || {};

    const modelConfig = MODELS[modelKey];
    if (!modelConfig) {
      return res.status(400).json({ error: `Unknown model: ${modelKey}` });
    }

    const objectiveProfile = buildObjectiveProfile(objective);
    const runtimeContext = buildRuntimeContext(context);

    const userContent = JSON.stringify(
      {
        objectiveProfile,
        runtimeContext,
        instruction: 'Recommend the next best action and explain why it aligns with objective and context.',
      },
      null,
      2
    );

    const rawText = modelConfig.provider === 'gemini'
      ? await explainWhyWithGemini(userContent)
      : await explainWhyWithAnthropic(modelConfig.id, userContent);

    const jsonStr = rawText.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    const explainResult = JSON.parse(jsonStr);

    const validationError = validateExplainWhyResult(explainResult);
    if (validationError) {
      return res.status(500).json({ error: `AI response schema invalid: ${validationError}` });
    }

    res.json({
      objectiveProfile,
      runtimeContext,
      decision: explainResult,
      modelUsed: modelKey,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('AI explain why error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }
    if (isGeminiQuotaError(err)) {
      return res.status(429).json({
        error: 'Gemini quota exceeded. Switch to Claude Haiku/Opus in the model picker or retry later.',
      });
    }
    res.status(500).json({ error: err.message || 'Failed to generate explanation' });
  }
});

module.exports = router;
