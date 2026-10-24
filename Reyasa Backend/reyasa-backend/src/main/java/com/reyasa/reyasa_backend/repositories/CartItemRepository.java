
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository
        extends JpaRepository<CartItem, Long> {

    List<CartItem> findByUserId(Long userId);

    Optional<CartItem> findByUserIdAndProduct_IdAndSize(
            Long userId,
            Long productId,
            String size
    );

    Optional<CartItem> findByIdAndUserId(
            Long id,
            Long userId
    );

    void deleteByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);
}
