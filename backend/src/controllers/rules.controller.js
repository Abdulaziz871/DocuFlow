const Rule = require('../models/Rule');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// POST /api/v1/rules
const createRule = asyncHandler(async (req, res) => {
  const rule = await Rule.create({ ...req.body, company: req.user.company, createdBy: req.user._id });
  res.status(201).json({ success: true, data: rule });
});

// GET /api/v1/rules
const listRules = asyncHandler(async (req, res) => {
  const rules = await Rule.find({ company: req.user.company }).sort({ createdAt: -1 });
  res.json({ success: true, data: rules });
});

// PUT /api/v1/rules/:id
const updateRule = asyncHandler(async (req, res) => {
  const rule = await Rule.findOneAndUpdate(
    { _id: req.params.id, company: req.user.company },
    req.body,
    { new: true, runValidators: true }
  );
  if (!rule) throw new ApiError(404, 'Rule not found.');
  res.json({ success: true, data: rule });
});

// DELETE /api/v1/rules/:id
const deleteRule = asyncHandler(async (req, res) => {
  const rule = await Rule.findOneAndDelete({ _id: req.params.id, company: req.user.company });
  if (!rule) throw new ApiError(404, 'Rule not found.');
  res.json({ success: true, data: {} });
});

module.exports = { createRule, listRules, updateRule, deleteRule };
