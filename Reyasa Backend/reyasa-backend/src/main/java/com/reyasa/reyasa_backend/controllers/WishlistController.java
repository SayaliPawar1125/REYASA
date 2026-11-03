package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.dto.WishlistResponse;
import com.reyasa.reyasa_backend.services.WishlistService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    // ADD TO WISHLIST
    @PostMapping("/{productId}")
    public ResponseEntity<WishlistResponse> addToWishlist(
            @PathVariable Long productId,
            Authentication authentication
    ) {

        WishlistResponse response = wishlistService.addToWishlist(
                authentication.getName(),
                productId
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET USER WISHLIST
    @GetMapping
    public ResponseEntity<List<WishlistResponse>> getWishlist(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                wishlistService.getWishlist(authentication.getName())
        );
    }

    // GET WISHLIST COUNT
    @GetMapping("/count")
    public ResponseEntity<Long> getWishlistCount(
            Authentication authentication
    ) {

        return ResponseEntity.ok(
                wishlistService.getWishlistCount(authentication.getName())
        );
    }

    // REMOVE FROM WISHLIST
    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> removeFromWishlist(
            @PathVariable Long productId,
            Authentication authentication
    ) {

        wishlistService.removeFromWishlist(
                authentication.getName(),
                productId
        );

        return ResponseEntity.noContent().build();
    }
}