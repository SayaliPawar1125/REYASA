package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.ForgotPasswordRequest;
import com.reyasa.reyasa_backend.dto.ResetPasswordRequest;
import com.reyasa.reyasa_backend.services.ForgotPasswordService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/forgot-password")
@CrossOrigin(origins = "http://localhost:5173")
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    public ForgotPasswordController(
            ForgotPasswordService forgotPasswordService) {

        this.forgotPasswordService = forgotPasswordService;
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(
            @Valid @RequestBody ForgotPasswordRequest request) {

        forgotPasswordService.sendOtp(request.email());

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "If an account exists with this email, an OTP has been sent."
                )
        );
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        forgotPasswordService.resetPassword(
                request.email(),
                request.otp(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Password reset successful. Please login."
                )
        );
    }
}