import type { FlowStep } from '../types';

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface FlowValidation {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

// Client-side mirror of apps/flows/validation.py — same rule IDs and logic.
export function validateFlow(steps: FlowStep[]): FlowValidation {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const starts = steps.filter(s => s.is_start);
  if (starts.length === 0) {
    errors.push({ code: 'V-01', message: 'No start step. Mark one step as the start.' });
  } else if (starts.length > 1) {
    errors.push({ code: 'V-02', message: 'Multiple start steps. Only one step can be the start.' });
  }

  const stepIds = new Set(steps.map(s => s.id));
  const adjacency: Record<number, number[]> = {};

  for (const step of steps) {
    adjacency[step.id] = [];
    for (const opt of step.options) {
      if (opt.next_step !== null) {
        if (!stepIds.has(opt.next_step)) {
          errors.push({ code: 'V-03', message: `"${step.label}" links to a missing step.` });
        } else {
          adjacency[step.id].push(opt.next_step);
        }
      }
      if (opt.button_label.length > 20) {
        warnings.push({ code: 'V-05', message: `Button label too long on "${step.label}".` });
      }
    }
    if (step.options.length > 3) {
      warnings.push({ code: 'V-06', message: `"${step.label}" has ${step.options.length} options — sent as a list message.` });
    }
  }

  // V-04: walk from the single start step via BFS
  if (starts.length === 1) {
    const reachable = new Set<number>();
    const frontier: number[] = [starts[0].id];
    while (frontier.length > 0) {
      const cur = frontier.pop()!;
      if (reachable.has(cur)) continue;
      reachable.add(cur);
      frontier.push(...(adjacency[cur] ?? []));
    }
    for (const step of steps) {
      if (!reachable.has(step.id)) {
        errors.push({ code: 'V-04', message: `"${step.label}" is unreachable from the start step.` });
      }
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}
