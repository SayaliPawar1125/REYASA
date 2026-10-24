
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    // Get all active products for customers
    @Transactional(readOnly = true)
    public List<Product> getAllActiveProducts() {
        return productRepository.findAll()
                .stream()
                .filter(Product::isActive)
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .toList();
    }

    // Get only active and trending products for Home page
    @Transactional(readOnly = true)
    public List<Product> getTrendingProducts() {
        return productRepository
                .findByActiveTrueAndTrendingTrueOrderByIdDesc();
    }

    // Get all products for admin, including inactive products
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

    // Add a new product
    public Product addProduct(Product product) {
        product.setId(null);
        return productRepository.save(product);
    }

    // Update an existing product
    public Product updateProduct(Long id, Product updatedProduct) {

        Product existing = getProductById(id);

        existing.setName(updatedProduct.getName());
        existing.setCategory(updatedProduct.getCategory());
        existing.setPrice(updatedProduct.getPrice());
        existing.setDescription(updatedProduct.getDescription());
        existing.setImageKey(updatedProduct.getImageKey());
        existing.setAvailableSizes(updatedProduct.getAvailableSizes());
        existing.setStockQuantity(updatedProduct.getStockQuantity());
        existing.setActive(updatedProduct.isActive());
        existing.setTrending(updatedProduct.isTrending());

        return productRepository.save(existing);
    }

    // Activate a product
    public Product activateProduct(Long id) {
        Product product = getProductById(id);
        product.setActive(true);
        return productRepository.save(product);
    }

    // Deactivate a product
    public Product deactivateProduct(Long id) {
        Product product = getProductById(id);
        product.setActive(false);
        return productRepository.save(product);
    }

    // Update product stock
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

    // Mark or unmark a product as trending
    public Product updateTrendingStatus(Long id, boolean trending) {

        Product product = getProductById(id);
        product.setTrending(trending);

        return productRepository.save(product);
    }
}
