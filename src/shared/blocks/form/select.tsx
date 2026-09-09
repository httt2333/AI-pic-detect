import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import {
  Select as SelectComponent,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { FormField } from '@/shared/types/blocks/form';

export function Select({
  field,
  formField,
  data,
}: {
  field: FormField;
  formField: ControllerRenderProps<Record<string, unknown>, string>;
  data?: any;
}) {
  return (
    <SelectComponent
      value={formField.value as string}
      onValueChange={formField.onChange}
      defaultValue={field.value}
      {...field.attributes}
    >
      <SelectTrigger className="bg-background w-full rounded-md">
        <SelectValue placeholder={field.placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background rounded-md">
        {field.options?.map((option: any) => (
          <SelectItem key={option.value} value={option.value}>
            {option.title}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectComponent>
  );
}
