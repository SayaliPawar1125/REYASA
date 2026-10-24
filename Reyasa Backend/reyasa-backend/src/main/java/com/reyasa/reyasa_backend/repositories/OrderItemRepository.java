
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderItemRepository
        extends JpaRepository<OrderItem, Long> {

    // Get all items belonging to a particular order
    List<OrderItem> findByOrder_Id(Long orderId);

    // Get all items for a particular product
    List<OrderItem> findByProduct_Id(Long productId);

    // Get items belonging to a particular order, sorted by ID
    List<OrderItem> findByOrder_IdOrderByIdAsc(Long orderId);
}
