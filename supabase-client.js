// Built with the app so cloud sync does not depend on a third-party CDN at runtime.
import { createClient } from '@supabase/supabase-js';
window.supabase = { createClient };
