import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import { Switch as SwitchComponent } from '@/shared/components/ui/switch';
import { FormField } from '@/shared/types/blocks/form';

export function Switch({
  field,
  formField,
  data,
}: {
  field: FormField;
  formField: ControllerRenderProps<Record<string, unknown>, string>;
  data?: any;
}) {
  return (
    <>
      <SwitchComponent
        checked={Boolean(formField.value)}
        onCheckedChange={formField.onChange}
      />
    </>
  );
}
