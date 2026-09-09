'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Filter as FilterType } from '@/shared/types/blocks/common';

export function Filter({ filter }: { filter: FilterType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(filter.value || '');

  const onChange = (value: string) => {
    if (value === filter.value) {
      return;
    }

    setValue(value);

    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(filter.name, value);
    } else {
      params.delete(filter.name);
    }

    router.push(`?${params.toString()}`);
  };

  return (
    <Select
      value={value || ''}
      defaultValue={filter.value || ''}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={filter.title} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{filter.title}</SelectLabel>
          {filter.options
            ?.filter((item) => item.value && item.value !== '')
            .map((item) => (
              <SelectItem key={item.value} value={item.value!}>
                {item.label}
              </SelectItem>
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
