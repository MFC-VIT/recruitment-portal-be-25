const Interviewer = require("../models/interviewerModel");
const PanelAssignment = require("../models/panelAssignmentModel");
const { freeBusy } = require("./calendar");

const overlaps = (aStart, aEnd, bStart, bEnd) =>
  new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);

const dayBounds = (date) => {
  // Interviews run late at night IST, so "a day" is counted in IST.
  const ist = new Date(date.getTime() + 5.5 * 3600e3);
  const start = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - 5.5 * 3600e3);
  return [start, new Date(start.getTime() + 864e5)];
};

// Orders candidates for a seat: lightest total load first, then expertise
// match, then a random tiebreak so the same person isn't always first.
const rank = (pool, loads, wantedSubdomains) =>
  pool
    .map((i) => ({
      i,
      load: loads.get(i.email) || 0,
      match: i.subdomains.some((s) => wantedSubdomains.includes(s)) ? 1 : 0,
      r: Math.random(),
    }))
    .sort((a, b) => a.load - b.load || b.match - a.match || a.r - b.r)
    .map((x) => x.i);

/**
 * Picks and locks a panel for one interview.
 * At least one interviewer per interview domain when possible, topped up to
 * `size` from anyone eligible. Returns { emails, missingDomains }.
 * Eligible = active, not marked unavailable, under their daily cap, not already
 * on another panel at this time, and free in Google Calendar when we can see it.
 */
const assignPanel = async ({ userId, domains, subdomains = [], start, end, size, calendar }) => {
  const interviewers = await Interviewer.find({ active: true }).lean();
  if (interviewers.length === 0) return null; // not configured: caller falls back

  const [dayStart, dayEnd] = dayBounds(start);
  const [totals, today, busy] = await Promise.all([
    PanelAssignment.aggregate([{ $group: { _id: "$email", n: { $sum: 1 } } }]),
    PanelAssignment.aggregate([
      { $match: { startTime: { $gte: dayStart, $lt: dayEnd } } },
      { $group: { _id: "$email", n: { $sum: 1 } } },
    ]),
    freeBusy(calendar, interviewers.map((i) => i.email), start, end),
  ]);
  const loads = new Map(totals.map((t) => [t._id, t.n]));
  const dayLoads = new Map(today.map((t) => [t._id, t.n]));

  const eligible = interviewers.filter(
    (i) =>
      (dayLoads.get(i.email) || 0) < i.maxPerDay &&
      !(i.unavailable || []).some((u) => overlaps(start, end, u.start, u.end)) &&
      !(busy.get(i.email) || []).some((b) => overlaps(start, end, b.start, b.end))
  );

  const picked = [];
  const tryLock = async (interviewer, domain) => {
    try {
      await PanelAssignment.create({
        email: interviewer.email,
        startTime: start,
        endTime: end,
        user_id: userId,
        domain,
      });
      picked.push(interviewer.email);
      return true;
    } catch (err) {
      if (err.code === 11000) return false; // already on another panel at this time
      throw err;
    }
  };

  const missingDomains = [];
  for (const domain of domains) {
    const pool = eligible.filter((i) => i.domains.includes(domain) && !picked.includes(i.email));
    let got = false;
    for (const i of rank(pool, loads, subdomains)) {
      if (await tryLock(i, domain)) {
        got = true;
        break;
      }
    }
    if (!got) missingDomains.push(domain);
  }

  const rest = rank(eligible.filter((i) => !picked.includes(i.email)), loads, subdomains);
  for (const i of rest) {
    if (picked.length >= size) break;
    await tryLock(i, null);
  }

  return { emails: picked, missingDomains };
};

const releasePanel = (userId, startTime) =>
  PanelAssignment.deleteMany({ user_id: userId, startTime });

module.exports = { assignPanel, releasePanel, rank, overlaps, dayBounds };
