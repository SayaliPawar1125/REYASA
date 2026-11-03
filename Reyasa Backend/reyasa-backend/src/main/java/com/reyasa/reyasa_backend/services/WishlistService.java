package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.dto.WishlistResponse;

import java.util.List;

public interface WishlistService {

    WishlistResponse addToWishlist(String email, Long productId);

    List<WishlistResponse> getWishlist(String email);

    long getWishlistCount(String email);

    void removeFromWishlist(String email, Long productId);
}