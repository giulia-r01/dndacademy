package com.giulia.dndacademy.service;

import org.springframework.web.multipart.MultipartFile;

public interface ImageUploadService {

    String uploadCharacterImage(MultipartFile file);
}