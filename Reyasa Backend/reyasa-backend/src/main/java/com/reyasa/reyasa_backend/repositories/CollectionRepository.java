
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CollectionRepository
        extends JpaRepository<Collection, Long> {

    // Find a collection by its name
    Optional<Collection> findByNameIgnoreCase(String name);

    // Get active collections for the customer website
    List<Collection> findByActiveTrueOrderByNameAsc();

    // Check whether a collection name already exists
    boolean existsByNameIgnoreCase(String name);
}
