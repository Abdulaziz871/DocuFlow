const Document = require('../models/Document');
const Rule = require('../models/Rule');
const ApiKey = require('../models/ApiKey');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/v1/dashboard/overview
// Aggregated stats for the admin/operations dashboard cards.
const overview = asyncHandler(async (req, res) => {
  const companyId = req.user.company;

  const [total, completed, needsReview, failed, activeRules, activeKeys] = await Promise.all([
    Document.countDocuments({ company: companyId }),
    Document.countDocuments({ company: companyId, status: 'completed' }),
    Document.countDocuments({ company: companyId, status: 'needs_review' }),
    Document.countDocuments({ company: companyId, status: 'failed' }),
    Rule.countDocuments({ company: companyId, isActive: true }),
    ApiKey.countDocuments({ company: companyId, isActive: true }),
  ]);

  const recentDocuments = await Document.find({ company: companyId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('originalFileName status documentType createdAt');

  res.json({
    success: true,
    data: {
      stats: { total, completed, needsReview, failed, activeRules, activeKeys },
      recentDocuments,
    },
  });
});

module.exports = { overview };
