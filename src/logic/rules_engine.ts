import { Rule, RuleGroup, DecisionTreeNode } from '../types/schemas';

/**
 * Evaluates a single rule against a set of facts.
 */
export function evaluateRule(rule: Rule, facts: Record<string, any>): boolean {
  const factVal = facts[rule.field];
  const op = rule.operator.toUpperCase();
  const val = rule.value;

  switch (op) {
    case '=':
      return factVal === val;
    case '!=':
      return factVal !== val;
    case '>':
      return factVal > val;
    case '<':
      return factVal < val;
    case '>=':
      return factVal >= val;
    case '<=':
      return factVal <= val;
    case 'IN':
      return Array.isArray(val) ? val.includes(factVal) : false;
    case 'NOT IN':
      return Array.isArray(val) ? !val.includes(factVal) : false;
    default:
      return false;
  }
}

/**
 * Evaluates a rule group (recursive) against a set of facts.
 */
export function evaluateGroup(group: RuleGroup, facts: Record<string, any>): boolean {
  const results = group.rules.map((r) => {
    if ('condition' in r && 'rules' in r) {
      return evaluateGroup(r as RuleGroup, facts);
    } else {
      return evaluateRule(r as Rule, facts);
    }
  });

  const condition = group.condition.toUpperCase();
  if (condition === 'AND') {
    return results.every((res) => res === true);
  }
  if (condition === 'OR') {
    return results.some((res) => res === true);
  }
  return false;
}

/**
 * Traverses a decision tree based on facts.
 */
export function traverseTree(node: DecisionTreeNode, facts: Record<string, any>): any {
  if (node.value !== undefined && node.value !== null) {
    return node.value;
  }

  if (node.condition) {
    if (evaluateRule(node.condition, facts)) {
      if (node.true_node && typeof node.true_node === 'object' && ('condition' in node.true_node || 'value' in node.true_node)) {
        return traverseTree(node.true_node as DecisionTreeNode, facts);
      }
      return node.true_node;
    } else {
      if (node.false_node && typeof node.false_node === 'object' && ('condition' in node.false_node || 'value' in node.false_node)) {
        return traverseTree(node.false_node as DecisionTreeNode, facts);
      }
      return node.false_node;
    }
  }

  return null;
}
