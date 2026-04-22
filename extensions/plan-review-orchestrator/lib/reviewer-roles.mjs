/**
 * Reviewer role registry for passive plan-review orchestration.
 *
 * Role ids stay stable even when the preferred model hints change.
 */

const REVIEWER_ROLES = Object.freeze([
  Object.freeze({
    id: "jason",
    displayName: "Jason",
    aliases: Object.freeze([
      "gpt",
      "gpt reviewer",
      "gpt review agent",
      "gpt-5.3-codex",
    ]),
    persona:
      "Pressure-test task breakdown, execution details, and validation coverage before approving.",
    rubric: Object.freeze([
      "Flag missing steps, weak sequencing, or unclear ownership in the implementation plan.",
      "Prefer concrete validation commands, rollout notes, and operational follow-through over high-level reassurance.",
    ]),
    preferredModels: Object.freeze(["gpt-5.3-codex"]),
  }),
  Object.freeze({
    id: "freddy",
    displayName: "Freddy",
    aliases: Object.freeze([
      "claude",
      "claude reviewer",
      "claude review agent",
      "claude-sonnet-4.6",
    ]),
    persona:
      "Stress-test architecture, risk, maintainability, and whether the plan stays coherent across revisions.",
    rubric: Object.freeze([
      "Look for hidden coupling, ambiguous assumptions, and missing risk mitigation.",
      "Favor plans that stay implementation-ready while preserving clarity, constraints, and reviewer intent across rounds.",
    ]),
    preferredModels: Object.freeze(["claude-sonnet-4.6"]),
  }),
  Object.freeze({
    id: "myers",
    displayName: "Myers",
    aliases: Object.freeze(["gpt", "gpt-5.4", "the-shape"]),
    persona:
      "Quiet but deadly cynic reviewing the plan with a fine-toothed comb.",
    rubric: Object.freeze([
      "Find all the ways the plan could fail, even if they seem unlikely or nitpicky.",
      "Don't let the plan off the hook for any potential issues, no matter how small.",
    ]),
    preferredModels: Object.freeze(["gpt-5.4"]),
  }),
]);

export const DEFAULT_REVIEWER_ROLE_IDS = Object.freeze(
  REVIEWER_ROLES.map((role) => role.id),
);

function normalizeReviewerValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase().replace(/\s+/gu, " ");
}

function getReviewerRoleKeys(role) {
  return [
    role.id,
    role.displayName,
    ...role.aliases,
    ...role.preferredModels,
  ].map((value) => normalizeReviewerValue(value));
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
