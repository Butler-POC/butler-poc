// Kakao 지도 컴포저블 — L-05 지도·마커 (클라이언트 JS 키 사용)
// JS 키(.env VITE_KAKAO_JS_KEY)로 SDK를 동적 로드한다. REST 키와 혼용 금지.
import { ref } from 'vue';
import type { Vendor } from '@/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global {
  interface Window {
    kakao: any;
  }
}

type LatLng = { lat: number; lng: number };

let sdkPromise: Promise<any> | null = null;

// SDK 1회 로드(싱글턴)
function loadSdk(): Promise<any> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!key) return reject(new Error('VITE_KAKAO_JS_KEY 가 설정되지 않았습니다.'));
    if (window.kakao?.maps) return window.kakao.maps.load(() => resolve(window.kakao));

    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = () => reject(new Error('Kakao 지도 SDK 로드에 실패했습니다.'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function useKakaoMap() {
  const ready = ref(false);
  let map: any = null;
  let markers: any[] = [];
  let infoWindow: any = null;

  async function init(el: HTMLElement, center: LatLng) {
    const kakao = await loadSdk();
    map = new kakao.maps.Map(el, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 5,
    });
    infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 });
    ready.value = true;
  }

  function setCenter(center: LatLng) {
    if (map) map.setCenter(new window.kakao.maps.LatLng(center.lat, center.lng));
  }

  function clearMarkers() {
    markers.forEach((m) => m.setMap(null));
    markers = [];
  }

  function renderVendors(vendors: Vendor[]) {
    if (!map) return;
    const kakao = window.kakao;
    clearMarkers();
    const bounds = new kakao.maps.LatLngBounds();
    vendors.forEach((v) => {
      const pos = new kakao.maps.LatLng(v.lat, v.lng);
      const marker = new kakao.maps.Marker({ position: pos, map });
      kakao.maps.event.addListener(marker, 'click', () => {
        const phone = v.phone ? `<br/>${v.phone}` : '';
        infoWindow.setContent(
          `<div style="padding:6px 10px;font-size:12px;max-width:180px;">${v.name}${phone}</div>`,
        );
        infoWindow.open(map, marker);
      });
      markers.push(marker);
      bounds.extend(pos);
    });
    if (vendors.length) map.setBounds(bounds);
  }

  return { ready, init, setCenter, renderVendors, clearMarkers };
}
