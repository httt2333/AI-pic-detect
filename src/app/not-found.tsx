import Image from 'next/image';
import Link from 'next/link';

import { envConfigs } from '@/config';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Image
        src={envConfigs.app_logo}
        alt={envConfigs.app_name}
        width={80}
        height={80}
      />
      <h1 className="text-2xl font-normal">Page not found</h1>
      <Button asChild>
        <Link href="/" className="mt-4">
          <SmartIcon name="ArrowLeft" />
          <span>Back to Home</span>
        </Link>
      </Button>
    </div>
  );
}
