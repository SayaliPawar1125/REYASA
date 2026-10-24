
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    // Get orders between two dates
    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime start,
            LocalDateTime end
    );

    // Count orders created today
    long countByCreatedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    // Calculate revenue from paid orders
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

    // Get orders by status
    List<Order> findByOrderStatusIgnoreCaseOrderByCreatedAtDesc(
            String orderStatus
    );
}
