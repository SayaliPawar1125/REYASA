package com.reyasa.reyasa_backend.dto;



import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "First name is required")
        @Size(min = 2, max = 50,
                message = "First name must be between 2 and 50 characters")
        @Pattern(
                regexp = "^[\\p{L}\\p{M}]+(?:[ '\\u2019-][\\p{L}\\p{M}]+)*$",
                message = "First name can contain letters, spaces, hyphens and apostrophes only"
        )
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(min = 2, max = 50,
                message = "Last name must be between 2 and 50 characters")
        @Pattern(
                regexp = "^[\\p{L}\\p{M}]+(?:[ '\\u2019-][\\p{L}\\p{M}]+)*$",
                message = "Last name can contain letters, spaces, hyphens and apostrophes only"
        )
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 254, message = "Email must not exceed 254 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 64,
                message = "Password must contain 8 to 64 characters")
        @Pattern(
                regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9\\s])\\S+$",
                message = "Password must contain uppercase, lowercase, number and special character, without spaces"
        )
        String password,

        @NotBlank(message = "Mobile number is required")
        @Pattern(
                regexp = "^[6-9]\\d{9}$",
                message = "Enter a valid 10-digit Indian mobile number"
        )
        String phone

) {}
