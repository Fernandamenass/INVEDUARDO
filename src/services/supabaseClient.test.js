import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getGuestByUniqueId, 
  updateGuestConfirmation, 
  addCompanions,
  getAllGuestsWithCompanions,
  insertGuest
} from './supabaseClient';

/**
 * Tests for verifying immediate data updates (Requirement 8.5)
 * 
 * These tests verify that when guest data is updated in the Supabase database,
 * the changes are immediately reflected when data is fetched again.
 */

describe('Immediate Data Update Verification (Requirement 8.5)', () => {
  
  it('should reflect guest confirmation update immediately on subsequent fetch', async () => {
    // Create a test guest with a unique ID
    const testUniqueId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testGuest = {
      name: 'Test Guest for Update',
      unique_id: testUniqueId,
      companion_limit: 2,
      confirmed: false
    };

    // Insert the test guest
    const { data: insertedGuest, error: insertError } = await insertGuest(testGuest);
    expect(insertError).toBeNull();
    expect(insertedGuest).toBeDefined();
    expect(insertedGuest.confirmed).toBe(false);

    // Fetch the guest to verify initial state
    const { data: initialFetch, error: fetchError1 } = await getGuestByUniqueId(testUniqueId);
    expect(fetchError1).toBeNull();
    expect(initialFetch).toBeDefined();
    expect(initialFetch.confirmed).toBe(false);

    // Update the guest's confirmation status
    const { data: updatedGuest, error: updateError } = await updateGuestConfirmation(
      insertedGuest.id, 
      true
    );
    expect(updateError).toBeNull();
    expect(updatedGuest.confirmed).toBe(true);

    // Fetch the guest again - changes should be reflected immediately
    const { data: updatedFetch, error: fetchError2 } = await getGuestByUniqueId(testUniqueId);
    expect(fetchError2).toBeNull();
    expect(updatedFetch).toBeDefined();
    expect(updatedFetch.confirmed).toBe(true);
    expect(updatedFetch.id).toBe(insertedGuest.id);
  });

  it('should reflect companion additions immediately on subsequent fetch', async () => {
    // Create a test guest
    const testUniqueId = `test-companions-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testGuest = {
      name: 'Test Guest with Companions',
      unique_id: testUniqueId,
      companion_limit: 3,
      confirmed: false
    };

    // Insert the test guest
    const { data: insertedGuest, error: insertError } = await insertGuest(testGuest);
    expect(insertError).toBeNull();
    expect(insertedGuest).toBeDefined();

    // Confirm the guest and add companions
    await updateGuestConfirmation(insertedGuest.id, true);
    const companionNames = ['Companion One', 'Companion Two'];
    const { error: companionsError } = await addCompanions(insertedGuest.id, companionNames);
    expect(companionsError).toBeNull();

    // Fetch all guests with companions - changes should be reflected immediately
    const { data: allGuests, error: fetchError } = await getAllGuestsWithCompanions();
    expect(fetchError).toBeNull();
    expect(allGuests).toBeDefined();

    // Find our test guest in the results
    const fetchedGuest = allGuests.find(g => g.unique_id === testUniqueId);
    expect(fetchedGuest).toBeDefined();
    expect(fetchedGuest.confirmed).toBe(true);
    expect(fetchedGuest.companions).toBeDefined();
    expect(fetchedGuest.companions.length).toBe(2);
    
    const companionNamesFromDb = fetchedGuest.companions.map(c => c.name).sort();
    expect(companionNamesFromDb).toEqual(companionNames.sort());
  });

  it('should reflect multiple sequential updates immediately', async () => {
    // Create a test guest
    const testUniqueId = `test-sequential-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testGuest = {
      name: 'Test Guest Sequential Updates',
      unique_id: testUniqueId,
      companion_limit: 2,
      confirmed: false
    };

    // Insert the test guest
    const { data: insertedGuest, error: insertError } = await insertGuest(testGuest);
    expect(insertError).toBeNull();

    // First update: confirm the guest
    await updateGuestConfirmation(insertedGuest.id, true);
    
    // Verify first update is reflected
    const { data: fetch1 } = await getGuestByUniqueId(testUniqueId);
    expect(fetch1.confirmed).toBe(true);

    // Second update: add a companion
    await addCompanions(insertedGuest.id, ['First Companion']);
    
    // Verify second update is reflected
    const { data: allGuests1 } = await getAllGuestsWithCompanions();
    const guest1 = allGuests1.find(g => g.unique_id === testUniqueId);
    expect(guest1.companions.length).toBe(1);

    // Third update: add another companion
    await addCompanions(insertedGuest.id, ['Second Companion']);
    
    // Verify third update is reflected immediately
    const { data: allGuests2 } = await getAllGuestsWithCompanions();
    const guest2 = allGuests2.find(g => g.unique_id === testUniqueId);
    expect(guest2.companions.length).toBe(2);
  });

  it('should reflect data changes across different query methods', async () => {
    // Create a test guest
    const testUniqueId = `test-cross-query-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const testGuest = {
      name: 'Test Cross Query',
      unique_id: testUniqueId,
      companion_limit: 1,
      confirmed: false
    };

    // Insert the test guest
    const { data: insertedGuest, error: insertError } = await insertGuest(testGuest);
    expect(insertError).toBeNull();

    // Update via one method
    await updateGuestConfirmation(insertedGuest.id, true);

    // Verify via getGuestByUniqueId
    const { data: fetchByUniqueId } = await getGuestByUniqueId(testUniqueId);
    expect(fetchByUniqueId.confirmed).toBe(true);

    // Verify via getAllGuestsWithCompanions
    const { data: allGuests } = await getAllGuestsWithCompanions();
    const guestFromAll = allGuests.find(g => g.unique_id === testUniqueId);
    expect(guestFromAll.confirmed).toBe(true);

    // Both methods should return the same updated data
    expect(fetchByUniqueId.confirmed).toBe(guestFromAll.confirmed);
  });
});
