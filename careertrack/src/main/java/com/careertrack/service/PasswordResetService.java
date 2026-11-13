
package com.careertrack.service;

import com.careertrack.entity.PasswordResetOtp;
import com.careertrack.entity.User;
import com.careertrack.repository.PasswordResetOtpRepository;
import com.careertrack.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final EmailService emailService;

    private final BCryptPasswordEncoder encoder =
            new BCryptPasswordEncoder();

    private final SecureRandom random = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetOtpRepository otpRepository,
            EmailService emailService) {

        this.userRepository = userRepository;
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    // Send OTP to registered email
    public void sendOtp(String email) {

        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required"
            );
        }

        String cleanEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(cleanEmail)
                .orElse(null);

        // Check whether account exists
        if (user == null) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Account doesn't exist. Please register first."
            );
        }

        String otp = String.format(
                "%06d",
                random.nextInt(1000000)
        );

        PasswordResetOtp resetOtp = otpRepository
                .findByEmail(cleanEmail)
                .orElse(new PasswordResetOtp());

        resetOtp.setEmail(cleanEmail);
        resetOtp.setOtpHash(encoder.encode(otp));
        resetOtp.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );
        resetOtp.setVerified(false);
        resetOtp.setAttempts(0);

        otpRepository.save(resetOtp);

        try {
            emailService.sendOtpEmail(cleanEmail, otp);

        } catch (Exception e) {

            otpRepository.deleteByEmail(cleanEmail);

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to send OTP email. Please try again."
            );
        }
    }

    // Verify OTP
    public void verifyOtp(String email, String otp) {

        if (email == null || otp == null ||
                email.trim().isEmpty() || otp.trim().isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email and OTP are required"
            );
        }

        String cleanEmail = email.trim().toLowerCase();
        String cleanOtp = otp.trim();

        PasswordResetOtp resetOtp = otpRepository
                .findByEmail(cleanEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or expired OTP"
                ));

        if (resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {

            otpRepository.delete(resetOtp);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP has expired"
            );
        }

        if (resetOtp.getAttempts() >= 5) {

            otpRepository.delete(resetOtp);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Too many incorrect attempts. Request a new OTP."
            );
        }

        if (!encoder.matches(cleanOtp, resetOtp.getOtpHash())) {

            resetOtp.setAttempts(resetOtp.getAttempts() + 1);
            otpRepository.save(resetOtp);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Incorrect OTP"
            );
        }

        resetOtp.setVerified(true);
        otpRepository.save(resetOtp);
    }

    // Reset password after OTP verification
    public void resetPassword(String email, String newPassword) {

        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Email is required"
            );
        }

        if (newPassword == null || newPassword.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters"
            );
        }

        String cleanEmail = email.trim().toLowerCase();

        PasswordResetOtp resetOtp = otpRepository
                .findByEmail(cleanEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Please verify your OTP first"
                ));

        if (!resetOtp.isVerified() ||
                resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP verification is required or has expired"
            );
        }

        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        otpRepository.delete(resetOtp);
    }
}
