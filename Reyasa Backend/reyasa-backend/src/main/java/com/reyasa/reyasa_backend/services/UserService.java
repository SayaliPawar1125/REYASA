
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.LoginRequest;
import com.reyasa.reyasa_backend.dto.LoginResponse;
import com.reyasa.reyasa_backend.dto.RegisterRequest;
import com.reyasa.reyasa_backend.dto.GoogleLoginRequest;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${google.client-id}") String googleClientId) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.googleIdTokenVerifier =
                new GoogleIdTokenVerifier.Builder(
                        new NetHttpTransport(),
                        GsonFactory.getDefaultInstance()
                )
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();
    }

    // REGISTER
    @Transactional
    public User register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists"
            );
        }

        User user = new User();

        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setPassword(
                passwordEncoder.encode(request.password())
        );
        user.setPhone(request.phone());

        user.setRole("USER");
        user.setActive(true);

        return userRepository.save(user);
    }

    // EMAIL AND PASSWORD LOGIN
    public LoginResponse login(LoginRequest request) {

        String email = request.getEmail().trim();

        User user = userRepository
                .findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Account not found. Please create an account first."
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }

        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive."
            );
        }

        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                "Login successful",
                token,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // GOOGLE LOGIN
    @Transactional
    public LoginResponse loginWithGoogle(GoogleLoginRequest request) {

        GoogleIdToken googleToken;

        try {
            googleToken = googleIdTokenVerifier.verify(
                    request.credential()
            );

        } catch (IOException | GeneralSecurityException error) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Unable to verify Google account."
            );
        }

        if (googleToken == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid or expired Google login token."
            );
        }

        GoogleIdToken.Payload payload = googleToken.getPayload();

        // Verify Google's email ownership
        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Your Google email is not verified."
            );
        }

        String email = payload.getEmail();

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Google account email not found."
            );
        }

        email = email.trim().toLowerCase(Locale.ROOT);

        // Find existing account
        User user = userRepository
                .findByEmailIgnoreCase(email)
                .orElse(null);

        if (user != null) {

            // Admins must use the existing admin login
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Administrator accounts must use email and password login."
                );
            }

            if (!user.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Your account is inactive."
                );
            }

        } else {

            // Create a new customer account
            user = new User();

            // Get first and last names from Google token claims
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");

            if (firstName == null || firstName.isBlank()) {
                firstName = email.substring(0, email.indexOf('@'));
            }

            if (lastName == null) {
                lastName = "";
            }

            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);

            // Generate a random encoded password
            user.setPassword(
                    passwordEncoder.encode(UUID.randomUUID().toString())
            );

            // Google registration always creates a customer account
            user.setRole("USER");
            user.setActive(true);

            user = userRepository.save(user);
        }

        // Generate REYASA JWT
        String token = jwtService.generateToken(
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                "Google login successful",
                token,
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole()
        );
    }

    // GET ALL USERS
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // GET USER BY ID
    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found: " + id
                        )
                );
    }
}
