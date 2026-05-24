import nodemailer from "nodemailer";

export const sendEmail = async (email, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text
    });
    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.warn(`Failed to send email to ${email}. (This is expected in local testing without SMTP credentials). Error: ${error.message}`);
  }
};