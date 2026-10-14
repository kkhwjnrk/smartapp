// DMS to Decimal helper
function dmsToDecimal(degrees, minutes, seconds, direction) {
  let dd = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600;
  if (direction === 'S' || direction === 'W') {
    dd = dd * -1;
  }
  return dd;
}

export function parseGoogleMapsInput(input) {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();

  // 1. Check for DMS format: e.g. 6°35'42.1"S 106°48'59.9"E or 6°35'42.1"S, 106°48'59.9"E
  const dmsRegex = /(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([NSns])\s*,?\s*(\d+)[°\s]+(\d+)['\s]+([\d.]+)"?\s*([EWew])/;
  const dmsMatch = str.match(dmsRegex);
  if (dmsMatch) {
    const lat = dmsToDecimal(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4].toUpperCase());
    const lng = dmsToDecimal(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8].toUpperCase());
    return {
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
      source: 'Format Derajat (DMS)'
    };
  }

  // 2. Google Maps internal data format: !3d-6.595038!4d106.816635
  const dataMatch = str.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (dataMatch) {
    return {
      lat: Number(dataMatch[1]).toFixed(6),
      lng: Number(dataMatch[2]).toFixed(6),
      source: 'Link Google Maps (Place Data)'
    };
  }

  // 3. Google Maps URL with @lat,lng e.g. /@-6.595038,106.816635,17z
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return {
      lat: Number(atMatch[1]).toFixed(6),
      lng: Number(atMatch[2]).toFixed(6),
      source: 'Link Google Maps (@koordinat)'
    };
  }

  // 4. Query param q=lat,lng or query=lat,lng or loc:lat,lng
  const qMatch = str.match(/[?&](?:q|query)=(?:loc:)?(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return {
      lat: Number(qMatch[1]).toFixed(6),
      lng: Number(qMatch[2]).toFixed(6),
      source: 'Link Google Maps (Query)'
    };
  }

  // 5. ll or sll param: ?ll=-6.595038,106.816635
  const llMatch = str.match(/[?&]s?ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (llMatch) {
    return {
      lat: Number(llMatch[1]).toFixed(6),
      lng: Number(llMatch[2]).toFixed(6),
      source: 'Link Google Maps (LL)'
    };
  }

  // 6. Navigation dir or daddr or saddr: /dir//-6.595038,106.816635 or ?daddr=-6.595038,106.816635
  const dirMatch = str.match(/(?:dir\/[^\/]*\/|[?&][ds]addr=)(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (dirMatch) {
    return {
      lat: Number(dirMatch[1]).toFixed(6),
      lng: Number(dirMatch[2]).toFixed(6),
      source: 'Link Rute Google Maps'
    };
  }

  // 7. Clean coordinates: -6.595038, 106.816635 (with or without brackets, space, etc.)
  const cleanStr = str.replace(/^[\[\({\s]+|[\]\)}\s]+$/g, '');
  const coordMatch = cleanStr.match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,|\s]\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (coordMatch) {
    const lat = Number(coordMatch[1]);
    const lng = Number(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        source: 'Koordinat Langsung'
      };
    }
  }

  // 8. Any coordinates found anywhere inside string
  const anyCoordMatch = str.match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  if (anyCoordMatch) {
    const lat = Number(anyCoordMatch[1]);
    const lng = Number(anyCoordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        source: 'Teks Koordinat Terdeteksi'
      };
    }
  }

  return null;
}

export function isShortGoogleMapsUrl(input) {
  if (!input || typeof input !== 'string') return false;
  return /maps\.app\.goo\.gl|goo\.gl\/maps/i.test(input);
}
