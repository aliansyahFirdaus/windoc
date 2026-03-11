import { ILang } from '../../interface/i18n/I18n';
import en from './lang/en.json';
import id from './lang/id.json';
import { mergeObject } from '../../utils';
import { DeepPartial } from '../../interface/Common';

export class I18n {
  private currentLocale: string;

  private langMap: Map<string, ILang> = new Map([
    ['en', en],
    ['id', id]
  ]);

  constructor(locale: string) {
    this.currentLocale = locale;
  }

  public registerLangMap(locale: string, lang: DeepPartial<ILang>) {
    const sourceLang = this.langMap.get(locale);
    this.langMap.set(
      locale,
      <ILang>mergeObject(sourceLang || this.langMap.get('en')!, lang)
    );
  }

  public getLocale(): string {
    return this.currentLocale;
  }

  public setLocale(locale: string) {
    this.currentLocale = locale;
  }

  public getLang(): ILang {
    return this.langMap.get(this.currentLocale) || this.langMap.get('en')!;
  }

  public t(path: string): string {
    const keyList = path.split('.');
    let value = '';
    let item = this.getLang();
    for (let k = 0; k < keyList.length; k++) {
      const key = keyList[k];
      const currentValue = Reflect.get(item, key);
      if (currentValue) {
        value = item = currentValue;
      } else {
        return '';
      }
    }
    return value;
  }
}
