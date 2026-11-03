package com.reyasa.reyasa_backend.dto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record WishlistResponse(

        Long id,

        Long productId,

        String name,

        String category,

        BigDecimal price,

        String description,

        String imageKey,

        List<String> imageKeys,

        String availableSizes,

        Integer stockQuantity,

        boolean active,

        LocalDateTime createdAt

) {
}
