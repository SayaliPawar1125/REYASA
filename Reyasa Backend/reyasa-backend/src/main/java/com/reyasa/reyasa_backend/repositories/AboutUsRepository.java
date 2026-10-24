package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.AboutUs;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AboutUsRepository
        extends JpaRepository<AboutUs, Long> {

    Optional<AboutUs> findFirstByOrderByIdAsc();
}