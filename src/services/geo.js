'use strict';

const https = require('https');
const { CENTRES } = require('../content');

const RAD = Math.PI / 180;

function haversine(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validPosition(pos) {
  return pos && Number.isFinite(Number(pos.lat)) && Number.isFinite(Number(pos.lng)) &&
    Math.abs(Number(pos.lat)) <= 90 && Math.abs(Number(pos.lng)) <= 180;
}

function queryOverpass(pos, radiusMetres) {
  return new Promise((resolve) => {
    const query = '[out:json][timeout:5];(node["amenity"="recycling"](around:' +
      radiusMetres + ',' + pos.lat + ',' + pos.lng + '););out 25;';
    const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const request = https.get(url, { timeout: 4500, headers: { 'User-Agent': 'SurakshaSetu/1.0' } }, (res) => {
      let raw = '';
      res.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > 1_000_000) request.destroy();
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
          const list = elements
            .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon))
            .map((item, index) => {
              const tags = item.tags || {};
              return {
                id: 'OSM-' + item.id,
                name: tags.name || tags.operator || 'Recycling point',
                lat: item.lat,
                lng: item.lon,
                materials: [tags.recycling_type, tags.waste].filter(Boolean).join(' · ') || 'General recyclables',
                hours: tags.opening_hours || 'Hours vary · call ahead',
                verified: false,
                distance: haversine(pos.lat, pos.lng, item.lat, item.lon),
                order: index
              };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 15);
          finish(list);
        } catch (_) {
          finish(null);
        }
      });
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => finish(null));
  });
}

let cache = { key: '', at: 0, list: null };

async function nearbyCentres(position, radiusKm = 12) {
  const radius = Math.max(1, Math.min(50, Number(radiusKm) || 12));
  const pos = validPosition(position) ? { lat: Number(position.lat), lng: Number(position.lng) } : null;
  const key = pos ? pos.lat.toFixed(2) + ',' + pos.lng.toFixed(2) + '@' + radius : 'default';
  if (cache.key === key && Date.now() - cache.at < 10 * 60 * 1000 && cache.list) {
    return cache.list;
  }

  let list = null;
  if (pos) list = await queryOverpass(pos, radius * 1000);

  if (!list || !list.length) {
    list = CENTRES.map((item) => ({
      ...item,
      distance: pos ? haversine(pos.lat, pos.lng, item.lat, item.lng) : null
    })).sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  cache = { key, at: Date.now(), list };
  return list;
}

module.exports = { haversine, nearbyCentres, validPosition };
