/**
 * Mock Email Service
 * Logs email credentials to console instead of sending actual email.
 */
const sendWelcomeEmail = async (email, loginId, password, verifyLink) => {
    console.log('\n==================================================');
    console.log(`📧 SENDING WELCOME EMAIL TO: ${email}`);
    console.log('--------------------------------------------------');
    console.log(`Subject: Welcome to Dayflow HRMS!`);
    console.log(`Hello,`);
    console.log(`Your account has been created.`);
    console.log(`Login ID: ${loginId}`);
    console.log(`Temporary Password: ${password}`);
    console.log(`\nPlease click here to verify your email first:\n${verifyLink}\n`);
    console.log(`Then login and change your password immediately.`);
    console.log('==================================================\n');
    return true;
};

module.exports = {
    sendWelcomeEmail,
};
