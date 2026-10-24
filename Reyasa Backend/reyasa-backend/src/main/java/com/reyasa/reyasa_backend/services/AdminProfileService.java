package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.AdminProfileResponse;
import com.reyasa.reyasa_backend.dto.ChangeAdminPasswordRequest;
import com.reyasa.reyasa_backend.dto.UpdateAdminProfileRequest;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminProfileService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private User getAuthenticatedAdmin(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication.getName() == null) {
            throw new IllegalStateException("Please log in first");
        }

        User user = userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException("User not found"));

        if (user.getRole() == null ||
                !user.getRole().equalsIgnoreCase("ADMIN")) {
            throw new IllegalStateException(
                    "Access denied. Admin only.");
        }

        return user;
    }

    private AdminProfileResponse toResponse(User user) {
        return new AdminProfileResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }

    public AdminProfileResponse getProfile(
            Authentication authentication) {

        User user = getAuthenticatedAdmin(authentication);
        return toResponse(user);
    }

    @Transactional
    public AdminProfileResponse updateProfile(
            Authentication authentication,
            UpdateAdminProfileRequest request) {

        User user = getAuthenticatedAdmin(authentication);

        String email = request.getEmail().trim();

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(
                email, user.getId())) {
            throw new IllegalArgumentException(
                    "This email is already registered");
        }

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setEmail(email);

        User savedUser = userRepository.save(user);

        return toResponse(savedUser);
    }

    @Transactional
    public String changePassword(
            Authentication authentication,
            ChangeAdminPasswordRequest request) {

        User user = getAuthenticatedAdmin(authentication);

        if (!passwordEncoder.matches(
                request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException(
                    "Current password is incorrect");
        }

        if (passwordEncoder.matches(
                request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException(
                    "New password must be different from current password");
        }

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);

        return "Password changed successfully";
    }
}