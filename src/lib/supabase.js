import { createClient } from '@supabase/supabase-js'

import { createDemoClient } from '../demo/client'

/*
 * Com VITE_DEMO=1 o site roda com dados fictícios na memória do
 * navegador (src/demo) e nunca fala com o Supabase. Usado só no
 * deploy de demonstração do portfólio.
 */
export const isDemo = import.meta.env.VITE_DEMO === '1'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = isDemo
  ? createDemoClient()
  : createClient(supabaseUrl, supabaseKey)
