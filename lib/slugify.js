export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Title-case unslugify — correct for neighborhoods.
// "west-village" → "West Village", "lower-east-side" → "Lower East Side"
export function unslugify(str) {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Lookup map for platform reverse-slugify.
// Keys are slugify(platformValue). Values are exact DB strings.
export const PLATFORM_MAP = {
  'resy':                'Resy',
  'opentable':           'OpenTable',
  'doordash':            'DoorDash',
  'tock':                'Tock',
  'tock-opentable':      'Tock/OpenTable',
  'resy-opentable':      'Resy/OpenTable',
  'resy-tock':           'Resy/Tock',
  'walk-in':             'Walk-in',
  'phone':               'Phone',
  'phone-relationships': 'Phone/Relationships',
  'own-site':            'Own Site',
  'yelp':                'Yelp',
}
