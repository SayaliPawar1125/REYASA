
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.PaymentCreateRequest;
import com.reyasa.reyasa_backend.dto.PaymentCreateResponse;
import com.reyasa.reyasa_backend.dto.PaymentVerifyRequest;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;
import com.reyasa.reyasa_backend.services.PaymentService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserRepository userRepository;

    // CREATE RAZORPAY ORDER
    @PostMapping("/create-order")
    public ResponseEntity<PaymentCreateResponse> createPaymentOrder(
            @Valid @RequestBody PaymentCreateRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        PaymentCreateResponse response =
                paymentService.createRazorpayOrder(
                        user.getId(),
                        request.getSelectedCartItemIds()
                );

        return ResponseEntity.ok(response);
    }

    // VERIFY RAZORPAY PAYMENT
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(
            @Valid @RequestBody PaymentVerifyRequest request,
            Authentication authentication) {

        User user = getAuthenticatedUser(authentication);

        boolean verified = paymentService.verifyPayment(
                user.getId(),
                request.getRazorpayOrderId(),
                request.getRazorpayPaymentId(),
                request.getRazorpaySignature()
        );

        return ResponseEntity.ok(
                Map.of(
                        "verified", verified,
                        "message", "Payment verified successfully"
                )
        );
    }

    // GET AUTHENTICATED USER
    private User getAuthenticatedUser(Authentication authentication) {

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please login first"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));
    }
}
