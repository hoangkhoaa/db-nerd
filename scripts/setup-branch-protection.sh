#!/usr/bin/env bash
# ==============================================================================
# Script: setup-branch-protection.sh
# Purpose: Configures GitHub Ruleset on 'nerd-riot/db-nerd' for Trunk-Based Dev:
#   - Owner (admin) has direct push & pull access to 'main'.
#   - Contributors cannot push directly to 'main' and must open PRs.
#   - Code owner review required before merging.
#   - Prevent deletion and force-pushing of 'main'.
# ==============================================================================

set -euo pipefail

REPO="nerd-riot/db-nerd"
BRANCH="main"

echo "🛡️ Configuring GitHub Branch Ruleset for: ${REPO} (${BRANCH})..."

TOKEN="${GITHUB_TOKEN:-$(gh auth token 2>/dev/null || true)}"

if [ -z "$TOKEN" ]; then
  echo "❌ Error: GitHub Token not found. Please log in with admin privileges:"
  echo "   gh auth login --scopes repo,admin:org"
  exit 1
fi

PAYLOAD=$(cat << 'EOF'
{
  "name": "Trunk-Based Development: Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": [
        "refs/heads/main"
      ],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    },
    {
      "actor_id": 1,
      "actor_type": "OrganizationAdmin",
      "bypass_mode": "always"
    }
  ]
}
EOF
)

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/rulesets" \
  -d "${PAYLOAD}")

HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_STATUS" -eq 201 ] || [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Successfully configured GitHub Ruleset for 'main'!"
  echo "   - Owner / Admins: Direct push & pull allowed"
  echo "   - Contributors: Direct push blocked, Pull Request required"
else
  echo "⚠️ GitHub API returned HTTP ${HTTP_STATUS}:"
  echo "$BODY"
  echo ""
  echo "💡 Tip: If you don't have admin API scope on your personal token, you can"
  echo "   apply this in 3 clicks directly in GitHub Web UI:"
  echo "   👉 Go to: https://github.com/${REPO}/settings/rules"
fi
