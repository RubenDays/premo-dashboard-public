import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import TranslationEN from '../locales/en/translation.json'
import TranslationPT from '../locales/pt/translation.json'

const resources = {
    en: { translation: TranslationEN },
    pt: { translation: TranslationPT },
}

i18n.use(initReactI18next)
    .init({
        resources,
        lng: 'pt', // default language
        debug: true,
        fallbackLng: 'en', // use this if the selected language does not exist
        interpolation: { escapeValue: false },
        ns: 'translation', // allows to separate translations into multiple files
        defaultNS: 'translation'
    })

export default i18n
