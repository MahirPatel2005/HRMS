/**
 * Mock Email Service
 * Logs email credentials to console instead of sending actual email.
 */
const sendWelcomeEmail = async (email, loginId, password) => {
    console.log('\n==================================================');
    console.log(`📧 SENDING WELCOME EMAIL TO: ${email}`);
    console.log('--------------------------------------------------');
    console.log(`Subject: Welcome to Dayflow HRMS!`);
    console.log(`Hello,`);
    console.log(`Your account has been created.`);
    console.log(`Login ID: ${loginId}`);
    console.log(`Temporary Password: ${password}`);
    console.log(`Please login and change your password immediately.`);
    console.log('==================================================\n');
    return true;
};

module.exports = {
    sendWelcomeEmail,
};
