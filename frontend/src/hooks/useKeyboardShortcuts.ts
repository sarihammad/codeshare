import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface KeyboardShortcutsOptions {
  onSave?: () => void;
  onCommandPalette?: () => void;
  onRoomSwitch?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const { onSave, onCommandPalette, onRoomSwitch } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + S: Save snapshot
      if (ctrlKey && event.key === "s") {
        event.preventDefault();
        onSave?.();
        return;
      }

      // Cmd/Ctrl + K: Command palette / Room switch
      if (ctrlKey && event.key === "k") {
        event.preventDefault();
        onCommandPalette?.();
        return;
      }

      // Cmd/Ctrl + Shift + K: Room switch
      if (ctrlKey && event.shiftKey && event.key === "K") {
        event.preventDefault();
        onRoomSwitch?.();
        return;
      }

      // Escape: Close modals/command palette
      if (event.key === "Escape") {
        // This will be handled by individual components
        return;
      }

      // Alt + 1: Go to dashboard
      if (event.altKey && event.key === "1") {
        event.preventDefault();
        router.push("/dashboard");
        return;
      }

      // Alt + 2: Create new room
      if (event.altKey && event.key === "2") {
        event.preventDefault();
        router.push("/create-room");
        return;
      }

      // Alt + 3: Join room
      if (event.altKey && event.key === "3") {
        event.preventDefault();
        router.push("/join-room");
        return;
      }
    },
    [onSave, onCommandPalette, onRoomSwitch, router]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return {
    // Expose shortcut info for UI
    shortcuts: {
      save: isMac ? "⌘ + S" : "Ctrl + S",
      commandPalette: isMac ? "⌘ + K" : "Ctrl + K",
      roomSwitch: isMac ? "⌘ + Shift + K" : "Ctrl + Shift + K",
      dashboard: "Alt + 1",
      createRoom: "Alt + 2",
      joinRoom: "Alt + 3",
    },
  };
}
