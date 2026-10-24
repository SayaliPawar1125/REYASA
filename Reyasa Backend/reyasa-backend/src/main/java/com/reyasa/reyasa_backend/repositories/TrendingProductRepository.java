
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.TrendingProduct;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrendingProductRepository
        extends JpaRepository<TrendingProduct, Long> {

    // Get active trending products in homepage display order
    List<TrendingProduct> findByActiveTrueOrderByDisplayOrderAsc();

    // Find a trending entry by its product ID
    Optional<TrendingProduct> findByProduct_Id(Long productId);

    // Check whether a product is already in the trending list
    boolean existsByProduct_Id(Long productId);

    // Get all trending entries for admin
    List<TrendingProduct> findAllByOrderByDisplayOrderAsc();
}
