package com.reyasa.reyasa_backend.repositories;

import com.reyasa.reyasa_backend.entities.HomePageVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HomePageVideoRepository
        extends JpaRepository<HomePageVideo, Long> {

    List<HomePageVideo> findByActiveTrueOrderByDisplayOrderAsc();

    List<HomePageVideo> findAllByOrderByDisplayOrderAsc();
}
