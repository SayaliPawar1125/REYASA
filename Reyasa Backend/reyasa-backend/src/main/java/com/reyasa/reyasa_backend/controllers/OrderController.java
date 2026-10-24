
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
@PreAuthorize("hasRole('ADMIN')")
public class OrderController {

    private final OrderService orderService;

    // Get all orders
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // Get orders created today
    @GetMapping("/today")
    public ResponseEntity<List<Order>> getTodaysOrders() {
        return ResponseEntity.ok(orderService.getTodaysOrders());
    }

    // Get order dashboard statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrderDashboardStats() {
        return ResponseEntity.ok(
                orderService.getOrderDashboardStats()
        );
    }

    // Update an order's status
    @PatchMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody Map<String, String> request) {

        String status = request.get("status");

        return ResponseEntity.ok(
                orderService.updateOrderStatus(orderId, status)
        );
    }
}
