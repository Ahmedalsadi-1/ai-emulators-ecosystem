import { useState, useEffect, useRef } from 'react';
import { Video, Share2, Zap, Settings, Play, Save, Trash2 } from 'lucide-react';
import { useUnifiedAppStore } from '@/hooks/useAppStore';
import { useContentWorkflows } from '@/hooks/useContentWorkflows';
import { cn } from '@/utils/cn';

interface ContentPipeline {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'generating' | 'publishing' | 'completed' | 'error';
  videoPrompt?: string;
  socialPlatforms?: string[];
  createdAt: Date;
}

export function ContentCreationSplitView() {
  const [activeTab, setActiveTab] = useState('video-generation');
  const [showPipelineForm, setShowPipelineForm] = useState(false);
  const [newPipelineData, setNewPipelineData] = useState({
    name: '',
    videoPrompt: 'A beautiful sunset over mountains with flowing water',
    platforms: ['twitter'],
    content: 'Check out this amazing AI-generated video! #AI #VideoGeneration'
  });
  const { getAppsByCategory } = useUnifiedAppStore();
  const wan2gpIframeRef = useRef<HTMLIFrameElement>(null);
  const postizIframeRef = useRef<HTMLIFrameElement>(null);

  // Handle messages from embedded iframes
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our expected origins
      const allowedOrigins = ['http://localhost:7860', 'http://localhost:3002'];
      if (!allowedOrigins.includes(event.origin)) return;

      try {
        const data = event.data;

        switch (data.type) {
          case 'wan2gp_generation_complete':
            console.log('Wan2GP generation completed:', data);
            // Handle video generation completion
            break;

          case 'wan2gp_generation_error':
            console.error('Wan2GP generation error:', data.error);
            // Handle generation error
            break;

          case 'postiz_publish_complete':
            console.log('Postiz publish completed:', data);
            // Handle social media publishing completion
            break;

          case 'postiz_publish_error':
            console.error('Postiz publish error:', data.error);
            // Handle publishing error
            break;

          default:
            // Handle other message types
            break;
        }
      } catch (error) {
        console.error('Error handling iframe message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Send message to Wan2GP iframe
  const sendToWan2GP = (message: any) => {
    if (wan2gpIframeRef.current?.contentWindow) {
      wan2gpIframeRef.current.contentWindow.postMessage(message, 'http://localhost:7860');
    }
  };

  // Send message to Postiz iframe
  const sendToPostiz = (message: any) => {
    if (postizIframeRef.current?.contentWindow) {
      postizIframeRef.current.contentWindow.postMessage(message, 'http://localhost:3002');
    }
  };
  const {
    state: workflowState,
    createContentPipeline,
    executeContentPipeline,
    cancelPipeline,
    deletePipeline
  } = useContentWorkflows();

  const contentApps = getAppsByCategory('content-creation');

  const wan2gpApp = contentApps.find(app => app.id === 'wan2gp-video-generation');
  const postizApp = contentApps.find(app => app.id === 'postiz-social-media');

  const createNewPipeline = async () => {
    if (!newPipelineData.name.trim()) {
      setNewPipelineData(prev => ({
        ...prev,
        name: `Content Pipeline ${workflowState.pipelines.length + 1}`
      }));
    }

    const videoParams = {
      prompt: newPipelineData.videoPrompt,
      video_length: 5,
      resolution: '832x480',
      num_inference_steps: 25,
      model_type: 'wan2.1-t2v-1.3B',
    };

    const socialPost = {
      content: newPipelineData.content,
      platforms: newPipelineData.platforms,
      mediaUrls: [],
      tags: ['AI', 'VideoGeneration'],
    };

    await createContentPipeline(
      newPipelineData.name || `Content Pipeline ${workflowState.pipelines.length + 1}`,
      videoParams,
      socialPost
    );

    // Reset form
    setNewPipelineData({
      name: '',
      videoPrompt: 'A beautiful sunset over mountains with flowing water',
      platforms: ['twitter'],
      content: 'Check out this amazing AI-generated video! #AI #VideoGeneration'
    });
    setShowPipelineForm(false);
  };

  const getStatusColor = (status: ContentPipeline['status']) => {
    switch (status) {
      case 'idle': return 'text-text-muted';
      case 'generating': return 'text-accent-primary';
      case 'publishing': return 'text-accent-primary';
      case 'completed': return 'text-status-success';
      case 'error': return 'text-status-error';
      default: return 'text-text-muted';
    }
  };

  const getStatusIcon = (status: ContentPipeline['status']) => {
    switch (status) {
      case 'generating': return <Video className="w-4 h-4" />;
      case 'publishing': return <Share2 className="w-4 h-4" />;
      case 'completed': return <Play className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Content Creation Hub</h1>
          <p className="text-sm text-text-muted">Generate videos and publish to social media</p>
        </div>
        <button
          onClick={() => setShowPipelineForm(!showPipelineForm)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-bg-primary rounded-md hover:bg-accent-primary/90 transition-colors"
        >
          <Zap className="w-4 h-4" />
          New Pipeline
        </button>
      </div>

      {/* Pipeline Creation Form */}
      {showPipelineForm && (
        <div className="p-4 border-b border-border bg-bg-secondary">
          <h3 className="text-lg font-medium text-text-primary mb-4">Create New Content Pipeline</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Pipeline Name</label>
              <input
                type="text"
                value={newPipelineData.name}
                onChange={(e) => setNewPipelineData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Content Pipeline"
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Video Prompt</label>
              <textarea
                value={newPipelineData.videoPrompt}
                onChange={(e) => setNewPipelineData(prev => ({ ...prev, videoPrompt: e.target.value }))}
                placeholder="Describe the video you want to generate..."
                rows={3}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Social Media Platforms</label>
              <div className="flex gap-2 flex-wrap">
                {['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok'].map(platform => (
                  <label key={platform} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={newPipelineData.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewPipelineData(prev => ({
                            ...prev,
                            platforms: [...prev.platforms, platform]
                          }));
                        } else {
                          setNewPipelineData(prev => ({
                            ...prev,
                            platforms: prev.platforms.filter(p => p !== platform)
                          }));
                        }
                      }}
                      className="rounded border-border text-accent-primary focus:ring-accent-primary"
                    />
                    <span className="text-sm capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Post Content</label>
              <textarea
                value={newPipelineData.content}
                onChange={(e) => setNewPipelineData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your social media post..."
                rows={3}
                className="w-full px-3 py-2 bg-bg-primary border border-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowPipelineForm(false)}
              className="px-4 py-2 border border-border rounded-md text-text-primary hover:bg-bg-card transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createNewPipeline}
              className="px-4 py-2 bg-accent-primary text-bg-primary rounded-md hover:bg-accent-primary/90 transition-colors"
            >
              Create Pipeline
            </button>
          </div>
        </div>
      )}

      {/* Content Pipelines Overview */}
      {workflowState.pipelines.length > 0 && (
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-medium text-text-primary mb-3">Active Pipelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflowState.pipelines.map((pipeline) => (
              <div key={pipeline.id} className="bg-bg-secondary border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-text-primary">{pipeline.name}</h3>
                  <div className={cn("flex items-center gap-1 text-xs", getStatusColor(pipeline.status))}>
                    {getStatusIcon(pipeline.status)}
                    {pipeline.status}
                  </div>
                </div>
                <p className="text-xs text-text-muted mb-2">
                  Prompt: {pipeline.videoParams.prompt.substring(0, 50)}...
                </p>
                <p className="text-xs text-text-muted mb-3">
                  Platforms: {pipeline.socialPost.platforms.join(', ')}
                </p>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{pipeline.createdAt.toLocaleTimeString()}</span>
                  <div className="flex gap-1">
                    {pipeline.status === 'idle' && (
                      <button
                        onClick={() => executeContentPipeline(pipeline.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-accent-primary text-bg-primary rounded text-xs hover:bg-accent-primary/90 transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Run
                      </button>
                    )}
                    {(pipeline.status === 'generating' || pipeline.status === 'publishing') && (
                      <button
                        onClick={() => cancelPipeline(pipeline.id)}
                        className="flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-bg-card transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => deletePipeline(pipeline.id)}
                      className="flex items-center gap-1 px-2 py-1 border border-border rounded text-xs hover:bg-bg-card transition-colors text-status-error"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area with Tabs */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-border mx-4 mt-4">
            <button
              onClick={() => setActiveTab('video-generation')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'video-generation'
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              <Video className="w-4 h-4" />
              Video Generation
            </button>
            <button
              onClick={() => setActiveTab('social-publishing')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'social-publishing'
                  ? "border-accent-primary text-accent-primary"
                  : "border-transparent text-text-muted hover:text-text-primary"
              )}
            >
              <Share2 className="w-4 h-4" />
              Social Publishing
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden p-4">
            {activeTab === 'video-generation' && (
              <div className="h-full bg-bg-secondary rounded-lg border border-border overflow-hidden">
                {wan2gpApp ? (
                  <>
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-accent-primary" />
                        <span className="font-medium">{wan2gpApp.name}</span>
                        <span className="text-xs px-2 py-1 bg-bg-card rounded text-text-muted">
                          {wan2gpApp.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors">
                          <Save className="w-4 h-4" />
                          Save Settings
                        </button>
                        <button
                          onClick={() => sendToWan2GP({ type: 'ping', timestamp: Date.now() })}
                          className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                    <iframe
                      ref={wan2gpIframeRef}
                      src={wan2gpApp.url}
                      className="w-full h-[calc(100%-60px)] border-0"
                      title="Wan2GP Video Generation"
                      onLoad={() => {
                        // Send initialization message when iframe loads
                        setTimeout(() => {
                          sendToWan2GP({ type: 'unified_app_init', version: '1.0.0' });
                        }, 1000);
                      }}
                    />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Video className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <p className="text-text-muted">Wan2GP Video Generation not available</p>
                      <p className="text-xs text-text-muted mt-2">Make sure Wan2GP is running on port 7860</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'social-publishing' && (
              <div className="h-full bg-bg-secondary rounded-lg border border-border overflow-hidden">
                {postizApp ? (
                  <>
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-accent-primary" />
                        <span className="font-medium">{postizApp.name}</span>
                        <span className="text-xs px-2 py-1 bg-bg-card rounded text-text-muted">
                          {postizApp.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors">
                          <Save className="w-4 h-4" />
                          Save Settings
                        </button>
                        <button
                          onClick={() => sendToPostiz({ type: 'ping', timestamp: Date.now() })}
                          className="flex items-center gap-1 px-3 py-1 border border-border rounded text-sm hover:bg-bg-card transition-colors"
                        >
                          Test Connection
                        </button>
                      </div>
                    </div>
                    <iframe
                      ref={postizIframeRef}
                      src={postizApp.url}
                      className="w-full h-[calc(100%-60px)] border-0"
                      title="Postiz Social Media Dashboard"
                      onLoad={() => {
                        // Send initialization message when iframe loads
                        setTimeout(() => {
                          sendToPostiz({ type: 'unified_app_init', version: '1.0.0' });
                        }, 1000);
                      }}
                    />
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Share2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
                      <p className="text-text-muted">Postiz Social Media Dashboard not available</p>
                      <p className="text-xs text-text-muted mt-2">Make sure Postiz is running on port 3002</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}