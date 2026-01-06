/**
 * Route resolution logic
 */

import { RouteId, RouterResult, RouteDefinition } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROUTES_DIR = join(process.cwd(), 'lib', 'data', 'routes');

export function loadRoute(routeId: RouteId): RouteDefinition {
  const routePath = join(ROUTES_DIR, `${routeId}.json`);
  
  try {
    const content = readFileSync(routePath, 'utf-8');
    return JSON.parse(content) as RouteDefinition;
  } catch (error) {
    console.error(`Failed to load route ${routeId}:`, error);
    return loadRoute('META_UNKNOWN');
  }
}

export function selectBestRoute(routerResult: RouterResult): RouteId {
  if (routerResult.candidate_routes.length === 0) {
    return 'META_UNKNOWN';
  }

  // Sort by score descending
  const sorted = [...routerResult.candidate_routes].sort((a, b) => b.score - a.score);
  return sorted[0].id;
}















