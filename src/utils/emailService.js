const nodeMailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodeMailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    service: "gmail",
    secure: false,
    auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASSWORD
     }
   })

const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${env.CLIENT_URL}/api/auth/verify-email?token=${token}`;
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Email Verification',
    html: `<p>Please verify your email by clicking the link below:</p>
           <a href="${verificationLink}">Verify Email</a>`
  };

  try {
    console.log('Mail options:', mailOptions);
    await transporter.sendMail(mailOptions)
    console.log((`Verification email sent to ${email}`));
    return true
  }catch (e) {
    console.error('Error sending verification email:', e);
    return false
  }
}
const sendPasswordResetEmail = async (to, token) => {
  const resetLink = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject: 'Password Reset Request',
    html: `<p>You requested a password reset. Click the link below to reset your password:</p>
           <a href="${resetLink}">Reset Password</a>`
  };

  try {
    await transporter.sendMail(mailOptions)
    console.log((`Password reset email sent to ${to}`));
    return true
  }catch (e) {
    console.error('Error sending password reset email:', e);
    return false
  }
}


module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
}