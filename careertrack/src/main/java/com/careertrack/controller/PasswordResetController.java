
package com.careertrack.controller;

import com.careertrack.service.PasswordResetService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    public PasswordResetController(
            PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(
            @RequestBody Map<String, String> request) {

        passwordResetService.sendOtp(request.get("email"));

        return Map.of(
                "message",
                "If an account exists for this email, an OTP has been sent."
        );
    }

    @PostMapping("/verify-otp")
    public Map<String, String> verifyOtp(
            @RequestBody Map<String, String> request) {

        passwordResetService.verifyOtp(
                request.get("email"),
                request.get("otp")
        );

        return Map.of("message", "OTP verified successfully");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(
            @RequestBody Map<String, String> request) {

        passwordResetService.resetPassword(
                request.get("email"),
                request.get("newPassword")
        );

        return Map.of("message", "Password reset successfully");
    }
}
