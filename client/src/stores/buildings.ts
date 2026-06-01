// Created: 2026-05-30 11:09
import { defineStore } from 'pinia';
import * as api from '@/api/buildings';
import type { Building } from '@/types/building';

export const useBuildingsStore = defineStore('buildings', {
  state: () => ({
    items: [] as Building[],
    loaded: false,
    loading: false,
  }),

  actions: {
    async fetch() {
      this.loading = true;
      try {
        this.items = await api.listBuildings();
        this.loaded = true;
      } finally {
        this.loading = false;
      }
    },

    async add(payload: api.CreateBuildingPayload): Promise<Building> {
      const created = await api.createBuilding(payload);
      this.items.unshift(created);
      return created;
    },

    async remove(id: string) {
      await api.deleteBuilding(id);
      this.items = this.items.filter((b) => b.id !== id);
    },

    /** L-02 — 건축물대장 등록/수정 후 해당 건물에 반영 */
    async saveLedger(buildingId: string, payload: api.SaveLedgerPayload) {
      const ledger = await api.saveLedger(buildingId, payload);
      const b = this.items.find((it) => it.id === buildingId);
      if (b) b.ledger = ledger;
      return ledger;
    },
  },
});
