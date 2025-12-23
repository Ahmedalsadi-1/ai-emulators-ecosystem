import { BaseServiceCard } from './BaseServiceCard';

/**
 * UI component for the Postiz service card.
 * Extends BaseServiceCard with Postiz-specific actions.
 */
export class PostizServiceCard extends BaseServiceCard {
  constructor(props: any) {
    super(props);
  }

  render() {
    // Custom render for Postiz-specific UI if needed
    return super.render();
  }
}

// Export default instance props for registration
export const postizServiceCardProps = {
  name: 'Postiz',
  status: 'active',
  actions: [
    { label: 'Post Now', action: 'post' },
    { label: 'Schedule', action: 'schedule' },
    { label: 'View Analytics', action: 'analytics' }
  ]
};