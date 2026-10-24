
package com.reyasa.reyasa_backend.controllers;

import com.reyasa.reyasa_backend.entities.Collection;
import com.reyasa.reyasa_backend.services.CollectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class CollectionController {

    private final CollectionService collectionService;

    // Public: get active collections
    @GetMapping
    public ResponseEntity<List<Collection>> getActiveCollections() {
        return ResponseEntity.ok(
                collectionService.getActiveCollections()
        );
    }

    // Admin: get all collections
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Collection>> getAllCollections() {
        return ResponseEntity.ok(
                collectionService.getAllCollections()
        );
    }

    // Admin: get collection by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Collection> getCollectionById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                collectionService.getCollectionById(id)
        );
    }

    // Admin: create collection
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Collection> createCollection(
            @Valid @RequestBody Collection collection) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(collectionService.createCollection(collection));
    }

    // Admin: update collection
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Collection> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody Collection collection) {
        return ResponseEntity.ok(
                collectionService.updateCollection(id, collection)
        );
    }

    // Admin: deactivate collection
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Collection> deactivateCollection(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                collectionService.deactivateCollection(id)
        );
    }
}
