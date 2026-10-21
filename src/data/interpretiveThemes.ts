import { InterpretiveTheme, SpatialAnnotation, ThemeTourRoute } from '../types';

export const PRESET_INTERPRETIVE_THEMES: InterpretiveTheme[] = [];

/**
 * Calculates a 3D distance between two spatial points
 */
export function calculate3DDistance(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Automatically calculates an optimized 3D tour route for a specific interpretive theme.
 * Uses a nearest-neighbor traversal starting from the point closest to the model center/origin
 * to ensure smooth virtual tour camera movement.
 */
export function calculateThemeRoute(
  themeName: string,
  annotations: SpatialAnnotation[],
  themeColor: string = '#3B82F6',
  customOrderIds?: string[]
): ThemeTourRoute {
  // Filter annotations tagged with this theme
  const tagged = annotations.filter((a) =>
    a.interpretiveThemes?.some((t) => t.toLowerCase() === themeName.toLowerCase())
  );

  if (tagged.length === 0) {
    return {
      themeId: themeName.toLowerCase().replace(/\s+/g, '-'),
      themeName,
      color: themeColor,
      stops: [],
      totalDistance: 0
    };
  }

  let ordered: SpatialAnnotation[] = [];

  if (customOrderIds && customOrderIds.length > 0) {
    const map = new Map(tagged.map((a) => [a.id, a]));
    customOrderIds.forEach((id) => {
      const item = map.get(id);
      if (item) {
        ordered.push(item);
        map.delete(id);
      }
    });
    // Append any newly added tagged items not present in custom order
    map.forEach((item) => ordered.push(item));
  } else {
    // Optimize order via nearest-neighbor path starting from point closest to origin
    const unvisited = [...tagged];

    let currentIdx = 0;
    let minOriginDist = Infinity;
    unvisited.forEach((anno, idx) => {
      const d = calculate3DDistance(anno.position, { x: 0, y: 0, z: 0 });
      if (d < minOriginDist) {
        minOriginDist = d;
        currentIdx = idx;
      }
    });

    let current = unvisited.splice(currentIdx, 1)[0];
    ordered.push(current);

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minD = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = calculate3DDistance(current.position, unvisited[i].position);
        if (dist < minD) {
          minD = dist;
          nearestIdx = i;
        }
      }

      current = unvisited.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }
  }

  // Compute total route length and construct stops
  let totalDistance = 0;
  const stops = ordered.map((anno, idx) => {
    if (idx > 0) {
      totalDistance += calculate3DDistance(ordered[idx - 1].position, anno.position);
    }

    // Resolve assigned narration for this theme
    let matchedNarration = undefined;
    const boundId = anno.themeNarrationBindings?.[themeName];
    if (boundId && anno.narrations) {
      matchedNarration = anno.narrations.find((n) => n.id === boundId);
    }
    if (!matchedNarration && anno.narrations && anno.narrations.length > 0) {
      matchedNarration =
        anno.narrations.find((n) => n.targetTheme?.toLowerCase() === themeName.toLowerCase()) ||
        anno.narrations.find((n) => n.isDefault) ||
        anno.narrations[0];
    }

    const narrationText = matchedNarration?.text || anno.audienceNarration || anno.description || 'No detailed description recorded.';

    return {
      stopNumber: idx + 1,
      annotationId: anno.id,
      annotationTitle: anno.title,
      position: anno.position,
      description: narrationText,
      themes: anno.interpretiveThemes || [],
      narrationText,
      narrationTone: matchedNarration?.tone || anno.audienceNarrationTone,
      narrationTitle: matchedNarration?.title,
      narrationKnowledgeLevel: matchedNarration?.knowledgeLevel
    };
  });

  return {
    themeId: themeName.toLowerCase().replace(/\s+/g, '-'),
    themeName,
    color: themeColor,
    stops,
    totalDistance: Math.round(totalDistance * 100) / 100
  };
}
