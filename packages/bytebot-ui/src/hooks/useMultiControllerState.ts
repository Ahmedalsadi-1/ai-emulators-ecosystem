import { useState, useEffect, useCallback } from 'react';
import type {
  ControllerState,
  ControllerPreset,
  ControllerWorkflow,
  ControllerOption
} from '@/types/controller.types';

const STORAGE_KEYS = {
  CONTROLLERS: 'bytebot:controllers',
  PRESETS: 'bytebot:controller-presets',
  WORKFLOWS: 'bytebot:workflows',
  ACTIVE_PRESET: 'bytebot:active-preset',
};

export function useMultiControllerState(controllerOptions: ControllerOption[]) {
  const [controllers, setControllers] = useState<ControllerState[]>(() => {
    // Initialize with all controllers inactive
    return controllerOptions.map((option, index) => ({
      id: option.id,
      isActive: false,
      priority: index,
      config: {},
    }));
  });

  // Resource allocation tracking for performance optimization
  const [resourceUsage, setResourceUsage] = useState<Record<string, number>>({});

  const [activeControllerIds, setActiveControllerIds] = useState<string[]>([]);
  const [primaryControllerId, setPrimaryControllerId] = useState<string | undefined>();
  const [presets, setPresets] = useState<ControllerPreset[]>([]);
  const [workflows, setWorkflows] = useState<ControllerWorkflow[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedControllers = localStorage.getItem(STORAGE_KEYS.CONTROLLERS);
      if (storedControllers) {
        const parsed = JSON.parse(storedControllers);
        setControllers(parsed);
      }

      const storedPresets = localStorage.getItem(STORAGE_KEYS.PRESETS);
      if (storedPresets) {
        const parsed = JSON.parse(storedPresets);
        setPresets(parsed);
      }

      const storedWorkflows = localStorage.getItem(STORAGE_KEYS.WORKFLOWS);
      if (storedWorkflows) {
        const parsed = JSON.parse(storedWorkflows);
        setWorkflows(parsed);
      }

      const storedActivePreset = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET);
      if (storedActivePreset) {
        const preset = JSON.parse(storedActivePreset);
        applyPreset(preset);
      }
    } catch (error) {
      console.error('Failed to load controller state from localStorage:', error);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTROLLERS, JSON.stringify(controllers));
    } catch (error) {
      console.error('Failed to save controllers to localStorage:', error);
    }
  }, [controllers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets to localStorage:', error);
    }
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows));
    } catch (error) {
      console.error('Failed to save workflows to localStorage:', error);
    }
  }, [workflows]);

  const toggleController = useCallback((controllerId: string, multiSelect: boolean = false) => {
    setControllers(prev => {
      const updated = prev.map(controller => {
        if (controller.id === controllerId) {
          const newIsActive = multiSelect ? !controller.isActive : true;
          return {
            ...controller,
            isActive: newIsActive,
            lastActivated: newIsActive ? new Date() : controller.lastActivated,
          };
        } else if (!multiSelect) {
          // When not multi-selecting, deactivate other controllers
          return { ...controller, isActive: false };
        }
        return controller;
      });

      // Update active controller IDs and resource allocation
      const newActiveIds = updated.filter(c => c.isActive).map(c => c.id);
      setActiveControllerIds(newActiveIds);

      // Update resource usage (simulate resource allocation)
      setResourceUsage(prev => {
        const newUsage: Record<string, number> = {};
        newActiveIds.forEach((id, index) => {
          // Distribute resources based on priority and active count
          const baseUsage = 100 / newActiveIds.length;
          const priorityBonus = (newActiveIds.length - index) * 5;
          newUsage[id] = Math.min(baseUsage + priorityBonus, 100);
        });
        return newUsage;
      });

      // Set primary controller to the most recently activated one
      const primaryController = updated
        .filter(c => c.isActive)
        .sort((a, b) => {
          if (!a.lastActivated && !b.lastActivated) return a.priority - b.priority;
          if (!a.lastActivated) return 1;
          if (!b.lastActivated) return -1;
          return new Date(b.lastActivated!).getTime() - new Date(a.lastActivated!).getTime();
        })[0];

      setPrimaryControllerId(primaryController?.id);

      return updated;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setControllers(prev => prev.map(controller => ({
      ...controller,
      isActive: false,
    })));
    setActiveControllerIds([]);
    setPrimaryControllerId(undefined);
  }, []);

  const navigateControllers = useCallback((direction: 'next' | 'prev') => {
    if (controllerOptions.length === 0) return;

    const currentIndex = primaryControllerId
      ? controllerOptions.findIndex(c => c.id === primaryControllerId)
      : -1;

    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex < controllerOptions.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : controllerOptions.length - 1;
    }

    const nextControllerId = controllerOptions[nextIndex].id;
    toggleController(nextControllerId, false);
  }, [controllerOptions, primaryControllerId, toggleController]);

  const savePreset = useCallback((name: string, description?: string): string => {
    const preset: ControllerPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      controllers: controllers.map(c => ({ ...c })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setPresets(prev => [...prev, preset]);
    return preset.id;
  }, [controllers]);

  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      applyPreset(preset);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET, JSON.stringify(preset));
    }
  }, [presets]);

  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));

    // Clear active preset if it's the one being deleted
    const activePreset = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET);
    if (activePreset) {
      const parsed = JSON.parse(activePreset);
      if (parsed.id === presetId) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PRESET);
      }
    }
  }, []);

  const applyPreset = useCallback((preset: ControllerPreset) => {
    setControllers(preset.controllers);
    const activeIds = preset.controllers.filter(c => c.isActive).map(c => c.id);
    setActiveControllerIds(activeIds);

    const primaryController = preset.controllers
      .filter(c => c.isActive)
      .sort((a, b) => {
        if (!a.lastActivated && !b.lastActivated) return a.priority - b.priority;
        if (!a.lastActivated) return 1;
        if (!b.lastActivated) return -1;
        return new Date(b.lastActivated!).getTime() - new Date(a.lastActivated!).getTime();
      })[0];

    setPrimaryControllerId(primaryController?.id);
  }, []);

  const updateControllerConfig = useCallback((controllerId: string, config: Record<string, any>) => {
    setControllers(prev => prev.map(controller =>
      controller.id === controllerId
        ? { ...controller, config: { ...controller.config, ...config } }
        : controller
    ));
  }, []);

  return {
    controllers,
    activeControllerIds,
    primaryControllerId,
    presets,
    resourceUsage,
    toggleController,
    clearSelection,
    navigateControllers,
    savePreset,
    loadPreset,
    deletePreset,
    updateControllerConfig,
  };
}