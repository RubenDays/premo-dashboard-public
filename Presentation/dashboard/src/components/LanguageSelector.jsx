import React, { useState } from 'react'
import i18n from '../i18n'

export default function LanguageSelector() {
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)

    function chooseLanguage(ev) {
        ev.preventDefault()
        i18n.changeLanguage(ev.target.value)
        setSelectedLanguage(ev.target.value)
    }

    return (
        <select defaultValue={selectedLanguage} onChange={chooseLanguage}>
            <option value='pt'> Português </option>
            <option value='en'> English </option>
        </select>
    )

}
