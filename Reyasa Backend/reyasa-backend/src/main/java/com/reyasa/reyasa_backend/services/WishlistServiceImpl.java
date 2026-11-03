package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.WishlistResponse;
import com.reyasa.reyasa_backend.entities.Product;
import com.reyasa.reyasa_backend.entities.User;
import com.reyasa.reyasa_backend.entities.Wishlist;
import com.reyasa.reyasa_backend.repositories.ProductRepository;
import com.reyasa.reyasa_backend.repositories.UserRepository;
import com.reyasa.reyasa_backend.repositories.WishlistRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;

    private final UserRepository userRepository;

    private final ProductRepository productRepository;

    // ADD PRODUCT TO WISHLIST
    @Override
    public WishlistResponse addToWishlist(String email, Long productId) {

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"
                ));

        if (!product.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "This product is not available"
            );
        }

        // Check whether product already exists in wishlist
        Wishlist existingWishlist = wishlistRepository
                .findByUser_IdAndProduct_Id(user.getId(), productId)
                .orElse(null);

        if (existingWishlist != null) {
            return convertToResponse(existingWishlist);
        }

        Wishlist wishlist = Wishlist.builder()
                .user(user)
                .product(product)
                .build();

        Wishlist savedWishlist = wishlistRepository.save(wishlist);

        return convertToResponse(savedWishlist);
    }

    // GET ALL WISHLIST PRODUCTS
    @Override
    @Transactional(readOnly = true)
    public List<WishlistResponse> getWishlist(String email) {

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        List<Wishlist> wishlistItems =
                wishlistRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());

        return wishlistItems.stream()
                .map(this::convertToResponse)
                .toList();
    }

    // GET WISHLIST COUNT
    @Override
    @Transactional(readOnly = true)
    public long getWishlistCount(String email) {

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        return wishlistRepository.countByUser_Id(user.getId());
    }

    // REMOVE PRODUCT FROM WISHLIST
    @Override
    public void removeFromWishlist(String email, Long productId) {

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                ));

        Wishlist wishlist = wishlistRepository
                .findByUser_IdAndProduct_Id(user.getId(), productId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Wishlist product not found"
                ));

        wishlistRepository.delete(wishlist);
    }

    // CONVERT ENTITY INTO DTO
    private WishlistResponse convertToResponse(Wishlist wishlist) {

        Product product = wishlist.getProduct();

        return new WishlistResponse(

                wishlist.getId(),

                product.getId(),

                product.getName(),

                product.getCategory(),

                product.getPrice(),

                product.getDescription(),

                product.getImageKey(),

                product.getImageKeys() == null
                        ? List.of()
                        : product.getImageKeys(),

                product.getAvailableSizes(),

                product.getStockQuantity(),

                product.isActive(),

                wishlist.getCreatedAt()
        );
    }
}