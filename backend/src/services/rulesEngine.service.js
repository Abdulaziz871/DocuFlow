const Rule = require('../models/Rule');
const logger = require('../utils/logger');

// Reads a dot-path like "customFields.department" off the extracted JSON object.
function getFieldValue(obj, fieldPath) {
  return fieldPath.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function evaluateCondition(condition, data) {
  const actual = getFieldValue(data, condition.field);
  const expected = condition.value;

  switch (condition.operator) {
    case 'equals':
      return actual === expected;
    case 'notEquals':
      return actual !== expected;
    case 'greaterThan':
      return Number(actual) > Number(expected);
    case 'lessThan':
      return Number(actual) < Number(expected);
    case 'contains':
      return typeof actual === 'string' && actual.toLowerCase().includes(String(expected).toLowerCase());
    case 'exists':
      return actual !== undefined && actual !== null;
    default:
      return false;
  }
}

/**
 * Loads active rules for a company (optionally scoped by documentType) and evaluates them
 * against the extracted JSON. Returns the list of matched rules with the actions to apply.
 * All conditions on a rule must pass (AND semantics) for the rule to match.
 */
async function applyRules(companyId, documentType, extractedData) {
  const rules = await Rule.find({
    company: companyId,
    isActive: true,
    $or: [{ documentType }, { documentType: 'any' }],
  });

  const matches = [];

  for (const rule of rules) {
    const allConditionsMet = rule.conditions.every((c) => evaluateCondition(c, extractedData));
    if (allConditionsMet) {
      logger.info(`Rule matched: "${rule.name}" for documentType=${documentType}`);
      matches.push({
        rule,
        actionsTaken: rule.actions.map((a) => a.type),
      });
    }
  }

  return matches;
}

module.exports = { applyRules, evaluateCondition, getFieldValue };
