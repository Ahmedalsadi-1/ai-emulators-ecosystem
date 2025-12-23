import { useState, useEffect, useRef, useCallback } from 'react';

export interface VideoGenerationParams {
  prompt: string;
  video_length: number;
  resolution: string;
  num_inference_steps: number;
  model_type: string;
  image_start?: string;
  image_end?: string;
  video_guide?: string;
}

export interface SocialMediaPost {
  content: string;
  platforms: string[];
  mediaUrls: string[];
  scheduledTime?: Date;
  tags?: string[];
}

export interface ContentPipeline {
  id: string;
  name: string;
  status: 'idle' | 'generating' | 'publishing' | 'completed' | 'error';
  videoParams: VideoGenerationParams;
  socialPost: SocialMediaPost;
  generatedVideoUrl?: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

interface ContentWorkflowState {
  pipelines: ContentPipeline[];
  wan2gpConnected: boolean;
  postizConnected: boolean;
  isProcessing: boolean;
  currentPipelineId: string | null;
}

export const useContentWorkflows = () => {
  const [state, setState] = useState<ContentWorkflowState>({
    pipelines: [],
    wan2gpConnected: false,
    postizConnected: false,
    isProcessing: false,
    currentPipelineId: null,
  });

  const wan2gpWsRef = useRef<WebSocket | null>(null);
  const postizWsRef = useRef<WebSocket | null>(null);

  // Initialize connections
  useEffect(() => {
    connectToWan2GP();
    connectToPostiz();

    return () => {
      disconnect();
    };
  }, []);

  const connectToWan2GP = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:7860/ws');

      ws.onopen = () => {
        setState(prev => ({ ...prev, wan2gpConnected: true }));
        console.log('Connected to Wan2GP');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWan2GPMessage(data);
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, wan2gpConnected: false }));
        console.log('Disconnected from Wan2GP');
      };

      ws.onerror = () => {
        console.error('Wan2GP WebSocket connection failed');
      };

      wan2gpWsRef.current = ws;
    } catch (error) {
      console.error('Wan2GP connection failed:', error);
    }
  }, []);

  const connectToPostiz = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:3002/ws');

      ws.onopen = () => {
        setState(prev => ({ ...prev, postizConnected: true }));
        console.log('Connected to Postiz');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handlePostizMessage(data);
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, postizConnected: false }));
        console.log('Disconnected from Postiz');
      };

      ws.onerror = () => {
        console.error('Postiz WebSocket connection failed');
      };

      postizWsRef.current = ws;
    } catch (error) {
      console.error('Postiz connection failed:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wan2gpWsRef.current) {
      wan2gpWsRef.current.close();
    }
    if (postizWsRef.current) {
      postizWsRef.current.close();
    }
  }, []);

  const handleWan2GPMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'generation_complete':
        updatePipelineStatus(data.pipelineId, 'publishing', {
          generatedVideoUrl: data.videoUrl
        });
        // Automatically start publishing
        publishToSocialMedia(data.pipelineId);
        break;

      case 'generation_error':
        updatePipelineStatus(data.pipelineId, 'error', {
          error: data.error
        });
        break;

      case 'generation_progress':
        // Could update progress if needed
        break;
    }
  }, []);

  const handlePostizMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'publish_complete':
        updatePipelineStatus(data.pipelineId, 'completed', {
          completedAt: new Date()
        });
        setState(prev => ({ ...prev, isProcessing: false, currentPipelineId: null }));
        break;

      case 'publish_error':
        updatePipelineStatus(data.pipelineId, 'error', {
          error: data.error
        });
        setState(prev => ({ ...prev, isProcessing: false, currentPipelineId: null }));
        break;
    }
  }, []);

  const updatePipelineStatus = useCallback((
    pipelineId: string,
    status: ContentPipeline['status'],
    updates: Partial<ContentPipeline> = {}
  ) => {
    setState(prev => ({
      ...prev,
      pipelines: prev.pipelines.map(pipeline =>
        pipeline.id === pipelineId
          ? { ...pipeline, status, ...updates }
          : pipeline
      )
    }));
  }, []);

  const generateVideo = useCallback(async (pipelineId: string, params: VideoGenerationParams) => {
    if (!wan2gpWsRef.current || wan2gpWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Wan2GP not connected');
    }

    wan2gpWsRef.current.send(JSON.stringify({
      type: 'generate_video',
      pipelineId,
      params
    }));
  }, []);

  const publishToSocialMedia = useCallback(async (pipelineId: string) => {
    if (!postizWsRef.current || postizWsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Postiz not connected');
    }

    const pipeline = state.pipelines.find(p => p.id === pipelineId);
    if (!pipeline || !pipeline.generatedVideoUrl) {
      throw new Error('Pipeline not found or no video generated');
    }

    postizWsRef.current.send(JSON.stringify({
      type: 'publish_content',
      pipelineId,
      post: {
        ...pipeline.socialPost,
        mediaUrls: [pipeline.generatedVideoUrl]
      }
    }));
  }, [state.pipelines]);

  const createContentPipeline = useCallback(async (
    name: string,
    videoParams: VideoGenerationParams,
    socialPost: SocialMediaPost
  ): Promise<ContentPipeline> => {
    const pipeline: ContentPipeline = {
      id: `pipeline-${Date.now()}`,
      name,
      status: 'idle',
      videoParams,
      socialPost,
      createdAt: new Date(),
    };

    setState(prev => ({
      ...prev,
      pipelines: [...prev.pipelines, pipeline]
    }));

    return pipeline;
  }, []);

  const executeContentPipeline = useCallback(async (pipelineId: string) => {
    if (state.isProcessing) {
      throw new Error('Another pipeline is currently processing');
    }

    const pipeline = state.pipelines.find(p => p.id === pipelineId);
    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    if (pipeline.status !== 'idle') {
      throw new Error('Pipeline is not in idle state');
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      currentPipelineId: pipelineId
    }));

    updatePipelineStatus(pipelineId, 'generating');

    try {
      await generateVideo(pipelineId, pipeline.videoParams);
    } catch (error) {
      updatePipelineStatus(pipelineId, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setState(prev => ({ ...prev, isProcessing: false, currentPipelineId: null }));
      throw error;
    }
  }, [state.isProcessing, state.pipelines, generateVideo, updatePipelineStatus]);

  const cancelPipeline = useCallback((pipelineId: string) => {
    // Send cancel messages to both services
    if (wan2gpWsRef.current?.readyState === WebSocket.OPEN) {
      wan2gpWsRef.current.send(JSON.stringify({
        type: 'cancel_generation',
        pipelineId
      }));
    }

    if (postizWsRef.current?.readyState === WebSocket.OPEN) {
      postizWsRef.current.send(JSON.stringify({
        type: 'cancel_publish',
        pipelineId
      }));
    }

    updatePipelineStatus(pipelineId, 'idle');
    setState(prev => ({
      ...prev,
      isProcessing: false,
      currentPipelineId: null
    }));
  }, [updatePipelineStatus]);

  const deletePipeline = useCallback((pipelineId: string) => {
    setState(prev => ({
      ...prev,
      pipelines: prev.pipelines.filter(p => p.id !== pipelineId)
    }));

    // Cancel if currently processing
    if (state.currentPipelineId === pipelineId) {
      cancelPipeline(pipelineId);
    }
  }, [state.currentPipelineId, cancelPipeline]);

  return {
    state,
    createContentPipeline,
    executeContentPipeline,
    cancelPipeline,
    deletePipeline,
    disconnect,
    reconnectWan2GP: connectToWan2GP,
    reconnectPostiz: connectToPostiz,
  };
};