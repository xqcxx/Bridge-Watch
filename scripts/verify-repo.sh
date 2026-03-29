#!/bin/bash

# Configuration
BRANCH=$(git branch --show-current)
REPO_NAME=$(basename $(git rev-parse --show-toplevel))

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Health Check for $REPO_NAME (Branch: $BRANCH) ===${NC}\n"

# 1. Remote CI Status Check
echo -e "${YELLOW}[Layer 1] Checking Remote CI Status (via GitHub CLI)...${NC}"
LATEST_RUN=$(gh run list --branch "$BRANCH" --limit 1 --json status,conclusion,displayTitle)
STATUS=$(echo "$LATEST_RUN" | jq -r '.[0].status')
CONCLUSION=$(echo "$LATEST_RUN" | jq -r '.[0].conclusion')
TITLE=$(echo "$LATEST_RUN" | jq -r '.[0].displayTitle')

if [[ "$STATUS" == "completed" ]]; then
    if [[ "$CONCLUSION" == "success" ]]; then
        echo -e "${GREEN}✓ Remote CI is GREEN: $TITLE${NC}"
    else
        echo -e "${RED}✗ Remote CI is RED: $TITLE (Conclusion: $CONCLUSION)${NC}"
    fi
else
    echo -e "${YELLOW}! Remote CI is currently $STATUS: $TITLE${NC}"
fi

echo ""

# 2. Local Fast Checks
echo -e "${YELLOW}[Layer 2] Running Local Fast Checks (Linting, Formatting)...${NC}"

# Backend Lint
if [ -d "backend" ]; then
    echo -e "Checking Backend..."
    npm run lint --workspace=backend > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Backend Lint Clean${NC}"
    else
        echo -e "  ${RED}✗ Backend Lint Failed (Run 'npm run lint --workspace=backend' to see errors)${NC}"
    fi
fi

# Frontend Lint
if [ -d "frontend" ]; then
    echo -e "Checking Frontend..."
    npm run lint --workspace=frontend > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Frontend Lint Clean${NC}"
    else
        echo -e "  ${RED}✗ Frontend Lint Failed (Run 'npm run lint --workspace=frontend' to see errors)${NC}"
    fi
fi

# Contracts (Rust) Check
if [ -d "contracts" ]; then
    echo -e "Checking Contracts..."
    cargo fmt --all -- --check > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Contracts Format Clean${NC}"
    else
        echo -e "  ${RED}✗ Contracts Format Issues (Run 'cargo fmt' to fix)${NC}"
    fi
fi

echo ""

# 3. CI Simulation Prompt
echo -e "${YELLOW}[Layer 3] CI Simulation (via gh act)...${NC}"
echo -e "To run a full CI simulation locally, use:"
echo -e "  ${BLUE}gh act -j backend${NC}    (to test backend integration)"
echo -e "  ${BLUE}gh act -j contracts${NC}  (to test contract build/tests)"
echo ""
echo -e "${BLUE}Health Check Complete.${NC}"
