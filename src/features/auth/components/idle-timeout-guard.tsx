"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ACTIVITY_SYNC_INTERVAL_MS,
  formatCountdown,
  getIdleState,
  type IdleState,
} from "@/lib/auth/idle";

import { signOutAction, touchActivityAction } from "../actions";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
const STORAGE_KEY = "jc:last-activity";

function readShared(): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeShared(value: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Armazenamento indisponível (modo privado): segue apenas com o estado da aba.
  }
}

/**
 * Logout automático após 30 minutos sem interação, com aviso 2 minutos antes.
 * A atividade é compartilhada entre abas e sincronizada com o servidor, que
 * também encerra sessões inativas (middleware).
 */
export function IdleTimeoutGuard() {
  const lastActivity = useRef(Date.now());
  const lastSync = useRef(Date.now());
  const signingOut = useRef(false);
  const [state, setState] = useState<IdleState>({ status: "active" });

  const registerActivity = useCallback((force = false) => {
    const now = Date.now();
    lastActivity.current = now;
    writeShared(now);
    if (force || now - lastSync.current >= ACTIVITY_SYNC_INTERVAL_MS) {
      lastSync.current = now;
      void touchActivityAction();
    }
  }, []);

  useEffect(() => {
    writeShared(lastActivity.current);

    const onActivity = () => {
      // Durante o aviso, só o botão "Continuar conectado" renova a sessão.
      if (getIdleState(lastActivity.current, Date.now()).status === "active") registerActivity();
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, onActivity, { passive: true }),
    );

    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const shared = readShared();
        if (shared && shared > lastActivity.current) lastActivity.current = shared;
      }
    };
    window.addEventListener("storage", onStorage);

    const timer = window.setInterval(() => {
      const shared = readShared();
      if (shared && shared > lastActivity.current) lastActivity.current = shared;

      const next = getIdleState(lastActivity.current, Date.now());
      setState(next);
      if (next.status === "expired" && !signingOut.current) {
        signingOut.current = true;
        void signOutAction("inatividade");
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
      window.removeEventListener("storage", onStorage);
      window.clearInterval(timer);
    };
  }, [registerActivity]);

  const stayConnected = () => {
    registerActivity(true);
    setState({ status: "active" });
  };

  return (
    <Dialog open={state.status === "warning"} onOpenChange={(open) => !open && stayConnected()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Sua sessão vai expirar</DialogTitle>
          <DialogDescription>
            Por segurança, você será desconectado por inatividade em{" "}
            <strong data-testid="idle-countdown" className="text-foreground tabular-nums">
              {state.status === "warning" ? formatCountdown(state.remainingMs) : "0:00"}
            </strong>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => void signOutAction()}>
            Sair agora
          </Button>
          <Button onClick={stayConnected}>Continuar conectado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
