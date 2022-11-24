import I18n from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import {I18nManager} from 'react-native';
import tr from './tr';
import en from './en';

const locales = RNLocalize.getLocales();
I18n.locale = locales[0].languageTag;
export const isRtl = locales[0].isRTL;
I18nManager.forceRTL(isRtl);
I18n.fallbacks = true;
I18n.locales.no = 'en';
I18n.translations = {
  en,
  tr,
};
export default I18n;