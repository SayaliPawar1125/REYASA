
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime start,
            LocalDateTime end
    );

    long countByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("""
        SELECT COALESCE(SUM(o.totalAmount), 0)
        FROM Order o
        WHERE o.createdAt >= :start
          AND o.createdAt < :end
          AND UPPER(o.paymentStatus) = 'PAID'
          AND UPPER(o.orderStatus) <> 'CANCELLED'
        """)
    BigDecimal calculateDailyRevenue(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    List<Order> findByOrderStatusIgnoreCaseOrderByCreatedAtDesc(
            String orderStatus
    );

    Optional<Order> findByRazorpayOrderId(String razorpayOrderId);

    Optional<Order> findByRazorpayPaymentId(String razorpayPaymentId);

    // Customer: get only their own orders
    List<Order> findByUser_IdOrderByCreatedAtDesc(Long userId);

    // Customer: get one order belonging to them
    Optional<Order> findByIdAndUser_Id(Long orderId, Long userId);
}
