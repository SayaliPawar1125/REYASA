
package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.Collection;
import com.reyasa.reyasa_backend.repositories.CollectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CollectionService {

    private final CollectionRepository collectionRepository;

    // Get active collections for customers
    @Transactional(readOnly = true)
    public List<Collection> getActiveCollections() {
        return collectionRepository.findByActiveTrueOrderByNameAsc();
    }

    // Get all collections for admin
    @Transactional(readOnly = true)
    public List<Collection> getAllCollections() {
        return collectionRepository.findAll();
    }

    // Get a collection by ID
    @Transactional(readOnly = true)
    public Collection getCollectionById(Long id) {
        return collectionRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Collection not found with ID: " + id
                        ));
    }

    // Create a collection
    public Collection createCollection(Collection collection) {
        collection.setId(null);

        if (collectionRepository.existsByNameIgnoreCase(
                collection.getName().trim())) {
            throw new IllegalArgumentException(
                    "A collection with this name already exists"
            );
        }

        collection.setName(collection.getName().trim());

        return collectionRepository.save(collection);
    }

    // Update a collection
    public Collection updateCollection(
            Long id, Collection updatedCollection) {

        Collection existing = getCollectionById(id);

        String newName = updatedCollection.getName().trim();

        collectionRepository.findByNameIgnoreCase(newName)
                .filter(found -> !found.getId().equals(id))
                .ifPresent(found -> {
                    throw new IllegalArgumentException(
                            "A collection with this name already exists"
                    );
                });

        existing.setName(newName);
        existing.setDescription(updatedCollection.getDescription());
        existing.setImageUrl(updatedCollection.getImageUrl());
        existing.setActive(updatedCollection.isActive());

        return collectionRepository.save(existing);
    }

    // Deactivate a collection
    public Collection deactivateCollection(Long id) {
        Collection collection = getCollectionById(id);
        collection.setActive(false);

        return collectionRepository.save(collection);
    }
}
