/**
 * Rule: Enforce structured logging
 *
 * Backend code must use pino logger instead of console.log.
 * Logger calls must include an event name as the first argument.
 *
 * Good: logger.info({ event: 'turn_completed', instanceId, turn })
 * Bad:  console.log('Turn completed', turn)
 */

export const RULE_DESCRIPTION = `
Backend code must use structured logging via pino.
- Import logger from the appropriate module
- Always include { event: 'event_name' } as the first argument
- Do not use console.log, console.info, console.debug
- console.warn and console.error are allowed only in entry points

Reference: docs/project-framework.md#8-黄金原则
`;
