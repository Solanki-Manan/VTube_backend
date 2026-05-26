export const sendEmail = async (email, subject, text) => {
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { 
            name: 'VTube', 
            email: process.env.EMAIL_USER 
        },
        to: [{ email: email }],
        subject: subject,
        textContent: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Unknown Brevo error');
    }

    console.log(`Email sent successfully to ${email}`);
  } catch (error) {
    console.warn(`Failed to send email to ${email}. Error: ${error.message}`);
  }
};