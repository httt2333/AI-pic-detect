import { ControllerRenderProps } from 'react-hook-form';

import { Checkbox as CheckboxComponent } from '@/shared/components/ui/checkbox';
import { Label } from '@/shared/components/ui/label';
import { FormField } from '@/shared/types/blocks/form';

export function Checkbox({
  field,
  formField,
  data,
}: {
  field: FormField;
  formField: ControllerRenderProps<Record<string, unknown>, string>;
  data?: any;
}) {
  // initial value
  let value = (formField.value as string[]) || [];

  if (typeof value === 'string') {
    try {
      const jsonValue = JSON.parse(value);
      if (Array.isArray(jsonValue)) {
        value = jsonValue;
      }
    } catch (error) {
      console.error('checkbox initial value parse error', error);
    }
  }

  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    let newValue: string[];

    if (checked) {
      // Add the value if it's not already in the array
      newValue = [...value, optionValue];
    } else {
      // Remove the value from the array
      newValue = value.filter((v) => v !== optionValue);
    }

    formField.onChange(newValue);
  };

  return (
    <div className="flex flex-col gap-4 py-2">
      {field.options?.map((option: any) => (
        <div key={option.value} className="flex items-start gap-4">
          <CheckboxComponent
            onCheckedChange={(checked) =>
              handleCheckboxChange(option.value, checked as boolean)
            }
            name={field.name}
            value={option.value}
            checked={value.includes(option.value)}
          />
          <div className="grid gap-1">
            <Label>{option.title}</Label>
            {option.description && (
              <p className="text-muted-foreground text-sm">
                {option.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
