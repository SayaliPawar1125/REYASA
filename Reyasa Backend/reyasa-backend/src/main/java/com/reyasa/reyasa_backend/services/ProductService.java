package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.repositories.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    // Get all active products
    @Transactional(readOnly = true)
    public List<Product> getAllActiveProducts() {

        return productRepository.findByActiveTrue()
                .stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .toList();
    }

    // Get trending products
    @Transactional(readOnly = true)
    public List<Product> getTrendingProducts() {

        return productRepository
                .findByActiveTrueAndTrendingTrueOrderByIdDesc();
    }

    // Get all products for admin
    @Transactional(readOnly = true)
    public List<Product> getAllProductsForAdmin() {

        return productRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .toList();
    }

    // Get product by ID
    @Transactional(readOnly = true)
    public Product getProductById(Long id) {

        return productRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Product not found with ID: " + id
                        ));
    }

    // Add product
    public Product addProduct(Product product) {

        product.setId(null);

        List<String> images = product.getImageKeys();

        if (images == null || images.isEmpty()) {

            if (product.getImageKey() == null
                    || product.getImageKey().isBlank()) {

                throw new IllegalArgumentException(
                        "At least one product image is required"
                );
            }

            images = new ArrayList<>(
                    List.of(product.getImageKey())
            );
        } else {
            images = new ArrayList<>(images);
        }

        product.setImageKeys(images);
        product.setImageKey(images.get(0));

        return productRepository.save(product);
    }

    // Update product
    public Product updateProduct(Long id, Product updatedProduct) {

        Product existing = getProductById(id);

        existing.setName(updatedProduct.getName());
        existing.setCategory(updatedProduct.getCategory());
        existing.setPrice(updatedProduct.getPrice());
        existing.setDescription(updatedProduct.getDescription());

        existing.setAvailableSizes(updatedProduct.getAvailableSizes());
        existing.setStockQuantity(updatedProduct.getStockQuantity());

        existing.setActive(updatedProduct.isActive());
        existing.setTrending(updatedProduct.isTrending());

        // Replace images only when new image keys are provided
        if (updatedProduct.getImageKeys() != null
                && !updatedProduct.getImageKeys().isEmpty()) {

            List<String> images =
                    new ArrayList<>(updatedProduct.getImageKeys());

            existing.setImageKeys(images);
            existing.setImageKey(images.get(0));

        } else if (updatedProduct.getImageKey() != null
                && !updatedProduct.getImageKey().isBlank()) {

            existing.setImageKey(updatedProduct.getImageKey());

            existing.setImageKeys(
                    new ArrayList<>(List.of(updatedProduct.getImageKey()))
            );
        }

        return productRepository.save(existing);
    }

    // Activate product
    public Product activateProduct(Long id) {

        Product product = getProductById(id);
        product.setActive(true);

        return productRepository.save(product);
    }

    // Deactivate product
    public Product deactivateProduct(Long id) {

        Product product = getProductById(id);
        product.setActive(false);

        return productRepository.save(product);
    }

    // Update stock
    public Product updateStock(Long id, Integer quantity) {

        if (quantity == null || quantity < 0) {
            throw new IllegalArgumentException(
                    "Stock quantity cannot be negative"
            );
        }

        Product product = getProductById(id);
        product.setStockQuantity(quantity);

        return productRepository.save(product);
    }

    // Update trending
    public Product updateTrendingStatus(Long id, boolean trending) {

        Product product = getProductById(id);
        product.setTrending(trending);

        return productRepository.save(product);
    }
}