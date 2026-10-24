
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

    // Get dashboard order statistics
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
        if (status == null ||
                !List.of("PLACED", "CONFIRMED", "PROCESSING",
                                "SHIPPED", "DELIVERED", "CANCELLED")
                        .contains(status.toUpperCase())) {
            throw new IllegalArgumentException(
                    "Invalid order status"
            );
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Order not found: " + orderId
                        ));

        order.setOrderStatus(status.toUpperCase());

        return orderRepository.save(order);
    }
}
