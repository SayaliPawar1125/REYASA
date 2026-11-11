package com.reyasa.reyasa_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Pattern(regexp = "\\d{6}", message = "OTP must contain 6 digits")
        String otp,

        @NotBlank
        @Size(min = 8, max = 72, message = "Password must contain 8 to 72 characters")
        String newPassword

) {}