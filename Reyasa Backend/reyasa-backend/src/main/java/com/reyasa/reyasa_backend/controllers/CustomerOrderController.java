
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.CustomerOrderRequest;
import com.reyasa.reyasa_backend.dto.CustomerOrderTrackingResponse;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.repositories.UserRepository;
import com.reyasa.reyasa_backend.services.CustomerOrderService;
import com.reyasa.reyasa_backend.services.CustomerOrderTrackingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;
    private final CustomerOrderTrackingService trackingService;
    private final UserRepository userRepository;

    // Place order
    @PostMapping("/place")
    public ResponseEntity<CustomerOrderService.PlaceOrderResponse> placeOrder(
            @Valid @RequestBody CustomerOrderRequest request,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        CustomerOrderService.PlaceOrderResponse response =
                customerOrderService.placeOrder(user.getId(), request);

        return ResponseEntity.ok(response);
    }

    // Get all orders of logged-in customer
    @GetMapping("/my-orders")
    public ResponseEntity<List<CustomerOrderTrackingResponse>> getMyOrders(
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                trackingService.getMyOrders(user.getId())
        );
    }

    // Get one order's tracking details
    @GetMapping("/{orderId}/tracking")
    public ResponseEntity<CustomerOrderTrackingResponse> getOrderTracking(
            @PathVariable Long orderId,
            Authentication authentication
    ) {

        User user = getAuthenticatedUser(authentication);

        return ResponseEntity.ok(
                trackingService.getMyOrder(user.getId(), orderId)
        );
    }

    private User getAuthenticatedUser(Authentication authentication) {

        String email = authentication.getName();

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Authenticated user not found"
                        )
                );
    }
}
