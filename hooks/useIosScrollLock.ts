"use client";

import { useEffect } from "react";

/**
 * Hook pour verrouiller le scroll horizontal sur iOS
 * et forcer un comportement "App native" (vertical uniquement).
 */
export function useIosScrollLock() {
  useEffect(() => {
    // 1. Détecter si on est sur un appareil tactile (mobile/tablette)
    const isTouchDevice = 
      typeof window !== "undefined" && 
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);

    if (!isTouchDevice) return;

    // 2. Sauvegarder les styles originaux
    const originalOverflowX = document.body.style.overflowX;
    const originalTouchAction = document.body.style.touchAction;

    // 3. Appliquer le verrouillage
    // 'pan-y' dit au navigateur : "N'autorise que le mouvement vertical avec le doigt"
    document.body.style.touchAction = "pan-y";
    document.body.style.overflowX = "hidden";
    
    // Fix spécifique pour empêcher le "rebond" horizontal sur Safari
    document.documentElement.style.overflowX = "hidden";
    document.documentElement.style.touchAction = "pan-y";

    // 4. Nettoyage quand on quitte la page
    return () => {
      document.body.style.overflowX = originalOverflowX;
      document.body.style.touchAction = originalTouchAction;
      document.documentElement.style.overflowX = "";
      document.documentElement.style.touchAction = "";
    };
  }, []);
}