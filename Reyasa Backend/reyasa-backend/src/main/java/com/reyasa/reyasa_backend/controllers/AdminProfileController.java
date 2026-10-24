package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.AdminProfileResponse;
import com.reyasa.reyasa_backend.dto.ChangeAdminPasswordRequest;
import com.reyasa.reyasa_backend.dto.UpdateAdminProfileRequest;
import com.reyasa.reyasa_backend.services.AdminProfileService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminProfileController {

    private final AdminProfileService adminProfileService;

    public AdminProfileController(
            AdminProfileService adminProfileService) {
        this.adminProfileService = adminProfileService;
    }

    // Get admin profile
    @GetMapping
    public ResponseEntity<?> getProfile(
            Authentication authentication) {
        try {
            AdminProfileResponse response =
                    adminProfileService.getProfile(authentication);

            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Update admin profile
    @PutMapping
    public ResponseEntity<?> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateAdminProfileRequest request) {
        try {
            AdminProfileResponse response =
                    adminProfileService.updateProfile(
                            authentication, request);

            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // Change admin password
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangeAdminPasswordRequest request) {
        try {
            String message =
                    adminProfileService.changePassword(
                            authentication, request);

            return ResponseEntity.ok(
                    Map.of("message", message));

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", e.getMessage()));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", e.getMessage()));
        }
    }
}
