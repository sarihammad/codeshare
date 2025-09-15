#!/bin/bash

# Git History Scrub Script for CodeShare
# WARNING: This script will rewrite git history. Use with extreme caution.
# Only run this on a clean working directory with no uncommitted changes.

set -e

echo "⚠️  WARNING: This script will rewrite git history!"
echo "⚠️  Make sure you have backups and coordinate with your team!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "❌ Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

echo "🧹 Starting git history scrub..."

# Method 1: Using BFG Repo-Cleaner (Recommended)
# Download BFG first: https://rtyley.github.io/bfg-repo-cleaner/
# java -jar bfg.jar --delete-files "*.env*" --delete-files "application.yml" --replace-text <(echo 'JWT_SECRET==>JWT_SECRET=<CHANGED>') --replace-text <(echo 'NEXTAUTH_SECRET==>NEXTAUTH_SECRET=<CHANGED>') --replace-text <(echo 'OPENAI_API_KEY==>OPENAI_API_KEY=<CHANGED>') --replace-text <(echo 'password:.*==>password: <CHANGED>') --replace-text <(echo 'secret:.*==>secret: <CHANGED>') .

# Method 2: Using git filter-repo (Alternative)
# Install: pip install git-filter-repo

# Remove specific files
git filter-repo --path frontend/.env --path frontend/.env.local --path frontend/.env.production --invert-paths --force

# Replace secrets in remaining files
git filter-repo --replace-text <(echo 'JWT_SECRET=.*==>JWT_SECRET=<CHANGED>') --force
git filter-repo --replace-text <(echo 'NEXTAUTH_SECRET=.*==>NEXTAUTH_SECRET=<CHANGED>') --force
git filter-repo --replace-text <(echo 'OPENAI_API_KEY=.*==>OPENAI_API_KEY=<CHANGED>') --force
git filter-repo --replace-text <(echo 'password:.*==>password: <CHANGED>') --force
git filter-repo --replace-text <(echo 'secret:.*==>secret: <CHANGED>') --force

echo "✅ Git history scrub completed!"

# Post-scrub checklist
echo ""
echo "📋 POST-SCRUB CHECKLIST:"
echo "1. ✅ Rotate all JWT secrets in production"
echo "2. ✅ Rotate database passwords"
echo "3. ✅ Rotate API keys (OpenAI, Google, etc.)"
echo "4. ✅ Rotate NextAuth secrets"
echo "5. ✅ Re-issue all deploy tokens"
echo "6. ✅ Update CI/CD secrets in GitHub Actions"
echo "7. ✅ Force push to remote: git push --force-with-lease origin main"
echo "8. ✅ Notify team of history rewrite"
echo "9. ✅ Update any documentation with old commit hashes"
echo "10. ✅ Verify all environments use new secrets"

echo ""
echo "⚠️  IMPORTANT: After force-pushing, all team members must:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
echo "   (This will lose any local commits not pushed)"

echo ""
echo "🔐 Security reminder:"
echo "   - Monitor for any leaked secrets in logs"
echo "   - Check third-party services for unauthorized access"
echo "   - Review access logs for suspicious activity"
