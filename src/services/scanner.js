'use strict';

const { HAZARDS } = require('../content');

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(min, Math.min(max, number));
}

function normalizeStats(input) {
  if (!input || typeof input !== 'object') return null;
  const avgR = clamp(input.avgR, 0, 255);
  const avgG = clamp(input.avgG, 0, 255);
  const avgB = clamp(input.avgB, 0, 255);
  if (avgR === null || avgG === null || avgB === null) return null;
  return {
    avgR,
    avgG,
    avgB,
    brightness: clamp(input.brightness, 0, 255) ?? (avgR + avgG + avgB) / 3,
    contrast: clamp(input.contrast, 0, 255) ?? 40
  };
}

function labelOf(hazard) {
  return (hazard.name + ' ' + hazard.keywords.join(' ') + ' ' + hazard.id).toLowerCase();
}

/**
 * Deterministic, offline assistive image triage.
 * Clients send a small colour summary computed from the photo plus optional
 * keywords/hint/manual category. It never claims to be a certified diagnosis.
 */
function analyze(input = {}) {
  const hint = String(input.hint || '').toLowerCase().trim();
  const fileName = String(input.fileName || '').toLowerCase().trim();
  const text = hint + ' ' + fileName;
  const stats = normalizeStats(input.stats);

  if (input.category) {
    const manual = HAZARDS.find((item) => item.id === input.category);
    if (manual) {
      return {
        hazardId: manual.id,
        name: manual.name,
        icon: manual.icon,
        risk: manual.risk,
        summary: manual.summary,
        action: manual.action,
        confidence: 100,
        source: 'manual',
        lowConfidence: false
      };
    }
  }

  const ranked = HAZARDS.map((hazard) => {
    let score = 0;
    const label = labelOf(hazard);
    for (const keyword of hazard.keywords) {
      if (text.includes(String(keyword).toLowerCase())) score += 14;
    }
    if (stats) {
      const reddominant = stats.avgR > stats.avgG * 1.22 && stats.avgR > stats.avgB * 1.18 && stats.brightness < 180;
      const brightSharp = stats.brightness > 145 && stats.contrast > 55;
      const dark = stats.brightness < 95;
      const greenish = stats.avgG > stats.avgR * 1.15 && stats.avgG > stats.avgB * 1.1;
      if (reddominant && /medical|chemical|bio|red/.test(label)) score += 16;
      if (brightSharp && /glass|metal|sharp/.test(label)) score += 14;
      if (dark && /batter|ewaste|electronic/.test(label)) score += 12;
      if (greenish && /organic|paper|plastic|leaf/.test(label)) score += 8;
    }
    return { hazard, score };
  }).sort((a, b) => b.score - a.score);

  const top = ranked[0];
  let chosen = top.hazard;
  let confidence;

  if (top.score >= 28) {
    confidence = Math.min(96, 60 + top.score * 0.8);
  } else if (top.score > 0) {
    confidence = 52 + top.score;
  } else {
    chosen = HAZARDS.find((item) => item.id === 'mixed') || HAZARDS[HAZARDS.length - 1];
    confidence = 45;
  }
  confidence = Math.round(confidence);

  return {
    hazardId: chosen.id,
    name: chosen.name,
    icon: chosen.icon,
    risk: chosen.risk,
    summary: chosen.summary,
    action: chosen.action,
    confidence,
    source: top.score >= 28 ? 'image+keywords' : top.score > 0 ? 'weak-signal' : 'unknown',
    lowConfidence: confidence < 70
  };
}

module.exports = { analyze };
