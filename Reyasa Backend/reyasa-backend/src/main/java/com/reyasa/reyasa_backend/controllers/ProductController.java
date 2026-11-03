package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.services.ProductService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manageproducts")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    private final ProductService productService;

    // Customer: Get all active products
    @GetMapping
    public ResponseEntity<List<Product>> getAllActiveProducts() {

        return ResponseEntity.ok(
                productService.getAllActiveProducts()
        );
    }

    // Customer: Get trending products
    @GetMapping("/trending")
    public ResponseEntity<List<Product>> getTrendingProducts() {

        return ResponseEntity.ok(
                productService.getTrendingProducts()
        );
    }

    // Customer: Get product by ID
    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(
            @PathVariable Long id
    ) {

        Product product = productService.getProductById(id);

        if (!product.isActive()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(product);
    }

    // Admin: Get all products
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Product>> getAllProductsForAdmin() {

        return ResponseEntity.ok(
                productService.getAllProductsForAdmin()
        );
    }

    // Admin: Add product
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> addProduct(
            @Valid @RequestBody Product product
    ) {

        Product savedProduct = productService.addProduct(product);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedProduct);
    }

    // Admin: Update product
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody Product product
    ) {

        return ResponseEntity.ok(
                productService.updateProduct(id, product)
        );
    }

    // Admin: Activate
    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> activateProduct(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.activateProduct(id)
        );
    }

    // Admin: Deactivate
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> deactivateProduct(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.deactivateProduct(id)
        );
    }

    // Admin: Update stock
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request
    ) {

        Integer quantity = request.get("stockQuantity");

        return ResponseEntity.ok(
                productService.updateStock(id, quantity)
        );
    }

    // Admin: Update trending status
    @PatchMapping("/{id}/trending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> updateTrendingStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request
    ) {

        Boolean trending = request.get("trending");

        if (trending == null) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(
                productService.updateTrendingStatus(id, trending)
        );
    }
}