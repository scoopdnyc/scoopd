export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[‘’']/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Title-case unslugify — correct for simple multi-word slugs.
// Does NOT reconstruct mixed-case (SoHo) or apostrophe names (Hell's Kitchen).
// Use NEIGHBORHOOD_MAP for neighborhood display names.
export function unslugify(str) {
  return str
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// Platforms with dedicated category pages.
// Only single-platform, reservation-capable entries included.
// Excluded platforms are listed in EXCLUDED_PLATFORM_VALUES below.
export const PLATFORM_MAP = {
  'resy':      'Resy',
  'opentable': 'OpenTable',
  'doordash':  'DoorDash',
  'tock':      'Tock',
  'own-site':  'Own Site',
  'yelp':      'Yelp',
}

// Platform DB values that must not generate category pages.
// Includes all combination platforms and non-reservation platforms.
// Used in both app/platform/[name]/page.js and app/sitemap.js — single source.
export const EXCLUDED_PLATFORM_VALUES = new Set([
  'Walk-in',
  'Phone',
  'Phone/Relationships',
  'CLOSED',
  'Resy/OpenTable',
  'Resy/Tock',
  'Tock/OpenTable',
  'Tock/Resy',
])

// Neighborhood slug → exact DB string.
// Required because unslugify cannot reconstruct mixed-case (SoHo, NoHo, NoMad)
// or apostrophe-containing (Hell's Kitchen) neighborhood names.
// Update this map when new neighborhoods are added to the DB.
export const NEIGHBORHOOD_MAP = {
  'brooklyn-heights':     'Brooklyn Heights',
  'carroll-gardens':      'Carroll Gardens',
  'central-park-south':   'Central Park South',
  'chelsea':              'Chelsea',
  'chinatown':            'Chinatown',
  'clinton-hill':         'Clinton Hill',
  'cobble-hill':          'Cobble Hill',
  'columbus-circle':      'Columbus Circle',
  'downtown-brooklyn':    'Downtown Brooklyn',
  'east-village':         'East Village',
  'financial-district':   'Financial District',
  'flatiron':             'Flatiron',
  'fort-greene':          'Fort Greene',
  'gramercy':             'Gramercy',
  'grand-central':        'Grand Central',
  'greenpoint':           'Greenpoint',
  'greenwich-village':    'Greenwich Village',
  'hells-kitchen':        "Hell's Kitchen",
  'hudson-yards':         'Hudson Yards',
  'koreatown':            'Koreatown',
  'lincoln-center':       'Lincoln Center',
  'lower-east-side':      'Lower East Side',
  'meatpacking-district': 'Meatpacking District',
  'midtown':              'Midtown',
  'midtown-east':         'Midtown East',
  'midtown-west':         'Midtown West',
  'murray-hill':          'Murray Hill',
  'noho':                 'NoHo',
  'nolita':               'Nolita',
  'nomad':                'NoMad',
  'ozone-park':           'Ozone Park',
  'park-slope':           'Park Slope',
  'pocantico-hills':      'Pocantico Hills',
  'red-hook':             'Red Hook',
  'rockefeller-center':   'Rockefeller Center',
  'rose-hill':            'Rose Hill',
  'soho':                 'SoHo',
  'tribeca':              'Tribeca',
  'two-bridges':          'Two Bridges',
  'union-square':         'Union Square',
  'upper-east-side':      'Upper East Side',
  'upper-west-side':      'Upper West Side',
  'west-village':         'West Village',
  'williamsburg':         'Williamsburg',
}
