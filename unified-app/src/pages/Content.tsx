import { CategoryHeader } from '@/components/CategoryHeader';
import { ContentCreationSplitView } from '@/components/ContentCreationSplitView';

export function ContentPage() {
  return (
    <div className="h-full flex flex-col">
      <CategoryHeader />
      <div className="flex-1 overflow-hidden">
        <ContentCreationSplitView />
      </div>
    </div>
  );
}