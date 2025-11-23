import fiTranslations from '../locales/fi.json';
import enTranslations from '../locales/en.json';
import fiSurveyConfig from '../survey-config.fi.json';
import enSurveyConfig from '../survey-config.en.json';

export type Language = 'fi' | 'en';
export type TranslationKey = keyof typeof fiTranslations;

class I18n {
  private currentLanguage: Language = 'fi';
  private translations: Record<Language, any> = {
    fi: fiTranslations,
    en: enTranslations
  };

  private surveyConfigs: Record<Language, any> = {
    fi: fiSurveyConfig,
    en: enSurveyConfig
  };

  constructor() {
    // Check URL parameter first, then localStorage, then default to Finnish
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang') || urlParams.get('language');

    if (urlLang && (urlLang === 'fi' || urlLang === 'en')) {
      this.currentLanguage = urlLang as Language;
      // Save to localStorage so it persists
      localStorage.setItem('survey_language', urlLang);
    } else {
      // Fall back to localStorage or default
      const savedLang = localStorage.getItem('survey_language') as Language;
      if (savedLang && (savedLang === 'fi' || savedLang === 'en')) {
        this.currentLanguage = savedLang;
      }
    }
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    localStorage.setItem('survey_language', lang);
    // Trigger a custom event so components can react to language changes
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  t(key: string, replacements?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }

    // Replace placeholders like {name} with actual values
    if (replacements) {
      Object.keys(replacements).forEach(replaceKey => {
        value = value.replace(`{${replaceKey}}`, replacements[replaceKey]);
      });
    }

    return value;
  }

  getSurveyConfig(): any {
    return this.surveyConfigs[this.currentLanguage];
  }

  // Helper method to format time units with proper pluralization
  formatTimeUnit(unit: 'day' | 'hour' | 'minute', count: number): string {
    const plural = count !== 1;
    const key = plural ? `timeUnits.${unit}s` : `timeUnits.${unit}`;
    return this.t(key);
  }
}

// Export singleton instance
export const i18n = new I18n();
