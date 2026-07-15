function canViewReport(user, report) {
  const permittedRole = user.role === 'member' || user.role === 'manager';
  return user.active && user.orgId === report.orgId && permittedRole;
}

module.exports = {
  canViewReport,
};
