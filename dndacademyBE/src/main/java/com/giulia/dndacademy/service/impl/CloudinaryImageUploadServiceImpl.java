package com.giulia.dndacademy.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.giulia.dndacademy.service.ImageUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryImageUploadServiceImpl implements ImageUploadService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;

    @Override
    public String uploadCharacterImage(MultipartFile file) {
        validateFile(file);

        try {
            Map uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", "dndacademy/characters",
                            "resource_type", "image"
                    )
            );

            String secureUrl = (String) uploadResult.get("secure_url");

            if (secureUrl == null || secureUrl.isBlank()) {
                throw new RuntimeException("Errore durante il recupero dell'URL sicuro dell'immagine");
            }

            return forceHttps(secureUrl);
        } catch (IOException e) {
            throw new RuntimeException("Errore durante l'upload dell'immagine");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Il file immagine è obbligatorio");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("L'immagine non può superare 2 MB");
        }

        String contentType = file.getContentType();

        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new RuntimeException("Formato immagine non valido. Usa JPG, PNG o WEBP");
        }
    }

    private String forceHttps(String url) {
        return url == null ? null : url.replace("http://", "https://");
    }
}