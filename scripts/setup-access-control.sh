#!/bin/bash

# Repository Access Control Setup Script
# This script helps you secure your repository and control who can access it

set -e  # Exit on error

REPO_OWNER="tridinhbui"
REPO_NAME="quantfident"
REPO_FULL="${REPO_OWNER}/${REPO_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   QuantFident Repository Access Control Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://cli.github.com/${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠ Not authenticated with GitHub CLI${NC}"
    echo -e "${BLUE}Authenticating...${NC}"
    gh auth login
fi

echo -e "${GREEN}✓ GitHub CLI is ready${NC}"
echo ""

# Step 1: Check current repository visibility
echo -e "${BLUE}Step 1: Checking repository visibility...${NC}"
VISIBILITY=$(gh repo view "$REPO_FULL" --json visibility --jq '.visibility')
IS_PRIVATE=$(gh repo view "$REPO_FULL" --json isPrivate --jq '.isPrivate')

if [ "$IS_PRIVATE" = "true" ]; then
    echo -e "${GREEN}✓ Repository is already PRIVATE${NC}"
else
    echo -e "${YELLOW}⚠ Repository is currently PUBLIC${NC}"
    echo ""
    read -p "Do you want to make this repository PRIVATE? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Making repository private...${NC}"
        gh repo edit "$REPO_FULL" --visibility private
        echo -e "${GREEN}✓ Repository is now PRIVATE${NC}"
    else
        echo -e "${YELLOW}Skipped: Repository remains PUBLIC${NC}"
    fi
fi
echo ""

# Step 2: Verify private docs are protected
echo -e "${BLUE}Step 2: Verifying private documentation protection...${NC}"

if git check-ignore docs/private/COMPLETE_IMPLEMENTATION_GUIDE.md &> /dev/null; then
    echo -e "${GREEN}✓ docs/private/ is properly ignored by git${NC}"
else
    echo -e "${RED}✗ docs/private/ is NOT in .gitignore${NC}"
    echo -e "${YELLOW}This should have been configured already. Check .gitignore!${NC}"
fi

if git check-ignore .env.local &> /dev/null; then
    echo -e "${GREEN}✓ .env.local is properly ignored by git${NC}"
else
    echo -e "${RED}✗ .env.local is NOT in .gitignore${NC}"
fi
echo ""

# Step 3: Check for sensitive files in git
echo -e "${BLUE}Step 3: Scanning for sensitive files in git history...${NC}"

TRACKED_PRIVATE=$(git ls-files | grep "docs/private" || echo "")
TRACKED_ENV=$(git ls-files | grep "\.env" || echo "")

if [ -z "$TRACKED_PRIVATE" ] && [ -z "$TRACKED_ENV" ]; then
    echo -e "${GREEN}✓ No sensitive files found in git${NC}"
else
    echo -e "${RED}✗ Found sensitive files tracked in git:${NC}"
    [ ! -z "$TRACKED_PRIVATE" ] && echo -e "${RED}  - docs/private/ files${NC}"
    [ ! -z "$TRACKED_ENV" ] && echo -e "${RED}  - .env files${NC}"
    echo -e "${YELLOW}⚠ You may need to remove these from git history${NC}"
fi
echo ""

# Step 4: List current collaborators
echo -e "${BLUE}Step 4: Listing current collaborators...${NC}"
COLLABORATORS=$(gh api "repos/${REPO_FULL}/collaborators" --jq '.[].login' 2>/dev/null || echo "")

if [ -z "$COLLABORATORS" ]; then
    echo -e "${YELLOW}No collaborators found (you are the only one with access)${NC}"
else
    echo -e "${GREEN}Current collaborators:${NC}"
    echo "$COLLABORATORS" | while read -r user; do
        echo -e "  - $user"
    done
fi
echo ""

# Step 5: Add new collaborators
echo -e "${BLUE}Step 5: Add collaborators (optional)${NC}"
read -p "Do you want to add a collaborator? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter GitHub username to add: " USERNAME
    echo ""
    echo "Choose permission level:"
    echo "  1) Read  - Can view and clone (view-only)"
    echo "  2) Write - Can push, create branches (recommended)"
    echo "  3) Admin - Full control (use carefully)"
    read -p "Enter choice (1/2/3): " -n 1 -r PERMISSION_CHOICE
    echo ""
    
    case $PERMISSION_CHOICE in
        1) PERMISSION="pull" ;;
        2) PERMISSION="push" ;;
        3) PERMISSION="admin" ;;
        *) 
            echo -e "${RED}Invalid choice. Skipping.${NC}"
            PERMISSION=""
            ;;
    esac
    
    if [ ! -z "$PERMISSION" ]; then
        echo -e "${BLUE}Adding $USERNAME with $PERMISSION access...${NC}"
        gh api "repos/${REPO_FULL}/collaborators/$USERNAME" \
            --method PUT \
            --field permission="$PERMISSION" 2>&1 && \
        echo -e "${GREEN}✓ Collaborator added successfully${NC}" || \
        echo -e "${RED}✗ Failed to add collaborator (check username and your permissions)${NC}"
    fi
else
    echo -e "${YELLOW}Skipped: No collaborators added${NC}"
fi
echo ""

# Step 6: Branch protection
echo -e "${BLUE}Step 6: Branch protection for 'main' branch${NC}"

PROTECTION=$(gh api "repos/${REPO_FULL}/branches/main/protection" 2>/dev/null || echo "none")

if [ "$PROTECTION" = "none" ]; then
    echo -e "${YELLOW}⚠ No branch protection rules for 'main' branch${NC}"
    read -p "Do you want to enable branch protection? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Enabling branch protection...${NC}"
        gh api "repos/${REPO_FULL}/branches/main/protection" \
            --method PUT \
            --field required_status_checks='{"strict":true,"contexts":[]}' \
            --field enforce_admins=false \
            --field required_pull_request_reviews='{"required_approving_review_count":1}' \
            --field restrictions=null 2>&1 && \
        echo -e "${GREEN}✓ Branch protection enabled${NC}" || \
        echo -e "${YELLOW}⚠ Could not enable (may need repo admin access)${NC}"
    else
        echo -e "${YELLOW}Skipped: Branch protection not enabled${NC}"
    fi
else
    echo -e "${GREEN}✓ Branch protection is already configured${NC}"
fi
echo ""

# Step 7: Summary
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}                    SUMMARY                     ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Repository: ${BLUE}https://github.com/${REPO_FULL}${NC}"
echo ""

# Check visibility again
FINAL_VISIBILITY=$(gh repo view "$REPO_FULL" --json isPrivate --jq '.isPrivate')
if [ "$FINAL_VISIBILITY" = "true" ]; then
    echo -e "Visibility: ${GREEN}🔒 PRIVATE${NC}"
else
    echo -e "Visibility: ${YELLOW}🌐 PUBLIC${NC}"
fi

# Private docs status
if git check-ignore docs/private/ &> /dev/null; then
    echo -e "Private Docs: ${GREEN}✓ Protected (gitignored)${NC}"
else
    echo -e "Private Docs: ${RED}✗ Not protected${NC}"
fi

# Environment files
if git check-ignore .env.local &> /dev/null; then
    echo -e "Environment: ${GREEN}✓ Protected (.env.local ignored)${NC}"
else
    echo -e "Environment: ${RED}✗ Not protected${NC}"
fi

# Collaborators count
COLLAB_COUNT=$(gh api "repos/${REPO_FULL}/collaborators" --jq 'length' 2>/dev/null || echo "0")
echo -e "Collaborators: ${BLUE}$COLLAB_COUNT user(s)${NC}"

# Branch protection
if [ "$PROTECTION" != "none" ]; then
    echo -e "Branch Protection: ${GREEN}✓ Enabled on 'main'${NC}"
else
    echo -e "Branch Protection: ${YELLOW}⚠ Not enabled${NC}"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   Access control setup complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Review settings at: ${BLUE}https://github.com/${REPO_FULL}/settings${NC}"
echo -e "  2. Share ${BLUE}docs/public/COLLABORATOR_SETUP.md${NC} with new collaborators"
echo -e "  3. Verify your .env.local is NOT tracked: ${BLUE}git status${NC}"
echo -e "  4. Push changes: ${BLUE}git add . && git commit -m 'docs: add access control' && git push${NC}"
echo ""
