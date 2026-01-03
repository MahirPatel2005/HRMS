const crypto = require('crypto');

/**
 * Generate Login ID
 * Format: [Company Initials] + [Name Initials] + [Year of Joining] + [Serial Number]
 * Example: Dayflow Inc + John Doe + 2025 + 001 -> DIJD2025001
 *
 * @param {Object} company - Company object
 * @param {String} firstName - Employee First Name
 * @param {String} lastName - Employee Last Name
 * @param {Date} joiningDate - Date of joining
 * @param {Number} serialNumber - Sequential number for the employee (e.g., count + 1)
 */
const generateLoginId = (company, firstName, lastName, joiningDate, serialNumber) => {
    // 1. Company Initials (First letter of each word)
    // Clean name of special chars first
    const cleanCompanyName = company.name.replace(/[^a-zA-Z\s]/g, '');
    const companyInitials = cleanCompanyName
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2); // Take first 2 chars just in case, or as per requirement

    // 2. Name Initials (First letter of First and Last Name)
    const nameInitials = (firstName[0] + lastName[0]).toUpperCase();

    // 3. Year of Joining
    const year = new Date(joiningDate).getFullYear();

    // 4. Serial Number (Pad with 3 zeros)
    const serial = serialNumber.toString().padStart(3, '0');

    return `${companyInitials}${nameInitials}${year}${serial}`;
};

/**
 * Generate a random temporary password
 * @param {number} length
 */
const generateTempPassword = (length = 10) => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};

module.exports = {
    generateLoginId,
    generateTempPassword,
};
