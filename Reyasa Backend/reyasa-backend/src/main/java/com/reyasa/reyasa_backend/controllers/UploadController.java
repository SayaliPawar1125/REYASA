
package com.reyasa.reyasa_backend.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@CrossOrigin(origins = "http://localhost:5173")
public class UploadController {

    private final Path uploadDirectory =
            Paths.get("uploads").toAbsolutePath().normalize();

    @PostMapping(
            value = "/image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {

        try {
            if (file == null || file.isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Please select an image"
                );
            }

            if (file.getSize() > 5L * 1024 * 1024) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Image size must be 5 MB or less"
                );
            }

            String contentType = file.getContentType();

            Set<String> allowedTypes = Set.of(
                    "image/jpeg",
                    "image/png",
                    "image/webp"
            );

            if (contentType == null ||
                    !allowedTypes.contains(contentType)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Only JPG, PNG and WEBP images are allowed"
                );
            }

            String extension = switch (contentType) {
                case "image/jpeg" -> ".jpg";
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unsupported image format"
                );
            };

            Files.createDirectories(uploadDirectory);

            String imageKey = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 20) + extension;

            Path destination = uploadDirectory
                    .resolve(imageKey)
                    .normalize();

            if (!destination.startsWith(uploadDirectory)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid file path"
                );
            }

            Files.copy(file.getInputStream(), destination);

            return ResponseEntity.ok(Map.of(
                    "imageKey", imageKey,
                    "imageUrl", "/uploads/" + imageKey
            ));

        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to upload image"
            );
        }
    }
}
