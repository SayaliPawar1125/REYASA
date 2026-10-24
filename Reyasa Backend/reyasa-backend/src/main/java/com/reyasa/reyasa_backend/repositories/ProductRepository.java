
package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrueAndTrendingTrueOrderByIdDesc();
}
