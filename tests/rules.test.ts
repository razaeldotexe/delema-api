import { describe, it, expect } from 'vitest';
import { evaluateRule, evaluateGroup, traverseTree } from '../src/logic/rules_engine';
import { Rule, RuleGroup, DecisionTreeNode } from '../src/types/schemas';

describe('Rules Engine', () => {
  describe('evaluateRule', () => {
    const facts = { age: 25, name: 'Alice', tags: ['admin', 'user'] };

    it('should handle "=" operator', () => {
      const rule: Rule = { field: 'age', operator: '=', value: 25 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 30 }, facts)).toBe(false);
    });

    it('should handle "!=" operator', () => {
      const rule: Rule = { field: 'age', operator: '!=', value: 30 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 25 }, facts)).toBe(false);
    });

    it('should handle ">" operator', () => {
      const rule: Rule = { field: 'age', operator: '>', value: 20 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 30 }, facts)).toBe(false);
    });

    it('should handle "<" operator', () => {
      const rule: Rule = { field: 'age', operator: '<', value: 30 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 20 }, facts)).toBe(false);
    });

    it('should handle ">=" operator', () => {
      const rule: Rule = { field: 'age', operator: '>=', value: 25 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 30 }, facts)).toBe(false);
    });

    it('should handle "<=" operator', () => {
      const rule: Rule = { field: 'age', operator: '<=', value: 25 };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: 20 }, facts)).toBe(false);
    });

    it('should handle "IN" operator', () => {
      const rule: Rule = { field: 'age', operator: 'IN', value: [20, 25, 30] };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: [20, 30] }, facts)).toBe(false);
    });

    it('should handle "NOT IN" operator', () => {
      const rule: Rule = { field: 'age', operator: 'NOT IN', value: [20, 30] };
      expect(evaluateRule(rule, facts)).toBe(true);
      expect(evaluateRule({ ...rule, value: [20, 25, 30] }, facts)).toBe(false);
    });

    it('should return false for unknown operator', () => {
      const rule: Rule = { field: 'age', operator: 'UNKNOWN', value: 25 };
      expect(evaluateRule(rule, facts)).toBe(false);
    });
  });

  describe('evaluateGroup', () => {
    const facts = { age: 25, country: 'US' };

    it('should handle "AND" condition', () => {
      const group: RuleGroup = {
        condition: 'AND',
        rules: [
          { field: 'age', operator: '>=', value: 18 },
          { field: 'country', operator: '=', value: 'US' },
        ],
      };
      expect(evaluateGroup(group, facts)).toBe(true);
      expect(evaluateGroup({ ...group, condition: 'OR' }, facts)).toBe(true);
      
      const failingGroup: RuleGroup = {
        condition: 'AND',
        rules: [
          { field: 'age', operator: '>=', value: 18 },
          { field: 'country', operator: '=', value: 'UK' },
        ],
      };
      expect(evaluateGroup(failingGroup, facts)).toBe(false);
    });

    it('should handle "OR" condition', () => {
      const group: RuleGroup = {
        condition: 'OR',
        rules: [
          { field: 'age', operator: '>=', value: 30 },
          { field: 'country', operator: '=', value: 'US' },
        ],
      };
      expect(evaluateGroup(group, facts)).toBe(true);
    });

    it('should handle nested groups', () => {
      const group: RuleGroup = {
        condition: 'AND',
        rules: [
          { field: 'age', operator: '>=', value: 18 },
          {
            condition: 'OR',
            rules: [
              { field: 'country', operator: '=', value: 'US' },
              { field: 'country', operator: '=', value: 'CA' },
            ],
          },
        ],
      };
      expect(evaluateGroup(group, facts)).toBe(true);
      expect(evaluateGroup(group, { age: 17, country: 'US' })).toBe(false);
      expect(evaluateGroup(group, { age: 20, country: 'UK' })).toBe(false);
    });
  });

  describe('traverseTree', () => {
    const tree: DecisionTreeNode = {
      condition: { field: 'age', operator: '>=', value: 18 },
      true_node: {
        condition: { field: 'has_license', operator: '=', value: true },
        true_node: 'can_drive',
        false_node: 'cannot_drive_no_license',
      },
      false_node: 'too_young',
    };

    it('should traverse tree correctly', () => {
      expect(traverseTree(tree, { age: 20, has_license: true })).toBe('can_drive');
      expect(traverseTree(tree, { age: 20, has_license: false })).toBe('cannot_drive_no_license');
      expect(traverseTree(tree, { age: 16 })).toBe('too_young');
    });

    it('should handle leaf nodes with value', () => {
      const leaf: DecisionTreeNode = { value: 'result' };
      expect(traverseTree(leaf, {})).toBe('result');
    });

    it('should return null if no condition or value', () => {
      const empty: DecisionTreeNode = {};
      expect(traverseTree(empty, {})).toBe(null);
    });
  });
});
