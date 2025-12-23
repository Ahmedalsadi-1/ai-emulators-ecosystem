import { CategoryHeader } from '@/components/CategoryHeader';
import { InfrastructureSplitView } from '@/components/InfrastructureSplitView';

export function InfrastructurePage() {
  return (
    <div className="h-full flex flex-col">
      <CategoryHeader />
      <div className="flex-1 overflow-hidden">
        <InfrastructureSplitView />
      </div>
    </div>
  );
}