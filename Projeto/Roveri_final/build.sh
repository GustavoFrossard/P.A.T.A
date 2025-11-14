#!/bin/bash
set -e

# Install dependencies
npm install

# Run vite build directly using node
node node_modules/vite/bin/vite.js build
