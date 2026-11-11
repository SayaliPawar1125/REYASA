package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ForgotPasswordService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ForgotPasswordEmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<String, OtpData> otpStorage =
            new ConcurrentHashMap<>();

    public ForgotPasswordService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            ForgotPasswordEmailService emailService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public void sendOtp(String email) {

        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElse(null);

        // Return without revealing whether the account exists.
        if (user == null) {
            return;
        }

        OtpData existing = otpStorage.get(normalizedEmail);

        if (existing != null &&
                existing.lastSentAt.plusSeconds(
                        RESEND_COOLDOWN_SECONDS
                ).isAfter(LocalDateTime.now())) {

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait 60 seconds before requesting another OTP."
            );
        }

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1000000)
        );

        OtpData data = new OtpData();

        data.otp = otp;
        data.expiry = LocalDateTime.now()
                .plusMinutes(OTP_EXPIRY_MINUTES);

        data.lastSentAt = LocalDateTime.now();
        data.attempts = 0;

        otpStorage.put(normalizedEmail, data);

        emailService.sendOtp(normalizedEmail, otp);
    }

    @Transactional
    public void resetPassword(
            String email,
            String otp,
            String newPassword) {

        String normalizedEmail = email.trim().toLowerCase();

        OtpData data = otpStorage.get(normalizedEmail);

        if (data == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please request a new OTP."
            );
        }

        if (data.expiry.isBefore(LocalDateTime.now())) {

            otpStorage.remove(normalizedEmail);

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP has expired. Please request a new OTP."
            );
        }

        if (data.attempts >= MAX_ATTEMPTS) {

            otpStorage.remove(normalizedEmail);

            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Maximum OTP attempts exceeded. Request a new OTP."
            );
        }

        if (!data.otp.equals(otp)) {

            data.attempts++;

            if (data.attempts >= MAX_ATTEMPTS) {
                otpStorage.remove(normalizedEmail);
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP."
            );
        }

        User user = userRepository
                .findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Unable to reset password."
                        )
                );

        user.setPassword(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        otpStorage.remove(normalizedEmail);
    }

    private static class OtpData {

        private String otp;
        private LocalDateTime expiry;
        private LocalDateTime lastSentAt;
        private int attempts;
    }
}