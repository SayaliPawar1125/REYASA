
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Test whether UserController is working
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("UserController is working!");
    }

    // Get details of the currently logged-in user
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(
            Authentication authentication) {

        // Check authentication
        if (authentication == null ||
                !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "message",
                            "User is not authenticated"
                    ));
        }

        // Get the logged-in user's email from the JWT authentication
        String email = authentication.getName();

        System.out.println("Authenticated email: " + email);

        // Find the user in the database
        User user = userRepository
                .findByEmailIgnoreCase(email)
                .orElse(null);

        // Return an error if the user does not exist
        if (user == null) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("message", "User not found");
            error.put("email", email);

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(error);
        }

        // Return only safe user details
        Map<String, Object> userDetails = new LinkedHashMap<>();
        userDetails.put("id", user.getId());
        userDetails.put("firstName", user.getFirstName());
        userDetails.put("lastName", user.getLastName());
        userDetails.put("email", user.getEmail());
        userDetails.put("phone", user.getPhone());
        userDetails.put("role", user.getRole());

        return ResponseEntity.ok(userDetails);
    }
}
