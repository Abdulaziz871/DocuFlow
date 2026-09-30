const mongoose = require('mongoose');

// A single condition, e.g. { field: "totalAmount", operator: "greaterThan", value: 5000 }
const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true }, // dot-path into the extracted JSON, e.g. "totalAmount"
    operator: {
      type: String,
      enum: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'contains', 'exists'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['flag', 'setStatus', 'sendWebhookAlert', 'sendEmailAlert', 'requireApproval'],
      required: true,
    },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    documentType: { type: String, default: 'any' }, // e.g. "invoice", "receipt", "any"
    isActive: { type: Boolean, default: true },
    // all conditions in the list must match (AND). Extend to support OR groups later if needed.
    conditions: {
      type: [conditionSchema],
      default: [],
      validate: {
        // Number("20 الف") is NaN, which would make the condition silently never match.
        validator: (conds) =>
          conds.every(
            (c) => !['greaterThan', 'lessThan'].includes(c.operator) || (c.value !== '' && c.value !== null && Number.isFinite(Number(c.value)))
          ),
        message: 'greaterThan/lessThan conditions need a plain numeric value (e.g. 20000).',
      },
    },
    actions: { type: [actionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Rule', ruleSchema);
