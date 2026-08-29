import { describe, expect, it } from 'vitest';
import { InputProfileStore } from './InputProfileStore';

describe('input profile persistence', () => {
  it('stores profiles by stable controller fingerprint and removes binding conflicts', () => {
    const values = new Map<string, string>();
    const store = new InputProfileStore({ getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) });
    store.bind('Vendor: 054c Product: 0ce6 DualSense', 'FIRE', [5]);
    const profile = store.bind('Vendor: 054c Product: 0ce6 DualSense', 'START', [5]);
    expect(profile.bindings.FIRE).not.toContain(5);
    expect(profile.bindings.START).toEqual([5]);
    expect(store.load('Vendor: 054c Product: 0ce6 DualSense').bindings.START).toEqual([5]);
    expect(store.reset('Vendor: 054c Product: 0ce6 DualSense').bindings.START).toEqual([9]);
  });
});
