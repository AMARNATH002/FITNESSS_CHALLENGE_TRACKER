import React from "react";

function Contact() {
  return (
    <div className="simple-page">
      <div className="page-container">
        <h1 className="page-title">Contact Us</h1>
        <p className="page-description">
          Get in touch with us for any questions, support, or feedback about your fitness journey.
        </p>
        <div className="simple-content">
          <div className="contact-info">
            <div className="contact-section">
              <h3>📧 Email Support</h3>
              <p>For technical support and general inquiries:</p>
              <a href="mailto:support@fitness-tracker.com" className="contact-link">
                support@fitness-tracker.com
              </a>
            </div>

            <div className="contact-section">
              <h3>🏢 KEC Fitness Center</h3>
              <p>Visit us at Kongu Engineering College</p>
              <p>Perundurai, Erode - 638060</p>
              <p>Tamil Nadu, India</p>
            </div>

            <div className="contact-section">
              <h3>⏰ Office Hours</h3>
              <p>Monday - Friday: 6:00 AM - 10:00 PM</p>
              <p>Saturday: 7:00 AM - 8:00 PM</p>
              <p>Sunday: 8:00 AM - 6:00 PM</p>
            </div>

            <div className="contact-section">
              <h3>📞 Phone Support</h3>
              <p>Fitness Program Inquiries: +91-4294-226555</p>
              <p>Technical Support: +91-4294-226666</p>
            </div>

            <div className="contact-section">
              <h3>💬 Live Chat</h3>
              <p>Get instant help through our live chat support during business hours.</p>
              <button className="btn btn-primary">Start Chat</button>
            </div>
          </div>

          <div className="contact-form-section">
            <h3>Send us a Message</h3>
            <form className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input type="text" id="name" name="name" required />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" required />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input type="text" id="subject" name="subject" required />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>

              <button type="submit" className="btn btn-primary">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
