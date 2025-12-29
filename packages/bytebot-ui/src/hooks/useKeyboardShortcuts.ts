import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export interface ControllerKeyboardShortcuts {
  onControllerToggle: (controllerId: string, multiSelect?: boolean) => void;
  onClearSelection: () => void;
  onNavigateControllers: (direction: 'next' | 'prev') => void;
  controllerIds: string[];
  onKeyboardNavigation?: (active: boolean) => void;
}

export function useControllerKeyboardShortcuts({
  onControllerToggle,
  onClearSelection,
  onNavigateControllers,
  controllerIds,
  onKeyboardNavigation,
}: ControllerKeyboardShortcuts) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore keyboard shortcuts when user is typing in input fields or contenteditable elements
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable') ||
      activeElement.closest('[contenteditable="true"]')
    )) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const isCmdOrCtrl = ctrlKey || metaKey;

    // Number keys for quick controller switching
    if (!isCmdOrCtrl && !shiftKey && !altKey && /^[1-9]$/.test(key)) {
      const controllerIndex = parseInt(key) - 1;
      if (controllerIndex < controllerIds.length) {
        const controllerId = controllerIds[controllerIndex];
        onControllerToggle(controllerId, false);
        onKeyboardNavigation?.(true);
        event.preventDefault();
        return;
      }
    }

    // Ctrl/Cmd + number for multi-selection
    if (isCmdOrCtrl && !shiftKey && !altKey && /^[1-9]$/.test(key)) {
      const controllerIndex = parseInt(key) - 1;
      if (controllerIndex < controllerIds.length) {
        const controllerId = controllerIds[controllerIndex];
        onControllerToggle(controllerId, true);
        onKeyboardNavigation?.(true);
        event.preventDefault();
        return;
      }
    }

    // Escape to clear selection
    if (key === 'Escape') {
      onClearSelection();
      onKeyboardNavigation?.(true);
      event.preventDefault();
      return;
    }

    // Arrow keys for navigation
    if (!isCmdOrCtrl && !shiftKey && !altKey) {
      if (key === 'ArrowLeft' || key === 'ArrowUp') {
        onNavigateControllers('prev');
        onKeyboardNavigation?.(true);
        event.preventDefault();
        return;
      }
      if (key === 'ArrowRight' || key === 'ArrowDown') {
        onNavigateControllers('next');
        onKeyboardNavigation?.(true);
        event.preventDefault();
        return;
      }
    }

    // Tab navigation (with shift for reverse)
    if (key === 'Tab') {
      if (shiftKey) {
        onNavigateControllers('prev');
      } else {
        onNavigateControllers('next');
      }
      onKeyboardNavigation?.(true);
      event.preventDefault();
      return;
    }
  }, [controllerIds, onControllerToggle, onClearSelection, onNavigateControllers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore keyboard shortcuts when user is typing in input fields or contenteditable elements
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.hasAttribute('contenteditable') ||
      activeElement.closest('[contenteditable="true"]')
    )) {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;

    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrl ? ctrlKey : !shortcut.ctrl;
      const cmdMatch = shortcut.cmd ? metaKey : !shortcut.cmd;
      const shiftMatch = shortcut.shift ? shiftKey : !shortcut.shift;
      const altMatch = shortcut.alt ? altKey : !shortcut.alt;
      const keyMatch = shortcut.key.toLowerCase() === key.toLowerCase();

      if (ctrlMatch && cmdMatch && shiftMatch && altMatch && keyMatch) {
        shortcut.handler(event);
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
