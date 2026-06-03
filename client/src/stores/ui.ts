// Created: 2026-06-03 — 전역 UI 상태(좌측 드로어 열림 등)
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
  state: () => ({
    drawerOpen: false,
  }),
  actions: {
    toggleDrawer() {
      this.drawerOpen = !this.drawerOpen;
    },
    openDrawer() {
      this.drawerOpen = true;
    },
    closeDrawer() {
      this.drawerOpen = false;
    },
  },
});
