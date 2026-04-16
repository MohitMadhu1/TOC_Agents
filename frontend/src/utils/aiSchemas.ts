import { z } from "zod";

/**
 * Zod Schema for Automata Graphs
 * Shared between Frontend and Vercel Serverless Functions
 */
export const AutomataSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().describe("Unique lowercase ID like 'q0', 'q1'"),
      label: z.string().describe("Display name, usually the same as ID, e.g., 'Q0'"),
      isInitial: z.boolean().describe("Whether this is the start state"),
      isFinal: z.boolean().describe("Whether this is an accepting state"),
    })
  ).describe("The set of states in the automaton"),
  edges: z.array(
    z.object({
      source: z.string().describe("Source node ID"),
      target: z.string().describe("Target node ID"),
      label: z.string().describe("Transition symbol(s), e.g., '0' or '1' or '0, 1'"),
    })
  ).describe("The set of transitions between states"),
});

export type AutomataDefinition = z.infer<typeof AutomataSchema>;
