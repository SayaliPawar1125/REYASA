
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Order;
import com.reyasa.reyasa_backend.repositories.OrderRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;

    private static final ZoneId INDIA_ZONE =
            ZoneId.of("Asia/Kolkata");

    // Get every order
    public List<Order> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .sorted((a, b) ->
                        b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList();
    }

    // Get orders created today in India
    public List<Order> getTodaysOrders() {
        LocalDate today = LocalDate.now(INDIA_ZONE);

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        return orderRepository
                .findByCreatedAtBetweenOrderByCreatedAtDesc(start, end);
    }

    // Get order dashboard statistics
    public Map<String, Object> getOrderDashboardStats() {
        LocalDate today = LocalDate.now(INDIA_ZONE);

        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.plusDays(1).atStartOfDay();

        long totalOrders = orderRepository.count();

        long todaysOrders = orderRepository.countByCreatedAtBetween(
                start, end
        );

        BigDecimal todaysRevenue =
                orderRepository.calculateDailyRevenue(start, end);

        Map<String, Object> stats = new HashMap<>();

        stats.put("totalOrders", totalOrders);
        stats.put("todaysOrders", todaysOrders);
        stats.put("todaysRevenue", todaysRevenue);

        return stats;
    }

    // Update order status
    @Transactional
    public Order updateOrderStatus(Long orderId, String status) {

        if (status == null) {
            throw new IllegalArgumentException("Order status is required");
        }

        String normalizedStatus = status.trim().toUpperCase();

        if (!List.of(
                "PLACED",
                "CONFIRMED",
                "PROCESSING",
                "SHIPPED",
                "DELIVERED",
                "CANCELLED"
        ).contains(normalizedStatus)) {
            throw new IllegalArgumentException("Invalid order status");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found: " + orderId));

        if ("CANCELLED".equals(order.getOrderStatus())) {
            throw new IllegalArgumentException(
                    "Cancelled orders cannot be updated"
            );
        }

        if ("DELIVERED".equals(order.getOrderStatus())
                && !"DELIVERED".equals(normalizedStatus)) {
            throw new IllegalArgumentException(
                    "Delivered orders cannot be changed"
            );
        }

        order.setOrderStatus(normalizedStatus);

        if ("SHIPPED".equals(normalizedStatus)
                && order.getShippedAt() == null) {
            order.setShippedAt(LocalDateTime.now(INDIA_ZONE));
        }

        if ("DELIVERED".equals(normalizedStatus)) {
            if (order.getShippedAt() == null) {
                throw new IllegalArgumentException(
                        "Order must be shipped before delivery"
                );
            }

            if (order.getDeliveredAt() == null) {
                order.setDeliveredAt(LocalDateTime.now(INDIA_ZONE));
            }
        }

        return orderRepository.save(order);
    }

    // Update courier and tracking information
    @Transactional
    public Order updateTrackingDetails(
            Long orderId,
            String courierName,
            String trackingNumber,
            String trackingUrl
    ) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException("Order not found: " + orderId));

        if ("CANCELLED".equals(order.getOrderStatus())
                || "DELIVERED".equals(order.getOrderStatus())) {
            throw new IllegalArgumentException(
                    "Tracking details cannot be changed for this order"
            );
        }

        if (courierName == null || courierName.isBlank()) {
            throw new IllegalArgumentException(
                    "Courier name is required"
            );
        }

        if (trackingNumber == null || trackingNumber.isBlank()) {
            throw new IllegalArgumentException(
                    "Tracking number is required"
            );
        }

        if (trackingUrl == null || trackingUrl.isBlank()) {
            throw new IllegalArgumentException(
                    "Tracking URL is required"
            );
        }

        String normalizedUrl = trackingUrl.trim();

        if (!normalizedUrl.matches("^https?://.+")) {
            throw new IllegalArgumentException(
                    "Tracking URL must start with http:// or https://"
            );
        }

        order.setCourierName(courierName.trim());
        order.setTrackingNumber(trackingNumber.trim());
        order.setTrackingUrl(normalizedUrl);

        // Automatically mark the order as shipped
        if (!"SHIPPED".equals(order.getOrderStatus())) {
            order.setOrderStatus("SHIPPED");
        }

        if (order.getShippedAt() == null) {
            order.setShippedAt(LocalDateTime.now(INDIA_ZONE));
        }

        return orderRepository.save(order);
    }
}
