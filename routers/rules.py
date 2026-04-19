from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Union, Optional

router = APIRouter(prefix="/rules", tags=["Rules Engine"])

class Rule(BaseModel):
    field: str
    operator: str  # "=", "!=", ">", "<", ">=", "<=", "IN", "NOT IN"
    value: Any

class RuleGroup(BaseModel):
    condition: str  # "AND", "OR"
    rules: List[Union[Rule, 'RuleGroup']]

RuleGroup.model_rebuild()

class EvaluateRequest(BaseModel):
    ruleset: RuleGroup
    facts: Dict[str, Any]

class DecisionTreeNode(BaseModel):
    condition: Optional[Rule] = None
    true_node: Optional[Union['DecisionTreeNode', Any]] = None
    false_node: Optional[Union['DecisionTreeNode', Any]] = None
    value: Optional[Any] = None

DecisionTreeNode.model_rebuild()

class DecisionTreeRequest(BaseModel):
    tree: DecisionTreeNode
    facts: Dict[str, Any]

def evaluate_rule(rule: Rule, facts: Dict[str, Any]) -> bool:
    fact_val = facts.get(rule.field)
    op = rule.operator.upper()
    val = rule.value

    if op == "=": return fact_val == val
    if op == "!=": return fact_val != val
    if op == ">": return fact_val > val
    if op == "<": return fact_val < val
    if op == ">=": return fact_val >= val
    if op == "<=": return fact_val <= val
    if op == "IN": return fact_val in val if isinstance(val, list) else False
    if op == "NOT IN": return fact_val not in val if isinstance(val, list) else False
    return False

def evaluate_group(group: RuleGroup, facts: Dict[str, Any]) -> bool:
    results = []
    for r in group.rules:
        if isinstance(r, Rule):
            results.append(evaluate_rule(r, facts))
        else:
            results.append(evaluate_group(r, facts))
    
    if group.condition.upper() == "AND":
        return all(results)
    if group.condition.upper() == "OR":
        return any(results)
    return False

@router.post("/evaluate")
async def evaluate_rules(data: EvaluateRequest):
    """
    Evaluate a set of rules against provided facts.
    """
    try:
        matched = evaluate_group(data.ruleset, data.facts)
        return {"matched": matched}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def traverse_tree(node: DecisionTreeNode, facts: Dict[str, Any]) -> Any:
    if node.value is not None:
        return node.value
    
    if node.condition:
        if evaluate_rule(node.condition, facts):
            if isinstance(node.true_node, dict):
                return traverse_tree(DecisionTreeNode(**node.true_node), facts)
            return node.true_node
        else:
            if isinstance(node.false_node, dict):
                return traverse_tree(DecisionTreeNode(**node.false_node), facts)
            return node.false_node
    return None

@router.post("/decision-tree")
async def evaluate_decision_tree(data: DecisionTreeRequest):
    """
    Evaluate a decision tree against provided facts.
    """
    try:
        result = traverse_tree(data.tree, data.facts)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
