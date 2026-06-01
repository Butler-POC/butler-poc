// Created: 2026-05-31
import { defineStore } from 'pinia';
import * as api from '@/api/leases';
import type { Lease } from '@/api/leases';

export const useLeasesStore = defineStore('leases', {
  state: () => ({
    items: [] as Lease[],
    loaded: false,
    loading: false,
  }),

  actions: {
    async fetch() {
      this.loading = true;
      try {
        this.items = await api.listLeases();
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    async add(payload: api.CreateLeasePayload): Promise<Lease> {
      const created = await api.createLease(payload);
      this.items.unshift(created);
      return created;
    },

    async remove(id: string) {
      await api.deleteLease(id);
      this.items = this.items.filter((l) => l.id !== id);
    },
  },
});
