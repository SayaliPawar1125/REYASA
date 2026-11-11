
package com.reyasa.reyasa_backend.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EnquiryEmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public void sendReplyEmail(
            String customerName,
            String customerEmail,
            String subject,
            String originalMessage,
            String adminReply
    ) {
        try {
            SimpleMailMessage email = new SimpleMailMessage();

            email.setFrom(senderEmail);
            email.setTo(customerEmail);
            email.setSubject(
                    "REYASA - Response to Your Enquiry"
            );

            email.setText(
                    "Hello " + customerName + ",\n\n" +

                            "Thank you for contacting REYASA.\n\n" +

                            "We have received your enquiry and our team has responded.\n\n" +

                            "Your Enquiry:\n" +
                            "Subject: " + (subject == null ? "General Enquiry" : subject) + "\n" +
                            originalMessage + "\n\n" +

                            "Our Response:\n" +
                            adminReply + "\n\n" +

                            "Thank you for choosing REYASA.\n\n" +
                            "Created with passion. Worn with love.\n\n" +
                            "Regards,\n" +
                            "REYASA Team"
            );

            mailSender.send(email);

            log.info(
                    "Enquiry reply email sent to {}",
                    customerEmail
            );

        } catch (Exception ex) {
            log.error(
                    "Failed to send enquiry reply email to {}",
                    customerEmail,
                    ex
            );
        }
    }
}
