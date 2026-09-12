const scoreHandoff = require('./handoff-resume');

module.exports = (workspace, context = {}) => scoreHandoff(workspace, context, true);
