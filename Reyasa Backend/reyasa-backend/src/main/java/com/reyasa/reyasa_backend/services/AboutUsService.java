package com.reyasa.reyasa_backend.services;

import com.reyasa.reyasa_backend.entities.AboutUs;
import com.reyasa.reyasa_backend.repositories.AboutUsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AboutUsService {

    private final AboutUsRepository aboutUsRepository;

    @Transactional
    public AboutUs getAboutUs() {
        return aboutUsRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultContent);
    }

    private AboutUs createDefaultContent() {
        AboutUs about = new AboutUs();

        about.setTitle("About REYASA");

        about.setParagraph1(
                "REYASA is not just a clothing brand. "
                        + "It is a creation born from the passion, "
                        + "creativity and hard work of its owners."
        );

        about.setParagraph2(
                "Every design begins with an idea, and every "
                        + "piece is created with care, patience and "
                        + "attention to detail."
        );

        about.setParagraph3(
                "We put our heart into what we create because "
                        + "we believe that clothing should carry more "
                        + "than style — it should carry a story."
        );

        about.setParagraph4(
                "When you choose REYASA, you are not simply "
                        + "buying a shirt. You are becoming a part of "
                        + "the story we are creating."
        );

        about.setTagline(
                "Created with passion. Worn with love."
        );

        about.setSignature("— The Creators of REYASA");

        return aboutUsRepository.save(about);
    }

    @Transactional
    public AboutUs updateAboutUs(AboutUs request) {
        AboutUs about = aboutUsRepository
                .findFirstByOrderByIdAsc()
                .orElseGet(this::createDefaultContent);

        about.setTitle(request.getTitle().trim());
        about.setParagraph1(request.getParagraph1().trim());
        about.setParagraph2(request.getParagraph2().trim());
        about.setParagraph3(request.getParagraph3().trim());
        about.setParagraph4(request.getParagraph4().trim());
        about.setTagline(request.getTagline().trim());
        about.setSignature(request.getSignature().trim());

        return aboutUsRepository.save(about);
    }
}