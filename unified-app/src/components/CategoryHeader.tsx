import { useUnifiedAppStore } from '@/hooks/useAppStore';

export function CategoryHeader() {
  const { activeCategory, getNavigationItems } = useUnifiedAppStore();

  const navigationItems = getNavigationItems();
  const currentCategory = navigationItems.find(item => item.id === activeCategory);

  if (!currentCategory) {
    return (
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome to Unified App Shell
        </h1>
        <p className="text-text-secondary mt-2">
          Select a category from the sidebar to view available applications.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-border">
      <h1 className="text-2xl font-bold text-text-primary">
        {currentCategory.label}
      </h1>
      <p className="text-text-secondary mt-2">
        {currentCategory.description}
      </p>
      <div className="mt-4 text-sm text-text-muted">
        {currentCategory.count} application{currentCategory.count !== 1 ? 's' : ''} available
      </div>
    </div>
  );
}