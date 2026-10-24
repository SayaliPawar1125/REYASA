
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.TrendingProduct;
import com.reyasa.reyasa_backend.services.TrendingProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trending")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TrendingProductController {

    private final TrendingProductService trendingProductService;

    // Public: get active trending products for the homepage
    @GetMapping
    public ResponseEntity<List<TrendingProduct>> getTrendingProducts() {
        return ResponseEntity.ok(
                trendingProductService.getActiveTrendingProducts()
        );
    }

    // Admin: get all trending entries
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TrendingProduct>> getAllTrendingProducts() {
        return ResponseEntity.ok(
                trendingProductService.getAllTrendingProducts()
        );
    }

    // Admin: add a product to trending
    @PostMapping("/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TrendingProduct> addTrendingProduct(
            @PathVariable Long productId,
            @RequestBody Map<String, Integer> request) {

        Integer displayOrder = request.getOrDefault("displayOrder", 0);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                trendingProductService.addTrendingProduct(
                        productId, displayOrder
                )
        );
    }

    // Admin: change the display order
    @PatchMapping("/{trendingId}/order")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TrendingProduct> updateDisplayOrder(
            @PathVariable Long trendingId,
            @RequestBody Map<String, Integer> request) {

        return ResponseEntity.ok(
                trendingProductService.updateDisplayOrder(
                        trendingId, request.get("displayOrder")
                )
        );
    }

    // Admin: remove a product from trending
    @PatchMapping("/{trendingId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TrendingProduct> deactivateTrendingProduct(
            @PathVariable Long trendingId) {

        return ResponseEntity.ok(
                trendingProductService.deactivateTrendingProduct(
                        trendingId
                )
        );
    }
}
