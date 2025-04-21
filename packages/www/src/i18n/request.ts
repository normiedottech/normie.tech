import {getRequestConfig} from 'next-intl/server';
import {getUserLocale} from '@/actions/locale';

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale: locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});