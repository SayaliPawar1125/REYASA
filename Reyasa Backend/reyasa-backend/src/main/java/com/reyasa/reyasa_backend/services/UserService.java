
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.LoginRequest;
import com.reyasa.reyasa_backend.dto.LoginResponse;
import com.reyasa.reyasa_backend.dto.RegisterRequest;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // REGISTER
    @Transactional
    public User register(RegisterRequest request) {

        String email = request.email().trim().toLowerCase();

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

        // Public registration always creates a USER
        user.setRole("USER");
        user.setActive(true);

        return userRepository.save(user);
    }

    // LOGIN
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

        // Check password
        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password."
            );
        }

        // Check account status
        if (!user.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Your account is inactive."
            );
        }

        // Generate JWT token using the String role
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
