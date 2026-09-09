import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Tabs } from '@/shared/blocks/common/tabs';
import { Button } from '@/shared/components/ui/button';
import {
  Button as ButtonType,
  Filter as FilterType,
  Search as SearchType,
  Tab,
} from '@/shared/types/blocks/common';

import { Filter } from './filter';
import { Search } from './search';

export function MainHeader({
  title,
  description,
  tabs,
  filters,
  search,
  actions,
}: {
  title?: string;
  description?: string;
  tabs?: Tab[];
  filters?: FilterType[];
  search?: SearchType;
  actions?: ButtonType[];
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight">{title || ''}</h2>
          <p className="text-muted-foreground">{description || ''}</p>
        </div>
        <div>
          {actions?.map((action, idx) => (
            <Link
              key={idx}
              href={action.url || ''}
              target={action.target || '_self'}
            >
              <Button
                onClick={action.onClick}
                variant={action.variant || 'default'}
                size={action.size || 'sm'}
              >
                {action.icon && <SmartIcon name={action.icon as string} />}
                {action.title}
              </Button>
            </Link>
          ))}
        </div>
      </div>
      {tabs && tabs.length > 0 ? <Tabs tabs={tabs} /> : null}
      {(search || filters) && (
        <div className="mb-6 flex justify-start gap-2">
          {search && <Search search={search} />}
          {filters && filters.length > 0
            ? filters.map((filter) => (
                <Filter key={filter.name} filter={filter} />
              ))
            : null}
        </div>
      )}
    </div>
  );
}
