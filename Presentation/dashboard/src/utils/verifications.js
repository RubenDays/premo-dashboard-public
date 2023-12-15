/**
 * Verifies if the username has a valid format
 * @param {string} username 
 * @returns True is it's valid, false otherwise.
 */
export function verifyUsername(username) {
    return username && username.length <= 15 && !/[^A-Za-z0-9]/.test(username)
}


/**
 * Verifies if ID is valid, by checking is it's a positive number.
 * @param {string} val to check if it's a number or not.
 * @returns boolean indicating if the value is a positive number, 0 included.
 */
function isValidID(val) {
    if (!val) return false
    if (! /^-?\d+$/.test(val)) return false
    return parseInt(val) >= 0
}

export function isValidDayUci(val) {
    if (!val) return false
    if (! /^-?\d+$/.test(val)) return false
    return parseInt(val) >= 1
}

function isDayUciValid(value) {
    if (!value) return false

    if (value.includes('-')) {
        const valueParts = value.split('-')

        // if it's not of with format 'x-y'
        if (valueParts.length !== 2) return false

        // if both aren't numbers
        if (!isValidDayUci(valueParts[0]) || !isValidDayUci(valueParts[1])) return false            

        // if starting ID is lower than ending ID
        if (parseInt(valueParts[0]) > parseInt(valueParts[1])) return false

        return true
    } else {
        return isValidDayUci(value)
    }
}

export function verifyDayUcisInput(input) {
    if (!input) return true

    const values = input.replace(/\s/g, '')
    if (values.length > 0) {
        // separate with ';' and remove empty strings
        const values_parts = values.split(';').filter(elem => elem)

        // checks if every element returns true from 'validPatientIDInput'
        return values_parts.every(elem => isDayUciValid(elem))
    }

    return true
}

/**
 * Verifies if the value is an integer.
 * @param {value} value to check if it's an integer. 
 * @returns true if the value is a valid integer.
 */
export function isInt(value) {
    if (!value) return false

    return !isNaN(parseInt(value))
}

/**
 * Verifies if the value is in a valid cutoff format.
 * @param {string} value to verify
 * @param {bool} allow_gle if it allows the symbols '<', '>' and '='
 */
function isValidCutoff(value, allow_gle) {
    if (!value) return false
    if (allow_gle) {
        let v = value
        if (value.includes('<=') || value.includes('>=')) {
            if (value.length < 3) return false
            v = v.substring(2)
        } else if (value.includes('>') || value.includes('<') || value.includes('=')) {
            if (value.length < 2) return false
            v = v.substring(1)
        } else {
            return false
        }
        return !isNaN(v)
    } else {
        return !isNaN(value)
    }
}

/**
 * Verifies the cutoff format.
 * @param {string} value contains the cutoff string to be verified. 
 * @returns true if it's a valid cutoff format.
 */
function validCutoffInput(value) {
    if (!value) return false

    if (value.includes('-')) {
        const valueParts = value.split('-')

        // if it's not of with format 'x-y'
        if (valueParts.length !== 2) return false

        // if both aren't numbers
        if (!isValidCutoff(valueParts[0], false) || !isValidCutoff(valueParts[1], false)) return false            

        // if starting ID is lower than ending ID
        if (parseFloat(valueParts[0]) > parseFloat(valueParts[1])) return false

        return true
    } else {
        return isValidCutoff(value, true)
    }
}

/**
 * Verifies all cutoffs in the string.
 * @param {string} input from the cutoff input to be verified. 
 * @returns true if the string is a valid cutoff format
 */
export function isCutoffInputValid(input) {
    if (input) {
        const values = input.replace(/\s/g, '')
        if (values.length > 0) {
            // separate with ';' and remove empty strings
            const values_parts = values.split(';').filter(elem => elem)

            // checks if every element returns true from 'validPatientIDInput'
            return values_parts.every(elem => validCutoffInput(elem))
        }
    }
    return true
}

/**
 * Verifies the patient IDs from the input.
 * @param {string} input representing the patient ids.
 * @returns true if the IDs are in the correct format.
 */
export function isPatientIDsInputValid(input) {
    if (input) {
        const ids = input.trim()
        if (ids.length > 0) {
            // separate with ';' and remove empty strings
            const ids_parts = ids.split(';').filter(elem => elem)

            // checks if every element returns true from 'validPatientIDInput'
            return ids_parts.every(elem => validPatientIDInput(elem))
        }
    }
    return true
}

/**
 * Verifies the patient ID.
 * @param {value} value patient ID to be verified.
 * @returns true if the patient ID is valid.
 */
function validPatientIDInput(value) {
    if (!value) return false
    if (value.includes('-')) {
        const valueParts = value.split('-')

        // if it's not of with format 'x-y'
        if (valueParts.length !== 2) return false

        // if both aren't numbers
        if (!isValidID(valueParts[0]) || !isValidID(valueParts[1])) return false            

        // if starting ID is lower than ending ID
        if (parseInt(valueParts[0]) > parseInt(valueParts[1])) return false

        return true
    } else {
        return isValidID(value)
    }
}

/**
 * Verifies the date input
 * @param {string} date input tob e verified
 * @returns true is the input is in a valid format.
 */
export function isValidDate(date) {
    if (!date) return true
    if (!(date.split('-').length === 3)) return false
    return !isNaN(Date.parse(date))
}
