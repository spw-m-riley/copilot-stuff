/**
 * Reviewer role registry for passive plan-review orchestration.
 *
 * Role ids stay stable even when aliases or reviewer focus change.
 */

const REVIEWER_ROLES = Object.freeze([
  Object.freeze({
    id: "jason",
    displayName: "Jason",
    aliases: Object.freeze([
      "jason reviewer",
      "technical reviewer",
      "implementation reviewer",
      "camp crystal lake",
    ]),
    persona:
      "Pressure-test task breakdown, execution details, and validation coverage before approving.",
    rubric: Object.freeze([
      "Flag missing steps, weak sequencing, or unclear ownership in the implementation plan.",
      "Prefer concrete validation commands, rollout notes, and operational follow-through over high-level reassurance.",
    ]),
  }),
  Object.freeze({
    id: "freddy",
    displayName: "Freddy",
    aliases: Object.freeze([
      "freddy reviewer",
      "architecture reviewer",
      "clarity reviewer",
    ]),
    persona:
      "Stress-test architecture, risk, maintainability, and whether the plan stays coherent across revisions.",
    rubric: Object.freeze([
      "Look for hidden coupling, ambiguous assumptions, and missing risk mitigation.",
      "Favor plans that stay implementation-ready while preserving clarity, constraints, and reviewer intent across rounds.",
    ]),
  }),
  Object.freeze({
    id: "myers",
    displayName: "Myers",
    aliases: Object.freeze([
      "myers reviewer",
      "skeptical reviewer",
      "the-shape",
    ]),
    persona:
      "Quiet but deadly cynic reviewing the plan with a fine-toothed comb.",
    rubric: Object.freeze([
      "Find all the ways the plan could fail, even if they seem unlikely or nitpicky.",
      "Don't let the plan off the hook for any potential issues, no matter how small.",
    ]),
  }),
]);

export const DEFAULT_REVIEWER_ROLE_IDS = Object.freeze(["jason", "freddy"]);

function normalizeReviewerValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/\s+/gu, " ");
}

function getReviewerRoleKeys(role) {
  return [role.id, role.displayName, ...role.aliases].map((value) =>
    normalizeReviewerValue(value),
  );
}

export function getReviewerRole(roleId) {
  const normalized = normalizeReviewerValue(roleId);
  if (!normalized) {
    return null;
  }

  return (
    REVIEWER_ROLES.find(
      (role) => normalizeReviewerValue(role.id) === normalized,
    ) ?? null
  );
}

export function resolveReviewerRole(value) {
  const normalized = normalizeReviewerValue(value);
  if (!normalized) {
    return null;
  }

  return (
    REVIEWER_ROLES.find((role) =>
      getReviewerRoleKeys(role).includes(normalized),
    ) ?? null
  );
}

export function getTrackedReviewerRole(reviewerId) {
  return getReviewerRole(reviewerId) ?? resolveReviewerRole(reviewerId);
}

export function reviewerRoleMatchesText(role, value) {
  const normalized = normalizeReviewerValue(value);
  if (!role || !normalized) {
    return false;
  }

  return getReviewerRoleKeys(role).some((key) => {
    if (!key) {
      return false;
    }

    return (
      normalized === key || normalized.includes(key) || key.includes(normalized)
    );
  });
}

export function formatReviewerRoleLabel(reviewerId) {
  const role = getTrackedReviewerRole(reviewerId);
  if (!role) {
    return reviewerId;
  }

  return `${role.displayName} (${role.id})`;
}
