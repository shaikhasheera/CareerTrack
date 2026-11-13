
package com.careertrack.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String recipient, String otp) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom(senderEmail);
        message.setTo(recipient);
        message.setSubject("CareerTrack - Password Reset OTP");

        message.setText(
                "Hello,\n\n" +
                        "Your CareerTrack password reset OTP is: " + otp +
                        "\n\nThis OTP is valid for 5 minutes." +
                        "\n\nIf you did not request this, please ignore this email." +
                        "\n\nRegards,\nCareerTrack Team"
        );

        mailSender.send(message);
    }
}
