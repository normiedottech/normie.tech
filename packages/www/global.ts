
import request from '@/i18n/request';
import messages from './messages/en.json';
import { Locale } from '@/i18n/config';
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}