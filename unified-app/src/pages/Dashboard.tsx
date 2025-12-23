import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppGrid } from '@/components/AppGrid';
import { CategoryHeader } from '@/components/CategoryHeader';
import { useUnifiedAppStore } from '@/hooks/useAppStore';

export function Dashboard() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const {
    activeCategory,
    getAppsByCategory,
    setActiveCategory
  } = useUnifiedAppStore();

  // Set active category from URL param
  React.useEffect(() => {
    if (categoryId && categoryId !== activeCategory) {
      setActiveCategory(categoryId as any);
    }
  }, [categoryId, activeCategory, setActiveCategory]);

  // Handle special categories
  React.useEffect(() => {
    if (activeCategory === 'workflows') {
      navigate('/workflows');
    } else if (activeCategory === 'infrastructure') {
      navigate('/category/infrastructure');
    }
  }, [activeCategory, navigate]);

  const apps = activeCategory ? getAppsByCategory(activeCategory) : [];

  return (
    <div className="h-full flex flex-col">
      <CategoryHeader />
      <div className="flex-1 overflow-y-auto p-6">
        <AppGrid apps={apps} />
      </div>
    </div>
  );
}