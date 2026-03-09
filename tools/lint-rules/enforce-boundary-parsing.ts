/**
 * Rule: Enforce boundary parsing with zod
 *
 * All API route handlers must validate request body/params/query with zod.
 * All LLM responses must be parsed with zod before passing to business logic.
 *
 * This is GP-01 from the Golden Principles.
 */

export const RULE_DESCRIPTION = `
Data must be parsed at boundaries:
- API routes: use zod to validate request body, params, and query
- LLM responses: parse with zod schema before passing to service layer
- WebSocket messages: validate incoming messages with zod

Reference: docs/project-framework.md#8-黄金原则 (GP-01)
`;
