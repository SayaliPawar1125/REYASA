package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    boolean existsByUser_IdAndProduct_Id(Long userId, Long productId);

    List<Wishlist> findByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<Wishlist> findByUser_IdAndProduct_Id(Long userId, Long productId);

    long countByUser_Id(Long userId);
}