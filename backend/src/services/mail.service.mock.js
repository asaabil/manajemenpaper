
// This is a mock mail service.
// In a real application, you would integrate with a service like SendGrid, Mailgun, or Nodemailer.

export const sendPasswordResetEmail = async (email, token) => {
  console.log(`Sending password reset email to ${email} with token ${token}`);
  // In a real app, you would construct an email and send it.
  // For example:
  // const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
  // const msg = {
  //   to: email,
  //   from: 'your-email@example.com',
  //   subject: 'Password Reset',
  //   html: `Click <a href="${resetUrl}">here</a> to reset your password.`
  // };
  // await sgMail.send(msg);
  return Promise.resolve();
};
