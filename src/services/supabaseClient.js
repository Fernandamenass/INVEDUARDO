import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Create and export Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Get guest by unique_id
 * @param {string} uniqueId - The unique identifier for the guest
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getGuestByUniqueId(uniqueId) {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('unique_id', uniqueId)
    .single();

  return { data, error };
}

/**
 * Get guest with their companions
 * @param {string} guestId - The guest's UUID
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function getGuestWithCompanions(guestId) {
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      companions (
        id,
        name,
        created_at
      )
    `)
    .eq('id', guestId)
    .single();

  return { data, error };
}

/**
 * Update guest confirmation status
 * @param {string} guestId - The guest's UUID
 * @param {boolean} confirmed - Confirmation status
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function updateGuestConfirmation(guestId, confirmed = true) {
  const { data, error } = await supabase
    .from('guests')
    .update({ confirmed })
    .eq('id', guestId)
    .select()
    .single();

  return { data, error };
}

/**
 * Add companions for a guest
 * @param {string} guestId - The guest's UUID
 * @param {string[]} companionNames - Array of companion names
 * @returns {Promise<{data: array|null, error: object|null}>}
 */
export async function addCompanions(guestId, companionNames) {
  const companions = companionNames.map(name => ({
    guest_id: guestId,
    name: name.trim()
  }));

  const { data, error } = await supabase
    .from('companions')
    .insert(companions)
    .select();

  return { data, error };
}

/**
 * Delete all companions for a guest (used when updating companion list)
 * @param {string} guestId - The guest's UUID
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteCompanionsByGuestId(guestId) {
  const { error } = await supabase
    .from('companions')
    .delete()
    .eq('guest_id', guestId);

  return { error };
}

/**
 * Get all guests with their companions (for admin panel)
 * @returns {Promise<{data: array|null, error: object|null}>}
 */
export async function getAllGuestsWithCompanions() {
  const { data, error } = await supabase
    .from('guests')
    .select(`
      *,
      companions (
        id,
        name,
        created_at
      )
    `)
    .order('name');

  return { data, error };
}

/**
 * Subscribe to changes in guests table
 * @param {function} callback - Function to call when changes occur
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToGuestsChanges(callback) {
  return supabase
    .channel('guests-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'guests' },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to changes in companions table
 * @param {function} callback - Function to call when changes occur
 * @returns {object} Subscription object with unsubscribe method
 */
export function subscribeToCompanionsChanges(callback) {
  return supabase
    .channel('companions-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'companions' },
      callback
    )
    .subscribe();
}

/**
 * Insert a new guest
 * @param {object} guestData - Guest data (name, unique_id, companion_limit)
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function insertGuest(guestData) {
  const { data, error } = await supabase
    .from('guests')
    .insert([guestData])
    .select()
    .single();

  return { data, error };
}

/**
 * Insert multiple guests
 * @param {array} guestsData - Array of guest objects
 * @returns {Promise<{data: array|null, error: object|null}>}
 */
export async function insertGuests(guestsData) {
  const { data, error } = await supabase
    .from('guests')
    .insert(guestsData)
    .select();

  return { data, error };
}
