import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zztiidefywmsinssmxiy.supabase.co'
const supabaseKey = 'sb_publishable_f_m6tiPzV0Zrbc4evlOwsQ_WKbJT12I'

export const supabase = createClient(supabaseUrl, supabaseKey)