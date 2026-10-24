
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.entities.TrendingProduct;
import com.reyasa.reyasa_backend.repositories.ProductRepository;
import com.reyasa.reyasa_backend.repositories.TrendingProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TrendingProductService {

    private final TrendingProductRepository trendingProductRepository;
    private final ProductRepository productRepository;

    // Get active trending products for the homepage
    @Transactional(readOnly = true)
    public List<TrendingProduct> getActiveTrendingProducts() {
        return trendingProductRepository
                .findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .filter(item -> item.getProduct().isActive())
                .toList();
    }

    // Get all trending products for admin
    @Transactional(readOnly = true)
    public List<TrendingProduct> getAllTrendingProducts() {
        return trendingProductRepository
                .findAllByOrderByDisplayOrderAsc();
    }

    // Add a product to trending
    public TrendingProduct addTrendingProduct(
            Long productId, Integer displayOrder) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found: " + productId
                        ));

        if (!product.isActive()) {
            throw new IllegalArgumentException(
                    "Inactive products cannot be marked as trending"
            );
        }

        if (trendingProductRepository.existsByProduct_Id(productId)) {
            throw new IllegalArgumentException(
                    "This product is already in the trending list"
            );
        }

        if (displayOrder == null || displayOrder < 0) {
            throw new IllegalArgumentException(
                    "Display order cannot be negative"
            );
        }

        TrendingProduct trending = TrendingProduct.builder()
                .product(product)
                .displayOrder(displayOrder)
                .active(true)
                .build();

        return trendingProductRepository.save(trending);
    }

    // Change the display order
    public TrendingProduct updateDisplayOrder(
            Long trendingId, Integer displayOrder) {

        if (displayOrder == null || displayOrder < 0) {
            throw new IllegalArgumentException(
                    "Display order cannot be negative"
            );
        }

        TrendingProduct trending = trendingProductRepository
                .findById(trendingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Trending entry not found: " + trendingId
                        ));

        trending.setDisplayOrder(displayOrder);

        return trendingProductRepository.save(trending);
    }

    // Remove a product from the trending section
    public TrendingProduct deactivateTrendingProduct(Long trendingId) {
        TrendingProduct trending = trendingProductRepository
                .findById(trendingId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Trending entry not found: " + trendingId
                        ));

        trending.setActive(false);

        return trendingProductRepository.save(trending);
    }
}

