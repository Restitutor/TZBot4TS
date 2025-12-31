#!/usr/bin/env bash
pnpm prettier --cache --write src
pnpm eslint --cache --fix src